import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ROLE_LABELS, ROLE_COLORS, formatDate, cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import InviteUserButton from './InviteUserButton'
import type { UserRole } from '@/types/database'

export default async function UsersPage() {
  const supabase = await createClient()
  const adminClient = createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await adminClient.from('profiles').select('role').eq('id', user!.id).single()
  if (profile?.role !== 'admin') redirect('/dashboard')

  const [{ data: users }, { data: invitations }] = await Promise.all([
    adminClient.from('profiles').select('*').order('created_at', { ascending: false }),
    adminClient.from('invitations').select('*').eq('accepted', false).order('created_at', { ascending: false }),
  ])

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold font-[var(--font-syne)]">User Management</h1>
          <p className="text-sm text-[#8d95a8] mt-1">{users?.length ?? 0} active users</p>
        </div>
        <InviteUserButton />
      </div>

      {!!invitations?.length && (
        <div className="bg-amber-500/[0.07] border border-amber-500/20 rounded-xl p-4">
          <div className="text-xs font-semibold uppercase tracking-widest text-amber-400 mb-3">
            Pending Invitations ({invitations.length})
          </div>
          <div className="space-y-2">
            {invitations.map((inv: any) => (
              <div key={inv.id} className="flex items-center justify-between text-sm">
                <span className="text-[#f0f2f7]">{inv.email}</span>
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className={cn('border-0 text-[11px]', ROLE_COLORS[inv.role as UserRole])}>
                    {ROLE_LABELS[inv.role as UserRole]}
                  </Badge>
                  <span className="text-xs text-[#4e5668]">Expires {formatDate(inv.expires_at)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Card className="bg-[#161b25] border-white/[0.07]">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-white/[0.02] border-b border-white/[0.07] hover:bg-white/[0.02]">
                {['User', 'Role', 'Phone', 'Status', 'Joined', ''].map(h => (
                  <TableHead key={h} className="text-[10px] font-semibold uppercase tracking-widest text-[#4e5668]">{h}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {(users || []).map((u: any) => {
                const initials = u.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() ?? '?'
                return (
                  <TableRow key={u.id} className="border-b border-white/[0.05] hover:bg-white/[0.02]">
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <Avatar className="w-7 h-7 shrink-0">
                          <AvatarFallback className="bg-gradient-to-br from-[#c9a84c] to-[#e8c76a] text-[#0a0c10] text-[10px] font-bold">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="text-sm font-medium">{u.full_name}</div>
                          <div className="text-xs text-[#4e5668]">{u.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn('border-0 text-[11px]', ROLE_COLORS[u.role as UserRole])}>
                        {ROLE_LABELS[u.role as UserRole]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-[#8d95a8]">{u.phone ?? '—'}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn('border-0 text-[11px]', u.is_active ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400')}>
                        {u.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-[#4e5668]">{formatDate(u.created_at)}</TableCell>
                    <TableCell className="text-xs text-[#8d95a8]">{u.id === user?.id ? '(you)' : ''}</TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
