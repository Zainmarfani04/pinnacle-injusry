import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { STATUS_LABELS, STATUS_COLORS, CASE_TYPE_LABELS, formatDate, formatCurrency, cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import type { CaseStatus } from '@/types/database'

export default async function ClientPortalPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile) redirect('/login')
  if (profile.role !== 'client') redirect('/dashboard')

  const { data: cases } = await supabase
    .from('cases')
    .select('*, specialist:profiles!cases_assigned_specialist_id_fkey(full_name, email), lawyer:profiles!cases_assigned_lawyer_id_fkey(full_name, email, firm_name)')
    .eq('client_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-[#0a0c10]">
      <header className="bg-[#161b25] border-b border-white/[0.07] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#c9a84c] to-[#e8c76a] flex items-center justify-center text-[#0a0c10] font-bold text-xs font-[var(--font-syne)]">P</div>
          <div>
            <div className="text-xs font-semibold font-[var(--font-syne)]">Pinnacle Injury Consultants</div>
            <div className="text-[10px] text-[#4e5668]">Client Portal</div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-sm font-medium">{profile.full_name}</div>
            <div className="text-xs text-[#4e5668]">{profile.email}</div>
          </div>
          <form action="/api/auth/signout" method="POST">
            <button type="submit" className="text-xs text-[#4e5668] hover:text-red-400 transition-colors">Sign out</button>
          </form>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-xl font-bold font-[var(--font-syne)]">My Cases</h1>
          <p className="text-sm text-[#8d95a8] mt-1">Track the progress of your injury cases below.</p>
        </div>

        {cases?.length ? (
          <div className="space-y-4">
            {cases.map((c: any) => (
              <Card key={c.id} className="bg-[#161b25] border-white/[0.07]">
                <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-white/[0.07]">
                  <div>
                    <div className="font-mono text-xs text-[#c9a84c] mb-1">{c.case_number}</div>
                    <div className="font-semibold font-[var(--font-syne)]">
                      {CASE_TYPE_LABELS[c.case_type as keyof typeof CASE_TYPE_LABELS]}
                    </div>
                    <div className="text-xs text-[#4e5668] mt-0.5">Opened {formatDate(c.created_at)}</div>
                  </div>
                  <Badge variant="outline" className={cn('border-0 text-[11px]', STATUS_COLORS[c.status as CaseStatus])}>
                    <span className="w-1.5 h-1.5 rounded-full bg-current mr-1" />
                    {STATUS_LABELS[c.status as CaseStatus]}
                  </Badge>
                </CardHeader>

                <CardContent className="pt-4 space-y-4">
                  <StatusTimeline status={c.status} />

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {c.incident_date && (
                      <div>
                        <div className="text-[10px] text-[#4e5668] uppercase tracking-widest mb-0.5">Incident Date</div>
                        <div>{formatDate(c.incident_date)}</div>
                      </div>
                    )}
                    {c.estimated_value && (
                      <div>
                        <div className="text-[10px] text-[#4e5668] uppercase tracking-widest mb-0.5">Estimated Value</div>
                        <div>{formatCurrency(c.estimated_value)}</div>
                      </div>
                    )}
                    {(c.specialist as any)?.full_name && (
                      <div>
                        <div className="text-[10px] text-[#4e5668] uppercase tracking-widest mb-0.5">Your Specialist</div>
                        <div>{(c.specialist as any).full_name}</div>
                        <div className="text-xs text-[#4e5668]">{(c.specialist as any).email}</div>
                      </div>
                    )}
                    {(c.lawyer as any)?.full_name && (
                      <div>
                        <div className="text-[10px] text-[#4e5668] uppercase tracking-widest mb-0.5">Your Attorney</div>
                        <div>{(c.lawyer as any).full_name}</div>
                        {(c.lawyer as any).firm_name && <div className="text-xs text-[#4e5668]">{(c.lawyer as any).firm_name}</div>}
                      </div>
                    )}
                  </div>

                  <Separator className="bg-white/[0.07]" />
                  <p className="text-xs text-[#4e5668]">
                    Questions? Contact us at{' '}
                    <span className="text-[#c9a84c]">intake@pinnacleinjuryconsultants.com</span>
                    {' '}or call{' '}
                    <span className="text-[#c9a84c]">(832) 707-9867</span>
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="bg-[#161b25] border-white/[0.07]">
            <CardContent className="py-10 text-center">
              <div className="font-semibold mb-1 font-[var(--font-syne)]">No cases yet</div>
              <p className="text-sm text-[#8d95a8]">Your cases will appear here once your specialist creates them.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

const STATUS_ORDER: CaseStatus[] = ['lead', 'intake', 'sent_to_attorney', 'accepted', 'signed', 'settled']

function StatusTimeline({ status }: { status: string }) {
  const currentIndex = STATUS_ORDER.indexOf(status as CaseStatus)
  return (
    <div className="flex items-center gap-1">
      {STATUS_ORDER.map((s, i) => {
        const done = i <= currentIndex
        const current = i === currentIndex
        return (
          <div key={s} className="flex items-center flex-1 last:flex-none">
            <div className={cn('flex flex-col items-center gap-1', done ? 'opacity-100' : 'opacity-30')}>
              <div className={cn('w-2.5 h-2.5 rounded-full border-2 transition-all',
                current ? 'border-[#c9a84c] bg-[#c9a84c]' : done ? 'border-[#c9a84c] bg-[#c9a84c]/30' : 'border-[#4e5668]'
              )} />
              <div className="text-[9px] text-[#4e5668] whitespace-nowrap">{STATUS_LABELS[s]}</div>
            </div>
            {i < STATUS_ORDER.length - 1 && (
              <div className={cn('flex-1 h-px mx-1 mb-3.5', done && i < currentIndex ? 'bg-[#c9a84c]/40' : 'bg-white/[0.07]')} />
            )}
          </div>
        )
      })}
    </div>
  )
}
