// Required env vars:
//   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
//   RESEND_API_KEY, RESEND_FROM_EMAIL
//   NEXT_PUBLIC_APP_URL
//   ADMIN_EMAIL — intake address for new lead admin alerts (e.g. intake@injurypinnacle.com)

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { sendNewLeadNotifications } from '@/lib/notifications'
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
    const {
      first_name, last_name, phone, email,
      case_type, incident_date, description,
      utm_source, utm_medium, utm_campaign,
    } = body

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
    const typeLabel = CASE_TYPE_LABELS[dbCaseType] ?? case_type

    // ── Create or reuse client profile ───────────────────────────────────────
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

    // ── Create lead case ──────────────────────────────────────────────────────
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

    // ── Query active specialists for notification ──────────────────────────────
    let specialistEmails: string[] = []
    try {
      const { data: specialists } = await adminClient
        .from('profiles')
        .select('email')
        .eq('role', 'specialist')
        .eq('is_active', true)
      specialistEmails = (specialists ?? []).map((s: any) => s.email).filter(Boolean)
    } catch (err) {
      console.error('[leads] Failed to query specialists — notifications will still proceed without them:', err)
    }

    // ── Fire all notifications — awaited so Vercel does not kill in-flight sends ─
    await sendNewLeadNotifications(
      {
        firstName: first_name.trim(),
        lastName: last_name.trim(),
        email: leadEmail,
        phone: phone.trim(),
        caseType: typeLabel,
        incidentDate: incident_date || null,
        description: description?.trim() || null,
        caseId: caseData.id,
        caseNumber,
      },
      specialistEmails
    ).catch((err) => {
      // Catch here so a catastrophic throw never fails the HTTP response
      console.error('[leads] sendNewLeadNotifications threw unexpectedly:', err)
    })

    // ESCALATION HOOK — to be implemented in notification sprint phase 2
    // Trigger: if case status remains 'lead' after 24 hours
    // Action: re-notify all specialists + notify admin
    // Implementation: use a cron job or Vercel scheduled function
    // Ref: Pinnacle notification matrix — Rule 1

    return NextResponse.json({ success: true, case_number: caseNumber }, { headers: CORS })
  } catch (err: any) {
    console.error('[leads] Error:', err)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500, headers: CORS })
  }
}
