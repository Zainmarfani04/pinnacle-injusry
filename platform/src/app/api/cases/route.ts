import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'
import { sendLawyerCaseEmail } from '@/lib/notifications'
import { generateCaseNumber } from '@/lib/utils'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const caseNumber = generateCaseNumber()

    const { data, error } = await supabase.from('cases').insert({
      ...body,
      case_number: caseNumber,
      status: body.status ?? 'lead',
    }).select('*, client:profiles!cases_client_id_fkey(full_name), lawyer:profiles!cases_assigned_lawyer_id_fkey(full_name, email)').single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // ── Lawyer assignment notification ────────────────────────────────────────
    // If a lawyer was assigned at case creation, notify them immediately.
    // Failure here never rolls back the case creation.
    if (body.assigned_lawyer_id && data) {
      const lawyer = data.lawyer as any
      const client = data.client as any
      if (lawyer?.email && lawyer?.full_name) {
        sendLawyerCaseEmail(
          lawyer.email,
          lawyer.full_name,
          caseNumber,
          client?.full_name ?? 'Client',
          data.case_type?.replace(/_/g, ' ') ?? 'Personal Injury',
          data.description ?? 'No description provided.'
        ).catch((err: any) => {
          console.error('[cases] Lawyer notification failed — case was still created:', err)
        })
      }
    }

    return NextResponse.json({ data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
