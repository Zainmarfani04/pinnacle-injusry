// GET /api/escalations/check
//
// Trigger-on-request escalation runner. Called silently on dashboard load.
// Auth-gated — returns 401 if session is invalid.
// Rate-limited — returns early if called within the last 5 minutes.
// The rate limit state lives in the `system_events` table (no in-memory
// cache, which would reset on every cold Vercel start).

import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { checkAndEscalateStaleLeads } from '@/lib/escalations'

const RATE_LIMIT_SECONDS = 300 // 5 minutes — prevents hammering on fast nav

export async function GET(_req: NextRequest) {
  try {
    // ── Authentication ──────────────────────────────────────────────────────
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminClient = createAdminClient()

    // ── Rate limit guard ────────────────────────────────────────────────────
    // Check system_events for a recent 'escalation_check' entry.
    // If one exists within the last RATE_LIMIT_SECONDS, return early.
    const rateLimitCutoff = new Date(
      Date.now() - RATE_LIMIT_SECONDS * 1000
    ).toISOString()

    const { data: recentRun } = await adminClient
      .from('system_events')
      .select('created_at')
      .eq('event_type', 'escalation_check')
      .gte('created_at', rateLimitCutoff)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (recentRun) {
      const nextCheckIn = Math.max(
        0,
        Math.ceil(
          (new Date(recentRun.created_at).getTime() +
            RATE_LIMIT_SECONDS * 1000 -
            Date.now()) /
            1000
        )
      )
      return NextResponse.json({
        checked: false,
        reason: 'rate_limited',
        next_check_in: nextCheckIn,
      })
    }

    // ── Log this run before executing (prevents race on concurrent requests) ─
    await adminClient
      .from('system_events')
      .insert({ event_type: 'escalation_check' })

    // ── Run all escalation rules ────────────────────────────────────────────
    const results = await checkAndEscalateStaleLeads()

    console.log('[escalations/check] Run complete at', new Date().toISOString(), results)

    return NextResponse.json({
      checked: true,
      timestamp: new Date().toISOString(),
      results,
    })
  } catch (err: any) {
    console.error('[escalations/check] Unexpected error:', err)
    return NextResponse.json(
      { error: 'Escalation check failed', detail: err.message },
      { status: 500 }
    )
  }
}
