import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/notifications'
import { generateCaseNumber } from '@/lib/utils'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

const CASE_TYPE_MAP: Record<string, string> = {
  auto: 'auto_accident',
  workplace: 'workplace_injury',
  slip: 'slip_and_fall',
  pedestrian: 'other',
  medical: 'medical_malpractice',
  product: 'other',
  other: 'other',
}

const CASE_TYPE_LABELS: Record<string, string> = {
  auto_accident: 'Auto / Truck Accident',
  workplace_injury: 'Workplace Injury',
  slip_and_fall: 'Slip & Fall',
  medical_malpractice: 'Medical Negligence',
  other: 'Other',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { first_name, last_name, phone, email, case_type, incident_date, description, utm_source, utm_medium, utm_campaign } = body

    if (!first_name?.trim() || !last_name?.trim() || !phone?.trim()) {
      return NextResponse.json(
        { error: 'First name, last name, and phone number are required.' },
        { status: 400, headers: CORS }
      )
    }

    const adminClient = createAdminClient()
    const full_name = `${first_name.trim()} ${last_name.trim()}`
    const hasEmail = !!email?.trim()
    const leadEmail = hasEmail ? email.trim() : `lead.${Date.now()}@noreply.pinnacleinjuryconsultants.com`
    const dbCaseType = CASE_TYPE_MAP[case_type] ?? 'other'

    // Reuse existing profile if email already on file
    let clientId: string
    const { data: existingProfile } = await adminClient
      .from('profiles')
      .select('id')
      .eq('email', leadEmail)
      .maybeSingle()

    if (existingProfile) {
      clientId = existingProfile.id
    } else {
      const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
        email: leadEmail,
        password: crypto.randomUUID(),
        email_confirm: true,
      })
      if (authError) throw new Error(authError.message)

      await adminClient.from('profiles').insert({
        id: authData.user.id,
        email: leadEmail,
        full_name,
        phone: phone.trim(),
        role: 'client',
        is_active: false,
        notification_channel: 'both',
      })
      clientId = authData.user.id
    }

    // Create lead case
    const caseNumber = generateCaseNumber()
    const { data: caseData, error: caseError } = await adminClient
      .from('cases')
      .insert({
        client_id: clientId,
        case_number: caseNumber,
        status: 'lead',
        case_type: dbCaseType,
        incident_date: incident_date || null,
        description: description?.trim() || null,
      })
      .select('id')
      .single()

    if (caseError) throw new Error(caseError.message)

    // Notify intake team
    const appUrl = process.env.NEXT_PUBLIC_APP_URL
    const typeLabel = CASE_TYPE_LABELS[dbCaseType] ?? case_type
    const utmLine = utm_source
      ? `<tr><td style="padding:6px 0;font-size:11px;color:#4e5668;text-transform:uppercase;width:120px">Source</td><td style="padding:6px 0;font-size:14px">${utm_source}${utm_medium ? ` / ${utm_medium}` : ''}${utm_campaign ? ` / ${utm_campaign}` : ''}</td></tr>`
      : ''

    await sendEmail(
      'intake@pinnacleinjuryconsultants.com',
      `🔔 New Lead: ${full_name} — ${typeLabel}`,
      `<div style="font-family:sans-serif;max-width:580px;margin:0 auto;background:#0a0c10;color:#f0f2f7;border-radius:12px;overflow:hidden">
        <div style="background:linear-gradient(135deg,#c9a84c,#e8c76a);padding:24px 32px">
          <h1 style="margin:0;color:#0a0c10;font-size:20px;font-weight:700">New Lead — Action Required</h1>
          <p style="margin:4px 0 0;color:#0a0c10;opacity:.7;font-size:13px">Submitted via pinnacleinjuryconsultants.com</p>
        </div>
        <div style="padding:32px">
          <div style="background:#161b25;border:1px solid rgba(255,255,255,.07);border-radius:8px;padding:20px;margin-bottom:24px">
            <p style="margin:0 0 4px;font-size:11px;color:#4e5668;text-transform:uppercase;letter-spacing:.06em">Case Number</p>
            <p style="margin:0 0 20px;font-weight:700;color:#c9a84c;font-size:20px">${caseNumber}</p>
            <table style="width:100%;border-collapse:collapse">
              <tr><td style="padding:6px 0;font-size:11px;color:#4e5668;text-transform:uppercase;width:120px">Name</td><td style="padding:6px 0;font-size:14px;font-weight:600">${full_name}</td></tr>
              <tr><td style="padding:6px 0;font-size:11px;color:#4e5668;text-transform:uppercase">Phone</td><td style="padding:6px 0;font-size:14px"><a href="tel:${phone.trim()}" style="color:#c9a84c;text-decoration:none">${phone.trim()}</a></td></tr>
              <tr><td style="padding:6px 0;font-size:11px;color:#4e5668;text-transform:uppercase">Email</td><td style="padding:6px 0;font-size:14px">${hasEmail ? email.trim() : '<em style="color:#4e5668">Not provided</em>'}</td></tr>
              <tr><td style="padding:6px 0;font-size:11px;color:#4e5668;text-transform:uppercase">Case Type</td><td style="padding:6px 0;font-size:14px">${typeLabel}</td></tr>
              ${incident_date ? `<tr><td style="padding:6px 0;font-size:11px;color:#4e5668;text-transform:uppercase">Incident Date</td><td style="padding:6px 0;font-size:14px">${incident_date}</td></tr>` : ''}
              ${utmLine}
            </table>
            ${description?.trim() ? `<div style="margin-top:16px;padding-top:16px;border-top:1px solid rgba(255,255,255,.07)"><p style="margin:0 0 6px;font-size:11px;color:#4e5668;text-transform:uppercase">Description</p><p style="margin:0;font-size:14px;color:#8d95a8;line-height:1.6">${description.trim()}</p></div>` : ''}
          </div>
          <a href="${appUrl}/dashboard/cases/${caseData.id}" style="display:inline-block;background:linear-gradient(135deg,#c9a84c,#e8c76a);color:#0a0c10;font-weight:600;padding:14px 32px;border-radius:8px;text-decoration:none;font-size:14px">
            Open in CMS →
          </a>
          <p style="margin:24px 0 0;font-size:12px;color:#4e5668">Pinnacle Injury Consultants · (832) 707-9867 · Houston, TX</p>
        </div>
      </div>`
    )

    // TODO (notification sprint): broadcast new lead to admin + available specialists
    // notifyTeam({ caseId: caseData.id, caseNumber, clientName: full_name, caseType: dbCaseType })

    return NextResponse.json({ success: true, case_number: caseNumber }, { headers: CORS })
  } catch (err: any) {
    console.error('[leads] Error:', err)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500, headers: CORS })
  }
}
