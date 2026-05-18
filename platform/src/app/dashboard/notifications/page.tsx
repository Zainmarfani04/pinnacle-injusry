import { createAdminClient, createClient } from '@/lib/supabase/server'
import { formatDate, cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export default async function NotificationsPage() {
  const supabase = await createClient()
  const adminClient = createAdminClient()
  await supabase.auth.getUser()

  const { data: logs } = await adminClient
    .from('notifications_log')
    .select('*, recipient:profiles!notifications_log_recipient_id_fkey(full_name, email), case:cases!notifications_log_case_id_fkey(case_number)')
    .order('sent_at', { ascending: false })
    .limit(100)

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold font-[var(--font-syne)]">Notification Log</h1>
        <p className="text-sm text-[#8d95a8] mt-1">History of all emails and SMS sent through the platform.</p>
      </div>

      <Card className="bg-[#161b25] border-white/[0.07]">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-white/[0.02] border-b border-white/[0.07] hover:bg-white/[0.02]">
                {['Recipient', 'Case', 'Channel', 'Subject', 'Status', 'Sent'].map(h => (
                  <TableHead key={h} className="text-[10px] font-semibold uppercase tracking-widest text-[#4e5668]">{h}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {(logs || []).map((n: any) => (
                <TableRow key={n.id} className="border-b border-white/[0.05] hover:bg-white/[0.02]">
                  <TableCell>
                    <div className="text-sm font-medium">{n.recipient?.full_name ?? '—'}</div>
                    <div className="text-xs text-[#4e5668]">{n.recipient?.email}</div>
                  </TableCell>
                  <TableCell className="text-xs font-mono text-[#c9a84c]">{n.case?.case_number ?? '—'}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn('border-0 text-[11px]',
                      n.channel === 'email' ? 'bg-blue-500/15 text-blue-400' : 'bg-emerald-500/15 text-emerald-400'
                    )}>
                      {n.channel === 'email' ? 'Email' : 'SMS'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-[#8d95a8] max-w-[200px] truncate">{n.subject ?? n.body}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn('border-0 text-[11px]',
                      n.status === 'sent' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'
                    )}>
                      {n.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-[#4e5668]">{formatDate(n.sent_at)}</TableCell>
                </TableRow>
              ))}
              {!logs?.length && (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-sm text-[#4e5668]">No notifications sent yet.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
