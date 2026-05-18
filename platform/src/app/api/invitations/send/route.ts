import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import { sendInviteEmail } from '@/lib/notifications'
import crypto from 'crypto'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase.from('profiles').select('role, full_name').eq('id', user.id).single()
    if (profile?.role !== 'admin') return NextResponse.json({ error: 'Admin only' }, { status: 403 })

    const { email, role } = await req.json()
    if (!email || !role) return NextResponse.json({ error: 'Email and role required' }, { status: 400 })

    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

    const adminClient = await createAdminClient()
    const { error } = await adminClient.from('invitations').insert({
      email,
      role,
      invited_by: user.id,
      token,
      accepted: false,
      expires_at: expiresAt,
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    await sendInviteEmail(email, profile.full_name, role, token)

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
