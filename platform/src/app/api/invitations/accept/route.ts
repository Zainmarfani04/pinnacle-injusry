import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const { token, full_name, password, phone } = await req.json()
    if (!token || !full_name || !password) return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })

    const supabase = createAdminClient()

    const { data: invitation, error: invErr } = await supabase
      .from('invitations')
      .select('*')
      .eq('token', token)
      .eq('accepted', false)
      .single()

    if (invErr || !invitation) return NextResponse.json({ error: 'Invalid invitation' }, { status: 404 })
    if (new Date(invitation.expires_at) < new Date()) return NextResponse.json({ error: 'Invitation expired' }, { status: 410 })

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: invitation.email,
      password,
      email_confirm: true,
    })

    if (authError) return NextResponse.json({ error: authError.message }, { status: 500 })

    await supabase.from('profiles').insert({
      id: authData.user.id,
      email: invitation.email,
      full_name,
      role: invitation.role,
      phone: phone || null,
      notification_channel: 'email',
      is_active: true,
    })

    await supabase.from('invitations').update({ accepted: true }).eq('id', invitation.id)

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
