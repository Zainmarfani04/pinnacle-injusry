import { createAdminClient, createClient } from '@/lib/supabase/server'
import { formatDate } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import Link from 'next/link'

export default async function ClientsPage() {
  const supabase = await createClient()
  const adminClient = createAdminClient()
  await supabase.auth.getUser()

  const { data: clients } = await adminClient
    .from('profiles')
    .select('*')
    .eq('role', 'client')
    .order('created_at', { ascending: false })

  const { data: caseCounts } = await adminClient.from('cases').select('client_id')

  const countMap = (caseCounts || []).reduce((acc: Record<string, number>, c: any) => {
    acc[c.client_id] = (acc[c.client_id] || 0) + 1
    return acc
  }, {})

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold font-[var(--font-syne)]">Clients</h1>
        <p className="text-sm text-[#8d95a8] mt-1">{clients?.length ?? 0} registered clients</p>
      </div>

      <Card className="bg-[#161b25] border-white/[0.07]">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-white/[0.02] border-b border-white/[0.07] hover:bg-white/[0.02]">
                {['Client', 'Phone', 'Cases', 'Notifications', 'Joined', ''].map(h => (
                  <TableHead key={h} className="text-[10px] font-semibold uppercase tracking-widest text-[#4e5668]">{h}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {(clients || []).map((c: any) => {
                const initials = c.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() ?? '?'
                return (
                  <TableRow key={c.id} className="border-b border-white/[0.05] hover:bg-white/[0.02]">
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <Avatar className="w-7 h-7 shrink-0">
                          <AvatarFallback className="bg-white/[0.07] text-[#8d95a8] text-[10px] font-bold">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="text-sm font-medium">{c.full_name}</div>
                          <div className="text-xs text-[#4e5668]">{c.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-[#8d95a8]">{c.phone ?? '—'}</TableCell>
                    <TableCell className="text-xs font-medium">{countMap[c.id] ?? 0}</TableCell>
                    <TableCell className="text-xs text-[#8d95a8] capitalize">{c.notification_channel}</TableCell>
                    <TableCell className="text-xs text-[#4e5668]">{formatDate(c.created_at)}</TableCell>
                    <TableCell>
                      <Link href={`/dashboard/cases?client=${c.id}`} className="text-xs text-[#c9a84c] hover:text-[#e8c76a] transition-colors">
                        View cases →
                      </Link>
                    </TableCell>
                  </TableRow>
                )
              })}
              {!clients?.length && (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-sm text-[#4e5668]">
                    No clients yet. Invite clients from the Users page.
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
