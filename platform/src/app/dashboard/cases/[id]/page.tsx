import { createClient, createAdminClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { STATUS_LABELS, STATUS_COLORS, CASE_TYPE_LABELS, formatDate, formatCurrency, cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import CaseDetailClient from './CaseDetailClient'
import type { CaseStatus } from '@/types/database'

export default async function CaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const adminClient = createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: caseData }, { data: notes }, { data: profile }] = await Promise.all([
    adminClient.from('cases').select(`
      *,
      client:profiles!cases_client_id_fkey(id, full_name, email, phone),
      specialist:profiles!cases_assigned_specialist_id_fkey(id, full_name, email),
      lawyer:profiles!cases_assigned_lawyer_id_fkey(id, full_name, email, firm_name)
    `).eq('id', id).single(),
    adminClient.from('case_notes').select('*, author:profiles!case_notes_author_id_fkey(full_name, role)').eq('case_id', id).order('created_at', { ascending: false }),
    adminClient.from('profiles').select('role').eq('id', user!.id).single(),
  ])

  if (!caseData) notFound()

  const canEdit = profile?.role === 'admin' || profile?.role === 'specialist'

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs text-[#4e5668] font-mono mb-1">{caseData.case_number}</div>
          <h1 className="text-xl font-bold font-[var(--font-syne)]">
            {(caseData.client as any)?.full_name ?? 'Unknown Client'}
          </h1>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline" className={cn('border-0 text-[11px]', STATUS_COLORS[caseData.status as CaseStatus])}>
              <span className="w-1.5 h-1.5 rounded-full bg-current mr-1" />
              {STATUS_LABELS[caseData.status as CaseStatus]}
            </Badge>
            <span className="text-xs text-[#4e5668]">
              {CASE_TYPE_LABELS[caseData.case_type as keyof typeof CASE_TYPE_LABELS]}
            </span>
          </div>
        </div>
        {canEdit && <CaseDetailClient caseId={id} currentStatus={caseData.status as CaseStatus} />}
      </div>

      <div className="grid grid-cols-[1fr_320px] gap-5">
        <div className="space-y-4">
          <Card className="bg-[#161b25] border-white/[0.07]">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-semibold uppercase tracking-widest text-[#4e5668]">Case Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                {[
                  ['Incident Date', formatDate(caseData.incident_date)],
                  ['Estimated Value', formatCurrency(caseData.estimated_value)],
                  ['Settlement Amount', formatCurrency(caseData.settlement_amount)],
                  ['Police Report #', caseData.police_report_number ?? '—'],
                  ['Insurance Claim #', caseData.insurance_claim_number ?? '—'],
                  ['Medical Provider', caseData.medical_provider ?? '—'],
                  ['Created', formatDate(caseData.created_at)],
                  ['Last Updated', formatDate(caseData.updated_at)],
                ].map(([k, v]) => (
                  <div key={k}>
                    <div className="text-[11px] text-[#4e5668] uppercase tracking-widest mb-0.5">{k}</div>
                    <div className="text-[#f0f2f7]">{v}</div>
                  </div>
                ))}
              </div>
              {caseData.accident_location && (
                <div className="mt-3 pt-3 border-t border-white/[0.07]">
                  <div className="text-[11px] text-[#4e5668] uppercase tracking-widest mb-0.5">Location</div>
                  <div className="text-sm text-[#f0f2f7]">{caseData.accident_location}</div>
                </div>
              )}
              {caseData.description && (
                <div className="mt-3 pt-3 border-t border-white/[0.07]">
                  <div className="text-[11px] text-[#4e5668] uppercase tracking-widest mb-0.5">Description</div>
                  <div className="text-sm text-[#8d95a8] leading-relaxed">{caseData.description}</div>
                </div>
              )}
              {caseData.injuries && (
                <div className="mt-3 pt-3 border-t border-white/[0.07]">
                  <div className="text-[11px] text-[#4e5668] uppercase tracking-widest mb-0.5">Injuries</div>
                  <div className="text-sm text-[#8d95a8] leading-relaxed">{caseData.injuries}</div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-[#161b25] border-white/[0.07]">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-semibold uppercase tracking-widest text-[#4e5668]">Case Notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {canEdit && <AddNoteForm caseId={id} userId={user!.id} />}
              <div className="space-y-3">
                {(notes || []).map((n: any) => (
                  <div key={n.id} className="border border-white/[0.07] rounded-lg p-3.5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-[#f0f2f7]">{n.author?.full_name}</span>
                      <div className="flex items-center gap-2">
                        {n.is_internal && (
                          <Badge variant="outline" className="text-[10px] border-0 bg-amber-500/15 text-amber-400 px-1.5 h-5">Internal</Badge>
                        )}
                        <span className="text-[11px] text-[#4e5668]">{formatDate(n.created_at)}</span>
                      </div>
                    </div>
                    <p className="text-sm text-[#8d95a8] leading-relaxed">{n.content}</p>
                  </div>
                ))}
                {!notes?.length && <p className="text-sm text-[#4e5668] text-center py-4">No notes yet.</p>}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <PersonCard title="Client" person={caseData.client as any} />
          <PersonCard title="Specialist" person={caseData.specialist as any} />
          <PersonCard title="Lawyer" person={caseData.lawyer as any} extra={(caseData.lawyer as any)?.firm_name} />
        </div>
      </div>
    </div>
  )
}

function PersonCard({ title, person, extra }: { title: string; person: any; extra?: string }) {
  const initials = person?.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() ?? '?'
  return (
    <Card className="bg-[#161b25] border-white/[0.07]">
      <CardContent className="pt-4">
        <div className="text-[10px] font-semibold uppercase tracking-widest text-[#4e5668] mb-3">{title}</div>
        {person ? (
          <div className="flex items-center gap-2.5">
            <Avatar className="w-8 h-8 shrink-0">
              <AvatarFallback className="bg-gradient-to-br from-[#c9a84c] to-[#e8c76a] text-[#0a0c10] text-[10px] font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium text-sm">{person.full_name}</div>
              {extra && <div className="text-xs text-[#8d95a8]">{extra}</div>}
              <div className="text-xs text-[#4e5668]">{person.email}</div>
              {person.phone && <div className="text-xs text-[#4e5668]">{person.phone}</div>}
            </div>
          </div>
        ) : (
          <div className="text-sm text-[#4e5668]">Unassigned</div>
        )}
      </CardContent>
    </Card>
  )
}

function AddNoteForm({ caseId, userId }: { caseId: string; userId: string }) {
  return (
    <form action={async (fd: FormData) => {
      'use server'
      const content = fd.get('content') as string
      const isInternal = fd.get('is_internal') === 'on'
      if (!content?.trim()) return
      const { createClient } = await import('@/lib/supabase/server')
      const supabase = await createClient()
      await supabase.from('case_notes').insert({ case_id: caseId, author_id: userId, content, is_internal: isInternal })
    }} className="flex flex-col gap-2">
      <Textarea name="content" rows={2} placeholder="Add a note…"
        className="bg-white/[0.04] border-white/[0.13] text-[#f0f2f7] placeholder:text-[#4e5668] focus-visible:ring-[#c9a84c] resize-none" />
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-xs text-[#8d95a8] cursor-pointer">
          <input type="checkbox" name="is_internal" className="accent-[#c9a84c]" />
          Internal note
        </label>
        <Button type="submit" size="sm"
          className="bg-gradient-to-r from-[#c9a84c] to-[#e8c76a] text-[#0a0c10] font-semibold hover:opacity-90 border-0 text-xs">
          Add Note
        </Button>
      </div>
    </form>
  )
}
