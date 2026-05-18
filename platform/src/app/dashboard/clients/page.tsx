import { createAdminClient, createClient } from '@/lib/supabase/server'
import { formatDate } from '@/lib/utils'
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

  const { data: caseCounts } = await adminClient
    .from('cases')
    .select('client_id')

  const countMap = (caseCounts || []).reduce((acc: Record<string, number>, c: any) => {
    acc[c.client_id] = (acc[c.client_id] || 0) + 1
    return acc
  }, {})

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold" style={{ fontFamily: 'var(--font-syne)' }}>Clients</h1>
        <p className="text-sm text-[#8d95a8] mt-1">{clients?.length ?? 0} registered clients</p>
      </div>

      <div className="bg-[#161b25] border border-white/[0.07] rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-white/[0.02]">
              {['Client', 'Phone', 'Cases', 'Notifications', 'Joined', ''].map(h => (
                <th key={h} className="text-left px-5 py-3 text-[10px] font-semibold uppercase tracking-widest text-[#4e5668] border-b border-white/[0.07]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(clients || []).map((c: any) => (
              <tr key={c.id} className="border-b border-white/[0.05] hover:bg-white/[0.02] transition-colors last:border-0">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-white/[0.07] flex items-center justify-center text-[10px] font-bold text-[#8d95a8]">
                      {c.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-sm font-medium">{c.full_name}</div>
                      <div className="text-xs text-[#4e5668]">{c.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3 text-xs text-[#8d95a8]">{c.phone ?? '—'}</td>
                <td className="px-5 py-3 text-xs font-medium">{countMap[c.id] ?? 0}</td>
                <td className="px-5 py-3 text-xs text-[#8d95a8] capitalize">{c.notification_channel}</td>
                <td className="px-5 py-3 text-xs text-[#4e5668]">{formatDate(c.created_at)}</td>
                <td className="px-5 py-3">
                  <Link href={`/dashboard/cases?client=${c.id}`} className="text-xs text-[#c9a84c] hover:text-[#e8c76a] transition-colors">
                    View cases →
                  </Link>
                </td>
              </tr>
            ))}
            {!clients?.length && (
              <tr><td colSpan={6} className="px-5 py-10 text-center text-sm text-[#4e5668]">No clients yet. Invite clients from the Users page.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
