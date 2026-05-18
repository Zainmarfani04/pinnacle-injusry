import { createAdminClient, createClient } from '@/lib/supabase/server'
import { formatDate } from '@/lib/utils'

export default async function LawyersPage() {
  const supabase = await createClient()
  const adminClient = createAdminClient()
  await supabase.auth.getUser()

  const { data: lawyers } = await adminClient
    .from('profiles')
    .select('*')
    .eq('role', 'lawyer')
    .order('created_at', { ascending: false })

  const { data: caseCounts } = await adminClient
    .from('cases')
    .select('assigned_lawyer_id, status')

  const countMap = (caseCounts || []).reduce((acc: Record<string, { total: number; active: number }>, c: any) => {
    if (!c.assigned_lawyer_id) return acc
    if (!acc[c.assigned_lawyer_id]) acc[c.assigned_lawyer_id] = { total: 0, active: 0 }
    acc[c.assigned_lawyer_id].total++
    if (!['settled', 'closed', 'rejected'].includes(c.status)) acc[c.assigned_lawyer_id].active++
    return acc
  }, {})

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold" style={{ fontFamily: 'var(--font-syne)' }}>Lawyers</h1>
        <p className="text-sm text-[#8d95a8] mt-1">{lawyers?.length ?? 0} attorneys on the platform</p>
      </div>

      <div className="bg-[#161b25] border border-white/[0.07] rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-white/[0.02]">
              {['Attorney', 'Firm', 'Phone', 'Active Cases', 'Total Cases', 'Joined'].map(h => (
                <th key={h} className="text-left px-5 py-3 text-[10px] font-semibold uppercase tracking-widest text-[#4e5668] border-b border-white/[0.07]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(lawyers || []).map((l: any) => {
              const counts = countMap[l.id] ?? { total: 0, active: 0 }
              return (
                <tr key={l.id} className="border-b border-white/[0.05] hover:bg-white/[0.02] transition-colors last:border-0">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-[10px] font-bold text-emerald-400">
                        {l.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-medium">{l.full_name}</div>
                        <div className="text-xs text-[#4e5668]">{l.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-xs text-[#8d95a8]">{l.firm_name ?? '—'}</td>
                  <td className="px-5 py-3 text-xs text-[#8d95a8]">{l.phone ?? '—'}</td>
                  <td className="px-5 py-3">
                    <span className="text-xs font-semibold text-emerald-400">{counts.active}</span>
                  </td>
                  <td className="px-5 py-3 text-xs text-[#8d95a8]">{counts.total}</td>
                  <td className="px-5 py-3 text-xs text-[#4e5668]">{formatDate(l.created_at)}</td>
                </tr>
              )
            })}
            {!lawyers?.length && (
              <tr><td colSpan={6} className="px-5 py-10 text-center text-sm text-[#4e5668]">No lawyers yet. Invite attorneys from the Users page.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
