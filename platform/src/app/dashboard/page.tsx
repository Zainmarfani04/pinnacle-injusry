import { createClient, createAdminClient } from '@/lib/supabase/server'
import { formatCurrency, STATUS_LABELS, STATUS_COLORS, cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import Link from 'next/link'
import type { CaseStatus } from '@/types/database'

export default async function DashboardPage() {
  const supabase = await createClient()
  const adminClient = createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: cases }, { data: profile }] = await Promise.all([
    adminClient.from('cases').select('*, client:profiles!cases_client_id_fkey(full_name)').order('created_at', { ascending: false }).limit(5),
    adminClient.from('profiles').select('*').eq('id', user!.id).single(),
  ])

  const { data: statusCounts } = await adminClient.from('cases').select('status')

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
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold font-[var(--font-syne)]">
          Good morning, {profile?.full_name?.split(' ')[0]}
        </h1>
        <p className="text-sm text-[#8d95a8] mt-1">Here&apos;s what&apos;s happening with your cases today.</p>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {metrics.map(m => (
          <Card key={m.label} className="bg-[#161b25] border-white/[0.07] relative overflow-hidden">
            <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${m.color} to-transparent opacity-70`} />
            <CardContent className="pt-4">
              <div className="text-[11px] text-[#4e5668] uppercase tracking-widest mb-2">{m.label}</div>
              <div className="text-3xl font-bold font-[var(--font-syne)]">{m.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-[#161b25] border-white/[0.07]">
        <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-white/[0.07]">
          <CardTitle className="text-sm font-semibold font-[var(--font-syne)]">Recent Cases</CardTitle>
          <Link href="/dashboard/cases" className="text-xs text-[#c9a84c] hover:text-[#e8c76a] transition-colors">View all →</Link>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-white/[0.02] border-b border-white/[0.07] hover:bg-white/[0.02]">
                {['Case #', 'Client', 'Type', 'Status', 'Created'].map(h => (
                  <TableHead key={h} className="text-[10px] font-semibold uppercase tracking-widest text-[#4e5668]">{h}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {(cases || []).map((c: any) => (
                <TableRow key={c.id} className="border-b border-white/[0.05] hover:bg-white/[0.02]">
                  <TableCell>
                    <Link href={`/dashboard/cases/${c.id}`} className="text-xs font-mono text-[#c9a84c] hover:underline">{c.case_number}</Link>
                  </TableCell>
                  <TableCell className="text-sm">{(c.client as any)?.full_name ?? '—'}</TableCell>
                  <TableCell className="text-xs text-[#8d95a8] capitalize">{c.case_type?.replace(/_/g, ' ')}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn('border-0 text-[11px]', STATUS_COLORS[c.status as CaseStatus])}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1" />
                      {STATUS_LABELS[c.status as CaseStatus] ?? c.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-[#4e5668]">{new Date(c.created_at).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
              {!cases?.length && (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-sm text-[#4e5668]">
                    No cases yet.{' '}
                    <Link href="/dashboard/cases/new" className="text-[#c9a84c] hover:underline">Create the first one →</Link>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
