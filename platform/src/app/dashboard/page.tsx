import { createClient, createAdminClient } from '@/lib/supabase/server'
import { formatCurrency, STATUS_LABELS } from '@/lib/utils'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()
  const adminClient = await createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: cases }, { data: profile }, { count: totalClients }] = await Promise.all([
    adminClient.from('cases').select('*, client:profiles!cases_client_id_fkey(full_name)').order('created_at', { ascending: false }).limit(5),
    adminClient.from('profiles').select('*').eq('id', user!.id).single(),
    adminClient.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'client'),
  ])

  const { data: statusCounts } = await adminClient
    .from('cases')
    .select('status')

  const counts = (statusCounts || []).reduce((acc: Record<string, number>, c) => {
    acc[c.status] = (acc[c.status] || 0) + 1
    return acc
  }, {})

  const metrics = [
    { label: 'Total Cases', value: statusCounts?.length ?? 0, color: 'from-blue-500' },
    { label: 'Active (Intake)', value: counts['intake'] ?? 0, color: 'from-amber-500' },
    { label: 'Sent to Attorney', value: counts['sent_to_attorney'] ?? 0, color: 'from-purple-500' },
    { label: 'Settled', value: counts['settled'] ?? 0, color: 'from-emerald-500' },
  ]

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold" style={{ fontFamily: 'var(--font-syne)' }}>
          Good morning, {profile?.full_name?.split(' ')[0]} 👋
        </h1>
        <p className="text-sm text-[#8d95a8] mt-1">Here's what's happening with your cases today.</p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {metrics.map(m => (
          <div key={m.label} className="bg-[#161b25] border border-white/[0.07] rounded-xl p-4 relative overflow-hidden">
            <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${m.color} to-transparent opacity-70`} />
            <div className="text-[11px] text-[#4e5668] uppercase tracking-widest mb-2">{m.label}</div>
            <div className="text-3xl font-bold" style={{ fontFamily: 'var(--font-syne)' }}>{m.value}</div>
          </div>
        ))}
      </div>

      {/* Recent Cases */}
      <div className="bg-[#161b25] border border-white/[0.07] rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.07]">
          <h2 className="text-sm font-semibold" style={{ fontFamily: 'var(--font-syne)' }}>Recent Cases</h2>
          <Link href="/dashboard/cases" className="text-xs text-[#c9a84c] hover:text-[#e8c76a] transition-colors">View all →</Link>
        </div>
        <table className="w-full">
          <thead>
            <tr className="bg-white/[0.02]">
              {['Case #', 'Client', 'Type', 'Status', 'Created'].map(h => (
                <th key={h} className="text-left px-5 py-2.5 text-[10px] font-semibold uppercase tracking-widest text-[#4e5668] border-b border-white/[0.07]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(cases || []).map((c: any) => (
              <tr key={c.id} className="border-b border-white/[0.05] hover:bg-white/[0.02] transition-colors last:border-0">
                <td className="px-5 py-3">
                  <Link href={`/dashboard/cases/${c.id}`} className="text-xs font-mono text-[#c9a84c] hover:underline">{c.case_number}</Link>
                </td>
                <td className="px-5 py-3 text-sm">{(c.client as any)?.full_name ?? '—'}</td>
                <td className="px-5 py-3 text-xs text-[#8d95a8] capitalize">{c.case_type?.replace(/_/g, ' ')}</td>
                <td className="px-5 py-3">
                  <StatusPill status={c.status} />
                </td>
                <td className="px-5 py-3 text-xs text-[#4e5668]">{new Date(c.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
            {!cases?.length && (
              <tr><td colSpan={5} className="px-5 py-8 text-center text-sm text-[#4e5668]">No cases yet. <Link href="/dashboard/cases/new" className="text-[#c9a84c] hover:underline">Create the first one →</Link></td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function StatusPill({ status }: { status: string }) {
  const colors: Record<string, string> = {
    lead: 'bg-blue-500/15 text-blue-400',
    intake: 'bg-amber-500/15 text-amber-400',
    sent_to_attorney: 'bg-purple-500/15 text-purple-400',
    accepted: 'bg-emerald-500/15 text-emerald-400',
    rejected: 'bg-red-500/15 text-red-400',
    signed: 'bg-violet-500/15 text-violet-400',
    settled: 'bg-emerald-500/15 text-emerald-400',
    closed: 'bg-zinc-500/15 text-zinc-400',
  }
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${colors[status] ?? 'bg-zinc-500/15 text-zinc-400'}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {STATUS_LABELS[status as keyof typeof STATUS_LABELS] ?? status}
    </span>
  )
}
