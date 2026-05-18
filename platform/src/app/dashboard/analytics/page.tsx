import { createAdminClient, createClient } from '@/lib/supabase/server'
import { STATUS_LABELS, CASE_TYPE_LABELS, formatCurrency } from '@/lib/utils'

export default async function AnalyticsPage() {
  const supabase = await createClient()
  const adminClient = createAdminClient()
  await supabase.auth.getUser()

  const [{ data: cases }, { data: profiles }, { data: notifications }] = await Promise.all([
    adminClient.from('cases').select('status, case_type, estimated_value, settlement_amount, created_at'),
    adminClient.from('profiles').select('role, created_at'),
    adminClient.from('notifications_log').select('channel, status'),
  ])

  const totalCases = cases?.length ?? 0
  const settled = cases?.filter(c => c.status === 'settled').length ?? 0
  const totalValue = cases?.reduce((sum, c) => sum + (c.estimated_value ?? 0), 0) ?? 0
  const totalSettled = cases?.reduce((sum, c) => sum + (c.settlement_amount ?? 0), 0) ?? 0
  const conversionRate = totalCases ? Math.round((settled / totalCases) * 100) : 0

  const byStatus = ['lead', 'intake', 'sent_to_attorney', 'accepted', 'rejected', 'signed', 'settled', 'closed'].map(s => ({
    label: STATUS_LABELS[s as keyof typeof STATUS_LABELS],
    count: cases?.filter(c => c.status === s).length ?? 0,
  }))

  const byType = ['auto_accident', 'slip_and_fall', 'workplace_injury', 'medical_malpractice', 'other'].map(t => ({
    label: CASE_TYPE_LABELS[t as keyof typeof CASE_TYPE_LABELS],
    count: cases?.filter(c => c.case_type === t).length ?? 0,
  }))

  const roleCount = (role: string) => profiles?.filter(p => p.role === role).length ?? 0
  const emailsSent = notifications?.filter(n => n.channel === 'email' && n.status === 'sent').length ?? 0
  const smsSent = notifications?.filter(n => n.channel === 'sms' && n.status === 'sent').length ?? 0

  const maxCount = Math.max(...byStatus.map(s => s.count), 1)

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold" style={{ fontFamily: 'var(--font-syne)' }}>Analytics</h1>
        <p className="text-sm text-[#8d95a8] mt-1">Platform-wide metrics and performance overview.</p>
      </div>

      {/* Top metrics */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        {[
          { label: 'Total Cases', value: totalCases, color: 'from-blue-500' },
          { label: 'Conversion Rate', value: `${conversionRate}%`, color: 'from-emerald-500' },
          { label: 'Pipeline Value', value: formatCurrency(totalValue), color: 'from-amber-500' },
          { label: 'Total Settled', value: formatCurrency(totalSettled), color: 'from-violet-500' },
        ].map(m => (
          <div key={m.label} className="bg-[#161b25] border border-white/[0.07] rounded-xl p-4 relative overflow-hidden">
            <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${m.color} to-transparent opacity-70`} />
            <div className="text-[11px] text-[#4e5668] uppercase tracking-widest mb-2">{m.label}</div>
            <div className="text-2xl font-bold" style={{ fontFamily: 'var(--font-syne)' }}>{m.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Cases by status */}
        <div className="bg-[#161b25] border border-white/[0.07] rounded-xl p-5">
          <h2 className="text-sm font-semibold mb-4" style={{ fontFamily: 'var(--font-syne)' }}>Cases by Status</h2>
          <div className="space-y-2.5">
            {byStatus.filter(s => s.count > 0).map(s => (
              <div key={s.label}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-[#8d95a8]">{s.label}</span>
                  <span className="font-medium">{s.count}</span>
                </div>
                <div className="h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-[#c9a84c] to-[#e8c76a] rounded-full transition-all"
                    style={{ width: `${(s.count / maxCount) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cases by type */}
        <div className="bg-[#161b25] border border-white/[0.07] rounded-xl p-5">
          <h2 className="text-sm font-semibold mb-4" style={{ fontFamily: 'var(--font-syne)' }}>Cases by Type</h2>
          <div className="space-y-2.5">
            {byType.filter(t => t.count > 0).map(t => (
              <div key={t.label}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-[#8d95a8]">{t.label}</span>
                  <span className="font-medium">{t.count}</span>
                </div>
                <div className="h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full"
                    style={{ width: `${(t.count / Math.max(totalCases, 1)) * 100}%` }} />
                </div>
              </div>
            ))}
            {!byType.some(t => t.count > 0) && <p className="text-sm text-[#4e5668]">No cases yet.</p>}
          </div>
        </div>
      </div>

      {/* Platform stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Specialists', value: roleCount('specialist') },
          { label: 'Lawyers', value: roleCount('lawyer') },
          { label: 'Emails Sent', value: emailsSent },
          { label: 'SMS Sent', value: smsSent },
        ].map(m => (
          <div key={m.label} className="bg-[#161b25] border border-white/[0.07] rounded-xl p-4 text-center">
            <div className="text-2xl font-bold mb-1" style={{ fontFamily: 'var(--font-syne)' }}>{m.value}</div>
            <div className="text-[11px] text-[#4e5668] uppercase tracking-widest">{m.label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
