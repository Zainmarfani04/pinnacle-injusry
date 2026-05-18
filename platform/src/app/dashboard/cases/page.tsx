import { createClient, createAdminClient } from '@/lib/supabase/server'
import { STATUS_LABELS, STATUS_COLORS, CASE_TYPE_LABELS, formatDate, cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import Link from 'next/link'
import type { CaseStatus } from '@/types/database'

export default async function CasesPage() {
  const supabase = await createClient()
  const adminClient = createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await adminClient.from('profiles').select('role').eq('id', user!.id).single()

  let query = adminClient
    .from('cases')
    .select('*, client:profiles!cases_client_id_fkey(full_name, email), specialist:profiles!cases_assigned_specialist_id_fkey(full_name), lawyer:profiles!cases_assigned_lawyer_id_fkey(full_name)')
    .order('created_at', { ascending: false })

  if (profile?.role === 'lawyer') {
    query = query.eq('assigned_lawyer_id', user!.id)
  }

  const { data: cases } = await query

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold font-[var(--font-syne)]">Cases</h1>
          <p className="text-sm text-[#8d95a8] mt-1">{cases?.length ?? 0} total cases</p>
        </div>
        {(profile?.role === 'admin' || profile?.role === 'specialist') && (
          <Button asChild className="bg-gradient-to-r from-[#c9a84c] to-[#e8c76a] text-[#0a0c10] font-semibold hover:opacity-90 border-0 font-[var(--font-syne)]">
            <Link href="/dashboard/cases/new">+ New Case</Link>
          </Button>
        )}
      </div>

      <Card className="bg-[#161b25] border-white/[0.07]">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-white/[0.02] border-b border-white/[0.07] hover:bg-white/[0.02]">
                {['Case #', 'Client', 'Type', 'Status', 'Specialist', 'Lawyer', 'Created', ''].map(h => (
                  <TableHead key={h} className="text-[10px] font-semibold uppercase tracking-widest text-[#4e5668]">{h}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {(cases || []).map((c: any) => (
                <TableRow key={c.id} className="border-b border-white/[0.05] hover:bg-white/[0.02]">
                  <TableCell className="font-mono text-xs text-[#c9a84c]">{c.case_number}</TableCell>
                  <TableCell>
                    <div className="text-sm font-medium">{c.client?.full_name ?? '—'}</div>
                    <div className="text-xs text-[#4e5668]">{c.client?.email}</div>
                  </TableCell>
                  <TableCell className="text-xs text-[#8d95a8]">{CASE_TYPE_LABELS[c.case_type as keyof typeof CASE_TYPE_LABELS] ?? c.case_type}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn('border-0 text-[11px]', STATUS_COLORS[c.status as CaseStatus] ?? '')}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1" />
                      {STATUS_LABELS[c.status as CaseStatus] ?? c.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-[#8d95a8]">{c.specialist?.full_name ?? '—'}</TableCell>
                  <TableCell className="text-xs text-[#8d95a8]">{c.lawyer?.full_name ?? '—'}</TableCell>
                  <TableCell className="text-xs text-[#4e5668]">{formatDate(c.created_at)}</TableCell>
                  <TableCell>
                    <Link href={`/dashboard/cases/${c.id}`} className="text-xs text-[#c9a84c] hover:text-[#e8c76a] transition-colors">View →</Link>
                  </TableCell>
                </TableRow>
              ))}
              {!cases?.length && (
                <TableRow>
                  <TableCell colSpan={8} className="py-10 text-center text-sm text-[#4e5668]">No cases found.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
