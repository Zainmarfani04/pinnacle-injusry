import { createAdminClient, createClient } from '@/lib/supabase/server'
import { STATUS_LABELS } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'
import type { CaseStatus } from '@/types/database'

const PIPELINE_STAGES: CaseStatus[] = ['lead', 'intake', 'sent_to_attorney', 'accepted', 'signed', 'settled']

const stageColors: Record<string, string> = {
  lead: 'bg-blue-500',
  intake: 'bg-amber-500',
  sent_to_attorney: 'bg-purple-500',
  accepted: 'bg-emerald-500',
  signed: 'bg-violet-500',
  settled: 'bg-emerald-400',
}

export default async function PipelinePage() {
  const supabase = await createClient()
  const adminClient = createAdminClient()
  await supabase.auth.getUser()

  const { data: cases } = await adminClient
    .from('cases')
    .select('*, client:profiles!cases_client_id_fkey(full_name)')
    .order('created_at', { ascending: false })

  const byStatus = PIPELINE_STAGES.reduce((acc, status) => {
    acc[status] = (cases || []).filter((c: any) => c.status === status)
    return acc
  }, {} as Record<string, any[]>)

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="mb-5">
        <h1 className="text-xl font-bold font-[var(--font-syne)]">Pipeline</h1>
        <p className="text-sm text-[#8d95a8] mt-1">Case stages across the full lifecycle.</p>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-4 flex-1">
        {PIPELINE_STAGES.map(status => (
          <div key={status} className="min-w-[220px] w-[220px] flex flex-col">
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${stageColors[status]}`} />
                <span className="text-xs font-semibold text-[#8d95a8] uppercase tracking-widest">
                  {STATUS_LABELS[status]}
                </span>
              </div>
              <span className="text-xs font-bold text-[#4e5668] bg-white/[0.05] px-2 py-0.5 rounded-full">
                {byStatus[status]?.length ?? 0}
              </span>
            </div>

            <div className={`h-0.5 rounded-full mb-3 ${stageColors[status]} opacity-40`} />

            <div className="flex flex-col gap-2 flex-1">
              {byStatus[status]?.map((c: any) => (
                <Link key={c.id} href={`/dashboard/cases/${c.id}`}>
                  <Card className="bg-[#161b25] border-white/[0.07] hover:border-white/[0.15] transition-colors">
                    <CardContent className="p-3">
                      <div className="text-xs font-mono text-[#c9a84c] mb-1">{c.case_number}</div>
                      <div className="text-sm font-medium text-[#f0f2f7] mb-1 truncate">
                        {c.client?.full_name ?? '—'}
                      </div>
                      <div className="text-[11px] text-[#4e5668] capitalize">
                        {c.case_type?.replace(/_/g, ' ')}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
              {!byStatus[status]?.length && (
                <div className="text-center py-6 text-xs text-[#4e5668] border border-dashed border-white/[0.07] rounded-lg">
                  No cases
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
