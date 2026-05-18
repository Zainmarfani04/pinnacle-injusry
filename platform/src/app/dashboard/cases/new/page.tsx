'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Profile } from '@/types/database'

export default function NewCasePage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [clients, setClients] = useState<Profile[]>([])
  const [specialists, setSpecialists] = useState<Profile[]>([])
  const [lawyers, setLawyers] = useState<Profile[]>([])
  const [form, setForm] = useState({
    client_id: '', assigned_specialist_id: '', assigned_lawyer_id: '',
    case_type: 'auto_accident', incident_date: '', description: '',
    accident_location: '', injuries: '', medical_provider: '',
    police_report_number: '', insurance_claim_number: '', estimated_value: '',
  })

  useEffect(() => {
    Promise.all([
      supabase.from('profiles').select('*').eq('role', 'client').eq('is_active', true),
      supabase.from('profiles').select('*').eq('role', 'specialist').eq('is_active', true),
      supabase.from('profiles').select('*').eq('role', 'lawyer').eq('is_active', true),
    ]).then(([c, s, l]) => {
      setClients(c.data ?? [])
      setSpecialists(s.data ?? [])
      setLawyers(l.data ?? [])
    })
  }, [])

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.client_id) { setError('Please select a client'); return }
    setLoading(true)
    setError('')

    const payload = {
      ...form,
      assigned_specialist_id: form.assigned_specialist_id || null,
      assigned_lawyer_id: form.assigned_lawyer_id || null,
      estimated_value: form.estimated_value ? parseFloat(form.estimated_value) : null,
      incident_date: form.incident_date || null,
    }

    const res = await fetch('/api/cases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = await res.json()
    if (data.error) { setError(data.error); setLoading(false); return }
    router.push(`/dashboard/cases/${data.data.id}`)
  }

  const labelCls = 'text-[#8d95a8] uppercase tracking-widest text-[11px]'

  return (
    <div className="p-6 max-w-3xl space-y-6">
      <div>
        <button onClick={() => router.back()} className="text-sm text-[#8d95a8] hover:text-[#f0f2f7] transition-colors mb-3">← Back</button>
        <h1 className="text-xl font-bold font-[var(--font-syne)]">New Case</h1>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-sm text-red-400">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <Card className="bg-[#161b25] border-white/[0.07]">
          <CardHeader><CardTitle className="text-sm font-[var(--font-syne)]">Assignment</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className={labelCls}>Client *</Label>
                <Select value={form.client_id} onValueChange={v => set('client_id', v)} required>
                  <SelectTrigger className="bg-white/[0.04] border-white/[0.13] text-[#f0f2f7] focus:ring-[#c9a84c]">
                    <SelectValue placeholder="Select client…" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#161b25] border-white/[0.13] text-[#f0f2f7]">
                    {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.full_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className={labelCls}>Specialist</Label>
                <Select value={form.assigned_specialist_id} onValueChange={v => set('assigned_specialist_id', v)}>
                  <SelectTrigger className="bg-white/[0.04] border-white/[0.13] text-[#f0f2f7] focus:ring-[#c9a84c]">
                    <SelectValue placeholder="Unassigned" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#161b25] border-white/[0.13] text-[#f0f2f7]">
                    {specialists.map(s => <SelectItem key={s.id} value={s.id}>{s.full_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className={labelCls}>Lawyer</Label>
                <Select value={form.assigned_lawyer_id} onValueChange={v => set('assigned_lawyer_id', v)}>
                  <SelectTrigger className="bg-white/[0.04] border-white/[0.13] text-[#f0f2f7] focus:ring-[#c9a84c]">
                    <SelectValue placeholder="Unassigned" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#161b25] border-white/[0.13] text-[#f0f2f7]">
                    {lawyers.map(l => <SelectItem key={l.id} value={l.id}>{l.full_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#161b25] border-white/[0.07]">
          <CardHeader><CardTitle className="text-sm font-[var(--font-syne)]">Case Details</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className={labelCls}>Case Type</Label>
                <Select value={form.case_type} onValueChange={v => set('case_type', v)}>
                  <SelectTrigger className="bg-white/[0.04] border-white/[0.13] text-[#f0f2f7] focus:ring-[#c9a84c]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#161b25] border-white/[0.13] text-[#f0f2f7]">
                    <SelectItem value="auto_accident">Auto Accident</SelectItem>
                    <SelectItem value="slip_and_fall">Slip &amp; Fall</SelectItem>
                    <SelectItem value="workplace_injury">Workplace Injury</SelectItem>
                    <SelectItem value="medical_malpractice">Medical Malpractice</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className={labelCls}>Incident Date</Label>
                <Input type="date" value={form.incident_date} onChange={e => set('incident_date', e.target.value)}
                  className="bg-white/[0.04] border-white/[0.13] text-[#f0f2f7] focus-visible:ring-[#c9a84c]" />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label className={labelCls}>Accident Location</Label>
                <Input value={form.accident_location} onChange={e => set('accident_location', e.target.value)}
                  placeholder="123 Main St, Houston TX"
                  className="bg-white/[0.04] border-white/[0.13] text-[#f0f2f7] placeholder:text-[#4e5668] focus-visible:ring-[#c9a84c]" />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label className={labelCls}>Description</Label>
                <Textarea value={form.description} onChange={e => set('description', e.target.value)}
                  rows={3} placeholder="Brief description of the incident…"
                  className="bg-white/[0.04] border-white/[0.13] text-[#f0f2f7] placeholder:text-[#4e5668] focus-visible:ring-[#c9a84c] resize-none" />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label className={labelCls}>Injuries</Label>
                <Textarea value={form.injuries} onChange={e => set('injuries', e.target.value)}
                  rows={2} placeholder="Describe the injuries sustained…"
                  className="bg-white/[0.04] border-white/[0.13] text-[#f0f2f7] placeholder:text-[#4e5668] focus-visible:ring-[#c9a84c] resize-none" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#161b25] border-white/[0.07]">
          <CardHeader><CardTitle className="text-sm font-[var(--font-syne)]">Additional Info</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className={labelCls}>Medical Provider</Label>
                <Input value={form.medical_provider} onChange={e => set('medical_provider', e.target.value)}
                  placeholder="Houston Medical Center"
                  className="bg-white/[0.04] border-white/[0.13] text-[#f0f2f7] placeholder:text-[#4e5668] focus-visible:ring-[#c9a84c]" />
              </div>
              <div className="space-y-1.5">
                <Label className={labelCls}>Estimated Value ($)</Label>
                <Input type="number" value={form.estimated_value} onChange={e => set('estimated_value', e.target.value)}
                  placeholder="50000"
                  className="bg-white/[0.04] border-white/[0.13] text-[#f0f2f7] placeholder:text-[#4e5668] focus-visible:ring-[#c9a84c]" />
              </div>
              <div className="space-y-1.5">
                <Label className={labelCls}>Police Report #</Label>
                <Input value={form.police_report_number} onChange={e => set('police_report_number', e.target.value)}
                  className="bg-white/[0.04] border-white/[0.13] text-[#f0f2f7] focus-visible:ring-[#c9a84c]" />
              </div>
              <div className="space-y-1.5">
                <Label className={labelCls}>Insurance Claim #</Label>
                <Input value={form.insurance_claim_number} onChange={e => set('insurance_claim_number', e.target.value)}
                  className="bg-white/[0.04] border-white/[0.13] text-[#f0f2f7] focus-visible:ring-[#c9a84c]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={() => router.back()}
            className="border-white/[0.13] text-[#8d95a8] bg-transparent hover:bg-white/[0.04] hover:text-[#f0f2f7]">
            Cancel
          </Button>
          <Button type="submit" disabled={loading}
            className="bg-gradient-to-r from-[#c9a84c] to-[#e8c76a] text-[#0a0c10] font-semibold hover:opacity-90 border-0 font-[var(--font-syne)]">
            {loading ? 'Creating…' : 'Create Case'}
          </Button>
        </div>
      </form>
    </div>
  )
}
