// ─────────────────────────────────────────────────────────────────────────────
// Pinnacle Injury Consultants — Stale Case Escalation Rules
//
// Required env vars:
//   ADMIN_EMAIL            — receives all escalation alerts
//   ADMIN_PHONE            — receives SOL SMS alerts (optional but recommended)
//   NEXT_PUBLIC_APP_URL    — used to build case deep-links in emails
//   RESEND_API_KEY         — email sending
//   TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN / TWILIO_PHONE_NUMBER — SMS
//
// Trigger pattern: called from GET /api/escalations/check on dashboard load.
// All 4 rules run in parallel via Promise.all.
// Each rule is wrapped in its own try/catch — one failure never blocks others.
// ─────────────────────────────────────────────────────────────────────────────

import { createAdminClient } from '@/lib/supabase/server'
import { sendEmail, sendSMS } from '@/lib/notifications'

// ── Env var check ──────────────────────────────────────────────────────────────
if (!process.env.ADMIN_EMAIL) {
  console.error('[escalations] ADMIN_EMAIL env var not set — admin notifications will fail')
}

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? ''
const ADMIN_PHONE = process.env.ADMIN_PHONE ?? ''
const APP_URL = (process.env.NEXT_PUBLIC_APP_URL ?? '').replace(/\/$/, '')

// ─────────────────────────────────────────────────────────────────────────────
// Shared email template
// ─────────────────────────────────────────────────────────────────────────────
function buildEscalationEmail(opts: {
  title: string
  subtitle: string
  caseNumber: string
  clientName: string
  caseType: string
  caseUrl: string
  extraRows?: { label: string; value: string }[]
  body?: string
}): string {
  const rows = (opts.extraRows ?? [])
    .map(
      r => `
      <tr>
        <td style="padding:6px 0;font-size:11px;color:#4e5668;text-transform:uppercase;width:160px;vertical-align:top">${r.label}</td>
        <td style="padding:6px 0;font-size:14px">${r.value}</td>
      </tr>`
    )
    .join('')

  return `
    <div style="font-family:sans-serif;max-width:580px;margin:0 auto;background:#0a0c10;color:#f0f2f7;border-radius:12px;overflow:hidden">
      <div style="background:linear-gradient(135deg,#c9a84c,#e8c76a);padding:24px 32px">
        <h1 style="margin:0;color:#0a0c10;font-size:20px;font-weight:700">${opts.title}</h1>
        <p style="margin:4px 0 0;color:#0a0c10;opacity:.75;font-size:13px">${opts.subtitle}</p>
      </div>
      <div style="padding:32px">
        <div style="background:#161b25;border:1px solid rgba(255,255,255,.07);border-radius:8px;padding:20px;margin-bottom:24px">
          <p style="margin:0 0 4px;font-size:11px;color:#4e5668;text-transform:uppercase;letter-spacing:.06em">Case Number</p>
          <p style="margin:0 0 20px;font-weight:700;color:#c9a84c;font-size:20px">${opts.caseNumber}</p>
          <table style="width:100%;border-collapse:collapse">
            <tr>
              <td style="padding:6px 0;font-size:11px;color:#4e5668;text-transform:uppercase;width:160px">Client</td>
              <td style="padding:6px 0;font-size:14px;font-weight:600">${opts.clientName}</td>
            </tr>
            <tr>
              <td style="padding:6px 0;font-size:11px;color:#4e5668;text-transform:uppercase">Case Type</td>
              <td style="padding:6px 0;font-size:14px">${opts.caseType}</td>
            </tr>
            ${rows}
          </table>
          ${opts.body
            ? `<div style="margin-top:16px;padding-top:16px;border-top:1px solid rgba(255,255,255,.07)">
                <p style="margin:0;font-size:14px;color:#8d95a8;line-height:1.65">${opts.body}</p>
               </div>`
            : ''}
        </div>
        <a href="${opts.caseUrl}"
           style="display:inline-block;background:linear-gradient(135deg,#c9a84c,#e8c76a);color:#0a0c10;font-weight:600;padding:14px 32px;border-radius:8px;text-decoration:none;font-size:14px">
          View Case in CMT &rarr;
        </a>
        <p style="margin:24px 0 0;font-size:12px;color:#4e5668">
          Pinnacle Injury Consultants &middot; Case Management System &middot; Automated escalation alert
        </p>
      </div>
    </div>`
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper: write escalation metadata back to the case row
// ─────────────────────────────────────────────────────────────────────────────
async function flagCase(
  adminClient: ReturnType<typeof createAdminClient>,
  caseId: string,
  reason: string,
  extra: Record<string, unknown> = {}
): Promise<void> {
  const { error } = await adminClient
    .from('cases')
    .update({ escalated_at: new Date().toISOString(), escalation_reason: reason, ...extra })
    .eq('id', caseId)

  if (error) {
    console.error(`[escalations] flagCase failed for ${caseId} (${reason}):`, error.message)
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper: insert a system note on the case timeline
// Uses the first active admin profile as the author. If none found, skips with warning.
// ─────────────────────────────────────────────────────────────────────────────
async function writeSystemNote(
  adminClient: ReturnType<typeof createAdminClient>,
  caseId: string,
  content: string
): Promise<void> {
  const { data: adminProfile } = await adminClient
    .from('profiles')
    .select('id')
    .eq('role', 'admin')
    .eq('is_active', true)
    .limit(1)
    .maybeSingle()

  if (!adminProfile) {
    console.warn('[escalations] No active admin profile found — system note skipped for case', caseId)
    return
  }

  const { error } = await adminClient.from('case_notes').insert({
    case_id: caseId,
    author_id: adminProfile.id,
    content,
    is_internal: true,
  })

  if (error) {
    console.error('[escalations] writeSystemNote failed for case', caseId, ':', error.message)
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper: re-escalation guard
// Returns true if this case should be skipped (already escalated recently).
// ─────────────────────────────────────────────────────────────────────────────
function shouldSkip(
  c: { escalated_at?: string | null; escalation_reason?: string | null },
  reason: string,
  withinMs: number
): boolean {
  return (
    c.escalation_reason === reason &&
    !!c.escalated_at &&
    new Date(c.escalated_at).getTime() > Date.now() - withinMs
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// RULE 1 — New lead, no specialist assigned after 24 hours
//
// DB status mapping: 'lead' (the schema enum value for a new incoming lead)
// Guard: don't re-escalate if escalation_reason = 'no_specialist_24h'
//        AND escalated_at is within the last 24 hours.
// ══════════════════════════════════════════════════════════════════════════════
async function runRule1(adminClient: ReturnType<typeof createAdminClient>): Promise<void> {
  const cutoff24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  const { data: cases, error } = await adminClient
    .from('cases')
    .select(`
      id, case_number, case_type, created_at,
      escalated_at, escalation_reason,
      client:profiles!cases_client_id_fkey(full_name)
    `)
    .eq('status', 'lead')
    .is('assigned_specialist_id', null)
    .lt('created_at', cutoff24h)

  if (error) {
    console.error('[escalations] Rule 1 query failed:', error.message)
    return
  }
  if (!cases?.length) return

  // Query all active specialists once for the loop
  const { data: specialists } = await adminClient
    .from('profiles')
    .select('email')
    .eq('role', 'specialist')
    .eq('is_active', true)

  for (const c of cases) {
    if (shouldSkip(c, 'no_specialist_24h', 24 * 60 * 60 * 1000)) continue

    const clientName = (c.client as any)?.full_name ?? 'Unknown Client'
    const caseUrl = `${APP_URL}/dashboard/cases/${c.id}`
    const caseType = String(c.case_type).replace(/_/g, ' ')
    const createdAt = new Date(c.created_at).toLocaleString('en-US', { timeZone: 'America/Chicago' })
    const subject = `⚠️ Escalation: New lead unassigned for 24+ hours — ${clientName}`

    const html = buildEscalationEmail({
      title: '⚠️ Unassigned Lead — Action Required',
      subtitle: 'This lead has had no specialist assigned for over 24 hours.',
      caseNumber: c.case_number,
      clientName,
      caseType,
      caseUrl,
      extraRows: [{ label: 'Submitted', value: createdAt + ' CT' }],
      body: 'This case was received more than 24 hours ago and has not been assigned to a specialist. Please assign immediately.',
    })

    await flagCase(adminClient, c.id, 'no_specialist_24h')

    if (ADMIN_EMAIL) await sendEmail(ADMIN_EMAIL, subject, html)
    for (const s of specialists ?? []) {
      if (s.email) await sendEmail(s.email, subject, html)
    }

    console.log('[escalation] Rule 1 fired for case:', c.id, c.case_number)
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// RULE 2 — Intake in progress, stale for 48 hours
//
// DB status mapping: 'intake'
// Notifies: assigned specialist + admin
// Guard: don't re-escalate if escalation_reason = 'intake_stale_48h' within 24h.
// ══════════════════════════════════════════════════════════════════════════════
async function runRule2(adminClient: ReturnType<typeof createAdminClient>): Promise<void> {
  const cutoff48h = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()

  const { data: cases, error } = await adminClient
    .from('cases')
    .select(`
      id, case_number, case_type, updated_at,
      escalated_at, escalation_reason,
      client:profiles!cases_client_id_fkey(full_name),
      specialist:profiles!cases_assigned_specialist_id_fkey(email, full_name)
    `)
    .eq('status', 'intake')
    .lt('updated_at', cutoff48h)

  if (error) {
    console.error('[escalations] Rule 2 query failed:', error.message)
    return
  }
  if (!cases?.length) return

  for (const c of cases) {
    if (shouldSkip(c, 'intake_stale_48h', 24 * 60 * 60 * 1000)) continue

    const clientName = (c.client as any)?.full_name ?? 'Unknown Client'
    const specialist = c.specialist as any
    const caseUrl = `${APP_URL}/dashboard/cases/${c.id}`
    const caseType = String(c.case_type).replace(/_/g, ' ')
    const lastActivity = new Date(c.updated_at).toLocaleString('en-US', { timeZone: 'America/Chicago' })
    const subject = `⚠️ Escalation: Intake stale for 48+ hours — ${clientName}`

    const html = buildEscalationEmail({
      title: '⚠️ Stale Intake — Action Required',
      subtitle: 'This case has been in intake for over 48 hours with no update.',
      caseNumber: c.case_number,
      clientName,
      caseType,
      caseUrl,
      extraRows: [
        { label: 'Assigned Specialist', value: specialist?.full_name ?? 'Unassigned' },
        { label: 'Last Activity', value: lastActivity + ' CT' },
      ],
      body: 'Intake has stalled on this case. Please review, complete the intake, or escalate to the next stage.',
    })

    await flagCase(adminClient, c.id, 'intake_stale_48h')

    if (ADMIN_EMAIL) await sendEmail(ADMIN_EMAIL, subject, html)
    if (specialist?.email) await sendEmail(specialist.email, subject, html)

    console.log('[escalation] Rule 2 fired for case:', c.id, c.case_number)
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// RULE 3 — Active case, no activity in 72 hours
//
// DB status mapping: 'sent_to_attorney' | 'accepted' | 'signed'
// Action: email admin, write system note to case timeline
// Guard: don't re-escalate if escalation_reason = 'inactive_72h' within 24h.
// ══════════════════════════════════════════════════════════════════════════════
async function runRule3(adminClient: ReturnType<typeof createAdminClient>): Promise<void> {
  const cutoff72h = new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString()

  const { data: cases, error } = await adminClient
    .from('cases')
    .select(`
      id, case_number, case_type, updated_at,
      escalated_at, escalation_reason,
      client:profiles!cases_client_id_fkey(full_name),
      specialist:profiles!cases_assigned_specialist_id_fkey(full_name),
      lawyer:profiles!cases_assigned_lawyer_id_fkey(full_name)
    `)
    .in('status', ['sent_to_attorney', 'accepted', 'signed'])
    .lt('updated_at', cutoff72h)

  if (error) {
    console.error('[escalations] Rule 3 query failed:', error.message)
    return
  }
  if (!cases?.length) return

  for (const c of cases) {
    if (shouldSkip(c, 'inactive_72h', 24 * 60 * 60 * 1000)) continue

    const clientName = (c.client as any)?.full_name ?? 'Unknown Client'
    const specialistName = (c.specialist as any)?.full_name ?? 'Unassigned'
    const lawyerName = (c.lawyer as any)?.full_name ?? 'Unassigned'
    const caseUrl = `${APP_URL}/dashboard/cases/${c.id}`
    const caseType = String(c.case_type).replace(/_/g, ' ')
    const lastActivity = new Date(c.updated_at).toLocaleString('en-US', { timeZone: 'America/Chicago' })
    const subject = `⚠️ Escalation: Case inactive 72+ hours — ${clientName}`

    const html = buildEscalationEmail({
      title: '⚠️ Inactive Active Case',
      subtitle: 'This case has had no updates in over 72 hours.',
      caseNumber: c.case_number,
      clientName,
      caseType,
      caseUrl,
      extraRows: [
        { label: 'Assigned Specialist', value: specialistName },
        { label: 'Assigned Lawyer', value: lawyerName },
        { label: 'Last Activity', value: lastActivity + ' CT' },
      ],
      body: 'No updates have been logged on this case in over 72 hours. Please review and document the current status.',
    })

    await flagCase(adminClient, c.id, 'inactive_72h')
    if (ADMIN_EMAIL) await sendEmail(ADMIN_EMAIL, subject, html)

    await writeSystemNote(
      adminClient,
      c.id,
      'Automated escalation: case has had no activity for 72+ hours.'
    )

    console.log('[escalation] Rule 3 fired for case:', c.id, c.case_number)
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// RULE 4 — Texas statute of limitations warning (30d / 14d / 7d)
//
// Fires once per threshold level. Each level is its own escalation_reason so
// the guard lets the 14d fire even if 30d already ran, and 7d fires even if
// 14d already ran.
//
// Notifies: assigned lawyer (email + SMS) + admin (email + SMS if ADMIN_PHONE set)
// Marks case priority = 'urgent' in the database.
// ══════════════════════════════════════════════════════════════════════════════
async function runRule4(adminClient: ReturnType<typeof createAdminClient>): Promise<void> {
  // Query all open cases that have an incident_date set
  const OPEN_STATUSES = ['lead', 'intake', 'sent_to_attorney', 'accepted', 'signed']

  const { data: cases, error } = await adminClient
    .from('cases')
    .select(`
      id, case_number, case_type, incident_date,
      escalated_at, escalation_reason,
      client:profiles!cases_client_id_fkey(full_name),
      lawyer:profiles!cases_assigned_lawyer_id_fkey(full_name, email, phone)
    `)
    .in('status', OPEN_STATUSES)
    .not('incident_date', 'is', null)

  if (error) {
    console.error('[escalations] Rule 4 query failed:', error.message)
    return
  }
  if (!cases?.length) return

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  for (const c of cases) {
    if (!c.incident_date) continue

    // Texas SOL: 2 years from incident date
    const incident = new Date(c.incident_date)
    const solDeadline = new Date(incident)
    solDeadline.setFullYear(solDeadline.getFullYear() + 2)

    const daysUntilSol = Math.floor(
      (solDeadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    )

    // Determine which threshold bracket this case falls into
    // Each bracket fires once (guard checks the specific reason)
    type Threshold = { reason: string; label: string }
    let threshold: Threshold | null = null

    if (daysUntilSol >= 1 && daysUntilSol <= 7) {
      threshold = { reason: 'sol_warning_7d', label: '7 days' }
    } else if (daysUntilSol >= 8 && daysUntilSol <= 14) {
      threshold = { reason: 'sol_warning_14d', label: '14 days' }
    } else if (daysUntilSol >= 15 && daysUntilSol <= 30) {
      threshold = { reason: 'sol_warning_30d', label: '30 days' }
    }

    if (!threshold) continue

    // Guard: fire each threshold level only once (no time window — SOL warnings
    // are one-shot per threshold)
    if (c.escalation_reason === threshold.reason) continue

    const clientName = (c.client as any)?.full_name ?? 'Unknown Client'
    const lawyer = c.lawyer as any
    const caseUrl = `${APP_URL}/dashboard/cases/${c.id}`
    const caseType = String(c.case_type).replace(/_/g, ' ')

    const fmtDate = (d: Date) =>
      d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

    const incidentDateStr = fmtDate(incident)
    const solDateStr = fmtDate(solDeadline)
    const subject = `🚨 URGENT: Statute of limitations in ${daysUntilSol} days — ${clientName}`

    const html = buildEscalationEmail({
      title: `🚨 SOL WARNING — ${daysUntilSol} Days Remaining`,
      subtitle: 'Immediate action required. Statute of limitations deadline is approaching.',
      caseNumber: c.case_number,
      clientName,
      caseType,
      caseUrl,
      extraRows: [
        { label: 'Incident Date', value: incidentDateStr },
        {
          label: 'SOL Deadline',
          value: `<strong style="color:#e53e3e;font-size:15px">${solDateStr}</strong>`,
        },
        {
          label: 'Days Remaining',
          value: `<strong style="color:#e53e3e;font-size:15px">${daysUntilSol} days</strong>`,
        },
        { label: 'Assigned Lawyer', value: lawyer?.full_name ?? 'Unassigned' },
      ],
      body: 'A lawsuit must be filed before the SOL deadline or the client permanently loses the right to compensation. Take action immediately.',
    })

    const smsBody =
      `URGENT: SOL deadline in ${daysUntilSol} days for ${clientName}. ` +
      `Incident: ${incidentDateStr}. Deadline: ${solDateStr}. ` +
      `Check CMT: ${caseUrl}`

    // Flag case as urgent
    await flagCase(adminClient, c.id, threshold.reason, { priority: 'urgent' })

    // Notify admin
    if (ADMIN_EMAIL) await sendEmail(ADMIN_EMAIL, subject, html)
    if (ADMIN_PHONE) await sendSMS(ADMIN_PHONE, smsBody)

    // Notify lawyer
    if (lawyer?.email) await sendEmail(lawyer.email, subject, html)
    if (lawyer?.phone) await sendSMS(lawyer.phone, smsBody)

    console.log(
      '[escalation] Rule 4 SOL WARNING for case:',
      c.id,
      c.case_number,
      `(${daysUntilSol}d remaining, threshold: ${threshold.reason})`
    )
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// Main export — runs all 4 rules in parallel
// ══════════════════════════════════════════════════════════════════════════════
export type EscalationResult = {
  rule1: 'ok' | 'error'
  rule2: 'ok' | 'error'
  rule3: 'ok' | 'error'
  rule4: 'ok' | 'error'
}

export async function checkAndEscalateStaleLeads(): Promise<EscalationResult> {
  const adminClient = createAdminClient()

  const [r1, r2, r3, r4] = await Promise.all([
    runRule1(adminClient)
      .then(() => 'ok' as const)
      .catch(err => {
        console.error('[escalations] Rule 1 threw unexpectedly:', err)
        return 'error' as const
      }),
    runRule2(adminClient)
      .then(() => 'ok' as const)
      .catch(err => {
        console.error('[escalations] Rule 2 threw unexpectedly:', err)
        return 'error' as const
      }),
    runRule3(adminClient)
      .then(() => 'ok' as const)
      .catch(err => {
        console.error('[escalations] Rule 3 threw unexpectedly:', err)
        return 'error' as const
      }),
    runRule4(adminClient)
      .then(() => 'ok' as const)
      .catch(err => {
        console.error('[escalations] Rule 4 threw unexpectedly:', err)
        return 'error' as const
      }),
  ])

  return { rule1: r1, rule2: r2, rule3: r3, rule4: r4 }
}
