import { createClient } from '@/lib/supabase/server'
import { STATUS_LABELS, STATUS_COLORS, CASE_TYPE_LABELS, formatDate } from '@/lib/utils'
import Link from 'next/link'
import type { CaseStatus } from '@/types/database'

export default async function CasesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user!.id).single()

  let query = supabase
    .from('cases')
    .select('*, client:profiles!cases_client_id_fkey(full_name, email), specialist:profiles!cases_assigned_specialist_id_fkey(full_name), lawyer:profiles!cases_assigned_lawyer_id_fkey(full_name)')
    .order('created_at', { ascending: false })

  if (profile?.role === 'lawyer') {
    query = query.eq('assigned_lawyer_id', user!.id)
  }

  const { data: cases } = await query

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold" style={{ fontFamily: 'var(--font-syne)' }}>Cases</h1>
          <p className="text-sm text-[#8d95a8] mt-1">{cases?.length ?? 0} total cases</p>
        </div>
        {(profile?.role === 'admin' || profile?.role === 'specialist') && (
          <Link href="/dashboard/cases/new"
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#c9a84c] to-[#e8c76a] text-[#0a0c10] text-sm font-semibold hover:opacity-90 transition-opacity"
            style={{ fontFamily: 'var(--font-syne)' }}>
            + New Case
          </Link>
        )}
      </div>

      <div className="bg-[#161b25] border border-white/[0.07] rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-white/[0.02]">
              {['Case #', 'Client', 'Type', 'Status', 'Specialist', 'Lawyer', 'Created', ''].map(h => (
                <th key={h} className="text-left px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-[#4e5668] border-b border-white/[0.07]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(cases || []).map((c: any) => (
              <tr key={c.id} className="border-b border-white/[0.05] hover:bg-white/[0.02] transition-colors last:border-0">
                <td className="px-4 py-3 font-mono text-xs text-[#c9a84c]">{c.case_number}</td>
                <td className="px-4 py-3">
                  <div className="text-sm font-medium">{c.client?.full_name ?? '—'}</div>
                  <div className="text-xs text-[#4e5668]">{c.client?.email}</div>
                </td>
                <td className="px-4 py-3 text-xs text-[#8d95a8]">{CASE_TYPE_LABELS[c.case_type as keyof typeof CASE_TYPE_LABELS] ?? c.case_type}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[c.status as CaseStatus] ?? ''}`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-current" />
                    {STATUS_LABELS[c.status as CaseStatus] ?? c.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-[#8d95a8]">{c.specialist?.full_name ?? '—'}</td>
                <td className="px-4 py-3 text-xs text-[#8d95a8]">{c.lawyer?.full_name ?? '—'}</td>
                <td className="px-4 py-3 text-xs text-[#4e5668]">{formatDate(c.created_at)}</td>
                <td className="px-4 py-3">
                  <Link href={`/dashboard/cases/${c.id}`} className="text-xs text-[#c9a84c] hover:text-[#e8c76a] transition-colors">View →</Link>
                </td>
              </tr>
            ))}
            {!cases?.length && (
              <tr><td colSpan={8} className="px-4 py-10 text-center text-sm text-[#4e5668]">No cases found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
