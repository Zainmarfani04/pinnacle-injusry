import { createAdminClient, createClient } from '@/lib/supabase/server'
import { formatDate } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export default async function LawyersPage() {
  const supabase = await createClient()
  const adminClient = createAdminClient()
  await supabase.auth.getUser()

  const { data: lawyers } = await adminClient
    .from('profiles')
    .select('*')
    .eq('role', 'lawyer')
    .order('created_at', { ascending: false })

  const { data: caseCounts } = await adminClient.from('cases').select('assigned_lawyer_id, status')

  const countMap = (caseCounts || []).reduce((acc: Record<string, { total: number; active: number }>, c: any) => {
    if (!c.assigned_lawyer_id) return acc
    if (!acc[c.assigned_lawyer_id]) acc[c.assigned_lawyer_id] = { total: 0, active: 0 }
    acc[c.assigned_lawyer_id].total++
    if (!['settled', 'closed', 'rejected'].includes(c.status)) acc[c.assigned_lawyer_id].active++
    return acc
  }, {})

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold font-[var(--font-syne)]">Lawyers</h1>
        <p className="text-sm text-[#8d95a8] mt-1">{lawyers?.length ?? 0} attorneys on the platform</p>
      </div>

      <Card className="bg-[#161b25] border-white/[0.07]">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-white/[0.02] border-b border-white/[0.07] hover:bg-white/[0.02]">
                {['Attorney', 'Firm', 'Phone', 'Active Cases', 'Total Cases', 'Joined'].map(h => (
                  <TableHead key={h} className="text-[10px] font-semibold uppercase tracking-widest text-[#4e5668]">{h}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {(lawyers || []).map((l: any) => {
                const counts = countMap[l.id] ?? { total: 0, active: 0 }
                const initials = l.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() ?? '?'
                return (
                  <TableRow key={l.id} className="border-b border-white/[0.05] hover:bg-white/[0.02]">
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <Avatar className="w-7 h-7 shrink-0">
                          <AvatarFallback className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="text-sm font-medium">{l.full_name}</div>
                          <div className="text-xs text-[#4e5668]">{l.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-[#8d95a8]">{l.firm_name ?? '—'}</TableCell>
                    <TableCell className="text-xs text-[#8d95a8]">{l.phone ?? '—'}</TableCell>
                    <TableCell>
                      <span className="text-xs font-semibold text-emerald-400">{counts.active}</span>
                    </TableCell>
                    <TableCell className="text-xs text-[#8d95a8]">{counts.total}</TableCell>
                    <TableCell className="text-xs text-[#4e5668]">{formatDate(l.created_at)}</TableCell>
                  </TableRow>
                )
              })}
              {!lawyers?.length && (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-sm text-[#4e5668]">
                    No lawyers yet. Invite attorneys from the Users page.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
