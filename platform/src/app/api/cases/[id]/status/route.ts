import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'
import { sendCaseStatusEmail, sendCaseStatusSMS } from '@/lib/notifications'
import type { CaseStatus } from '@/types/database'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { status, notes } = await req.json() as { status: CaseStatus; notes?: string }

    const updatePayload: Record<string, unknown> = { status }
    if (notes !== undefined) updatePayload.notes = notes

    const { data: caseData, error: caseError } = await supabase
      .from('cases')
      .update(updatePayload)
      .eq('id', id)
      .select('*, client:profiles!cases_client_id_fkey(full_name, email, phone, notification_channel)')
      .single()

    if (caseError) return NextResponse.json({ error: caseError.message }, { status: 500 })

    const client = caseData.client as any
    if (client) {
      const channel = client.notification_channel ?? 'email'
      if ((channel === 'email' || channel === 'both') && client.email) {
        await sendCaseStatusEmail(client.email, client.full_name, caseData.case_number, status, notes)
      }
      if ((channel === 'sms' || channel === 'both') && client.phone) {
        await sendCaseStatusSMS(client.phone, client.full_name, caseData.case_number, status)
      }
    }

    const adminClient = await createAdminClient()
    await adminClient.from('notifications_log').insert({
      case_id: id,
      recipient_id: caseData.client_id,
      channel: 'email',
      subject: `Case ${caseData.case_number} status updated`,
      body: `Status changed to ${status}`,
      status: 'sent',
    })

    return NextResponse.json({ data: caseData })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
