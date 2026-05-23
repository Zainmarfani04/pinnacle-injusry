import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'
import { sendLawyerCaseEmail } from '@/lib/notifications'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const adminClient = createAdminClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Verify caller is admin or specialist
    const { data: callerProfile } = await adminClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!callerProfile || !['admin', 'specialist'].includes(callerProfile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()

    // ── Fetch current case before update so we can detect lawyer change ───────
    const { data: currentCase, error: fetchError } = await adminClient
      .from('cases')
      .select('*, client:profiles!cases_client_id_fkey(full_name)')
      .eq('id', id)
      .single()

    if (fetchError || !currentCase) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 })
    }

    const previousLawyerId = currentCase.assigned_lawyer_id ?? null
    const incomingLawyerId = body.assigned_lawyer_id !== undefined
      ? (body.assigned_lawyer_id ?? null)
      : previousLawyerId

    const lawyerChanged = incomingLawyerId !== previousLawyerId && incomingLawyerId !== null

    // ── Apply the update ──────────────────────────────────────────────────────
    const { data: updatedCase, error: updateError } = await adminClient
      .from('cases')
      .update(body)
      .eq('id', id)
      .select('*, lawyer:profiles!cases_assigned_lawyer_id_fkey(full_name, email, firm_name)')
      .single()

    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

    // ── Fire lawyer notification if assignment changed ─────────────────────────
    if (lawyerChanged) {
      const lawyer = updatedCase.lawyer as any
      const clientName = (currentCase.client as any)?.full_name ?? 'Client'

      if (lawyer?.email && lawyer?.full_name) {
        sendLawyerCaseEmail(
          lawyer.email,
          lawyer.full_name,
          currentCase.case_number,
          clientName,
          currentCase.case_type?.replace(/_/g, ' ') ?? 'Personal Injury',
          currentCase.description ?? 'No description provided.'
        ).catch((err: any) => {
          console.error('[cases/patch] Lawyer notification failed — update was still saved:', err)
        })
        console.log('[cases/patch] Lawyer reassignment notification fired to', lawyer.email)
      } else {
        console.warn('[cases/patch] Lawyer assigned but profile missing email — notification skipped')
      }
    }

    return NextResponse.json({ data: updatedCase })
  } catch (err: any) {
    console.error('[cases/patch] Unexpected error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
