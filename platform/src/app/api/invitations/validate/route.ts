import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  if (!token) return NextResponse.json({ error: 'Token required' }, { status: 400 })

  const supabase = await createAdminClient()
  const { data, error } = await supabase
    .from('invitations')
    .select('*')
    .eq('token', token)
    .eq('accepted', false)
    .single()

  if (error || !data) return NextResponse.json({ error: 'Invalid or expired invitation' }, { status: 404 })
  if (new Date(data.expires_at) < new Date()) return NextResponse.json({ error: 'Invitation has expired' }, { status: 410 })

  return NextResponse.json({ email: data.email, role: data.role })
}
