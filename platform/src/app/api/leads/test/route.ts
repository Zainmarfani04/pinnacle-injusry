import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { generateCaseNumber } from '@/lib/utils'

// Test lead submission endpoint — only active when TEST_LEADS_ENABLED=true
// Use this to verify end-to-end field mapping without triggering real notifications.
// POST /api/leads/test — accepts the same payload as /api/leads
// Returns the created case record so you can inspect field mapping.

const CASE_TYPE_MAP: Record<string, string> = {
  auto: 'auto_accident',
  workplace: 'workplace_injury',
  slip: 'slip_and_fall',
  pedestrian: 'other',
  medical: 'medical_malpractice',
  product: 'other',
  other: 'other',
}

export async function POST(req: NextRequest) {
  if (process.env.TEST_LEADS_ENABLED !== 'true') {
    return NextResponse.json({ error: 'Test endpoint is disabled in this environment.' }, { status: 403 })
  }

  try {
    const body = await req.json()
    const { first_name, last_name, phone, email, case_type, incident_date, description, utm_source, utm_medium, utm_campaign, source, referrer } = body

    if (!first_name?.trim() || !last_name?.trim() || !phone?.trim()) {
      return NextResponse.json({ error: 'first_name, last_name, and phone are required.' }, { status: 400 })
    }

    const adminClient = createAdminClient()
    const full_name = `${first_name.trim()} ${last_name.trim()}`
    const testEmail = email?.trim() || `test.lead.${Date.now()}@noreply.pinnacleinjuryconsultants.com`
    const dbCaseType = CASE_TYPE_MAP[case_type] ?? 'other'
    const caseNumber = generateCaseNumber()

    // Create a throw-away auth user tagged as a test lead
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email: testEmail,
      password: crypto.randomUUID(),
      email_confirm: true,
    })
    if (authError) throw new Error(authError.message)

    await adminClient.from('profiles').insert({
      id: authData.user.id,
      email: testEmail,
      full_name,
      phone: phone.trim(),
      role: 'client',
      is_active: false,
      notification_channel: 'both',
    })

    const { data: caseData, error: caseError } = await adminClient
      .from('cases')
      .insert({
        client_id: authData.user.id,
        case_number: caseNumber,
        status: 'lead',
        case_type: dbCaseType,
        incident_date: incident_date || null,
        description: `[TEST SUBMISSION] ${description?.trim() || ''}`.trim(),
      })
      .select('*')
      .single()

    if (caseError) throw new Error(caseError.message)

    // Return the full created record for field-mapping verification
    return NextResponse.json({
      test: true,
      source: source || 'test',
      referrer: referrer || null,
      utm: { utm_source, utm_medium, utm_campaign },
      field_mapping: {
        first_name, last_name, phone,
        email: testEmail,
        case_type: dbCaseType,
        incident_date: incident_date || null,
        description: description || null,
      },
      created_case: caseData,
    })
  } catch (err: any) {
    console.error('[leads/test] Error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
