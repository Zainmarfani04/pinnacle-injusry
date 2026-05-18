import { createAdminClient, createClient } from '@/lib/supabase/server'
import { formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'

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
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold" style={{ fontFamily: 'var(--font-syne)' }}>Notification Log</h1>
        <p className="text-sm text-[#8d95a8] mt-1">History of all emails and SMS sent through the platform.</p>
      </div>

      <div className="bg-[#161b25] border border-white/[0.07] rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-white/[0.02]">
              {['Recipient', 'Case', 'Channel', 'Subject', 'Status', 'Sent'].map(h => (
                <th key={h} className="text-left px-5 py-3 text-[10px] font-semibold uppercase tracking-widest text-[#4e5668] border-b border-white/[0.07]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(logs || []).map((n: any) => (
              <tr key={n.id} className="border-b border-white/[0.05] hover:bg-white/[0.02] transition-colors last:border-0">
                <td className="px-5 py-3">
                  <div className="text-sm font-medium">{n.recipient?.full_name ?? '—'}</div>
                  <div className="text-xs text-[#4e5668]">{n.recipient?.email}</div>
                </td>
                <td className="px-5 py-3 text-xs font-mono text-[#c9a84c]">{n.case?.case_number ?? '—'}</td>
                <td className="px-5 py-3">
                  <span className={cn('text-[11px] font-medium px-2 py-0.5 rounded-full',
                    n.channel === 'email' ? 'bg-blue-500/15 text-blue-400' : 'bg-emerald-500/15 text-emerald-400'
                  )}>
                    {n.channel === 'email' ? '✉ Email' : '💬 SMS'}
                  </span>
                </td>
                <td className="px-5 py-3 text-xs text-[#8d95a8] max-w-[200px] truncate">{n.subject ?? n.body}</td>
                <td className="px-5 py-3">
                  <span className={cn('text-[11px] font-medium px-2 py-0.5 rounded-full',
                    n.status === 'sent' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'
                  )}>
                    {n.status}
                  </span>
                </td>
                <td className="px-5 py-3 text-xs text-[#4e5668]">{formatDate(n.sent_at)}</td>
              </tr>
            ))}
            {!logs?.length && (
              <tr><td colSpan={6} className="px-5 py-10 text-center text-sm text-[#4e5668]">No notifications sent yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
