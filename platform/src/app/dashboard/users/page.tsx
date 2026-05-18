import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ROLE_LABELS, ROLE_COLORS, formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'
import InviteUserButton from './InviteUserButton'
import type { UserRole } from '@/types/database'

export default async function UsersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user!.id).single()
  if (profile?.role !== 'admin') redirect('/dashboard')

  const [{ data: users }, { data: invitations }] = await Promise.all([
    supabase.from('profiles').select('*').order('created_at', { ascending: false }),
    supabase.from('invitations').select('*').eq('accepted', false).order('created_at', { ascending: false }),
  ])

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold" style={{ fontFamily: 'var(--font-syne)' }}>User Management</h1>
          <p className="text-sm text-[#8d95a8] mt-1">{users?.length ?? 0} active users</p>
        </div>
        <InviteUserButton />
      </div>

      {/* Pending invitations */}
      {!!invitations?.length && (
        <div className="bg-amber-500/[0.07] border border-amber-500/20 rounded-xl p-4 mb-5">
          <div className="text-xs font-semibold uppercase tracking-widest text-amber-400 mb-3">Pending Invitations ({invitations.length})</div>
          <div className="space-y-2">
            {invitations.map((inv: any) => (
              <div key={inv.id} className="flex items-center justify-between text-sm">
                <span className="text-[#f0f2f7]">{inv.email}</span>
                <div className="flex items-center gap-3">
                  <span className={cn('text-[11px] px-2 py-0.5 rounded-full font-medium', ROLE_COLORS[inv.role as UserRole])}>{ROLE_LABELS[inv.role as UserRole]}</span>
                  <span className="text-xs text-[#4e5668]">Expires {formatDate(inv.expires_at)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Users table */}
      <div className="bg-[#161b25] border border-white/[0.07] rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-white/[0.02]">
              {['User', 'Role', 'Phone', 'Status', 'Joined', ''].map(h => (
                <th key={h} className="text-left px-5 py-3 text-[10px] font-semibold uppercase tracking-widest text-[#4e5668] border-b border-white/[0.07]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(users || []).map((u: any) => (
              <tr key={u.id} className="border-b border-white/[0.05] hover:bg-white/[0.02] transition-colors last:border-0">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#c9a84c] to-[#e8c76a] flex items-center justify-center text-[#0a0c10] text-[10px] font-bold">
                      {u.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-sm font-medium">{u.full_name}</div>
                      <div className="text-xs text-[#4e5668]">{u.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3">
                  <span className={cn('text-[11px] px-2 py-0.5 rounded-full font-medium', ROLE_COLORS[u.role as UserRole])}>
                    {ROLE_LABELS[u.role as UserRole]}
                  </span>
                </td>
                <td className="px-5 py-3 text-xs text-[#8d95a8]">{u.phone ?? '—'}</td>
                <td className="px-5 py-3">
                  <span className={cn('text-[11px] px-2 py-0.5 rounded-full font-medium', u.is_active ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400')}>
                    {u.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-5 py-3 text-xs text-[#4e5668]">{formatDate(u.created_at)}</td>
                <td className="px-5 py-3 text-xs text-[#8d95a8]">{u.id === user?.id ? '(you)' : ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
