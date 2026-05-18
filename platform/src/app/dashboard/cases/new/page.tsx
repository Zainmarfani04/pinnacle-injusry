'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
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

  const inputCls = 'w-full px-3.5 py-2.5 rounded-lg border border-white/[0.13] bg-white/[0.04] text-sm text-[#f0f2f7] placeholder-[#4e5668] outline-none focus:border-[#c9a84c] transition-colors'
  const selectCls = 'w-full px-3.5 py-2.5 rounded-lg border border-white/[0.13] bg-[#0a0c10] text-sm text-[#f0f2f7] outline-none focus:border-[#c9a84c] transition-colors'
  const labelCls = 'block text-[11px] font-medium uppercase tracking-widest text-[#8d95a8] mb-1.5'

  return (
    <div className="p-6 max-w-3xl">
      <div className="mb-6">
        <button onClick={() => router.back()} className="text-sm text-[#8d95a8] hover:text-[#f0f2f7] transition-colors mb-3">← Back</button>
        <h1 className="text-xl font-bold" style={{ fontFamily: 'var(--font-syne)' }}>New Case</h1>
      </div>

      {error && <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-sm text-red-400 mb-5">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-[#161b25] border border-white/[0.07] rounded-xl p-5">
          <h2 className="text-sm font-semibold mb-4" style={{ fontFamily: 'var(--font-syne)' }}>Assignment</h2>
          <div className="grid grid-cols-3 gap-4">
            <div><label className={labelCls}>Client *</label>
              <select value={form.client_id} onChange={e => set('client_id', e.target.value)} required className={selectCls}>
                <option value="">Select client…</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
              </select>
            </div>
            <div><label className={labelCls}>Specialist</label>
              <select value={form.assigned_specialist_id} onChange={e => set('assigned_specialist_id', e.target.value)} className={selectCls}>
                <option value="">Unassigned</option>
                {specialists.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
              </select>
            </div>
            <div><label className={labelCls}>Lawyer</label>
              <select value={form.assigned_lawyer_id} onChange={e => set('assigned_lawyer_id', e.target.value)} className={selectCls}>
                <option value="">Unassigned</option>
                {lawyers.map(l => <option key={l.id} value={l.id}>{l.full_name}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="bg-[#161b25] border border-white/[0.07] rounded-xl p-5">
          <h2 className="text-sm font-semibold mb-4" style={{ fontFamily: 'var(--font-syne)' }}>Case Details</h2>
          <div className="grid grid-cols-2 gap-4">
            <div><label className={labelCls}>Case Type</label>
              <select value={form.case_type} onChange={e => set('case_type', e.target.value)} className={selectCls}>
                <option value="auto_accident">Auto Accident</option>
                <option value="slip_and_fall">Slip & Fall</option>
                <option value="workplace_injury">Workplace Injury</option>
                <option value="medical_malpractice">Medical Malpractice</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div><label className={labelCls}>Incident Date</label>
              <input type="date" value={form.incident_date} onChange={e => set('incident_date', e.target.value)} className={inputCls} />
            </div>
            <div className="col-span-2"><label className={labelCls}>Accident Location</label>
              <input type="text" value={form.accident_location} onChange={e => set('accident_location', e.target.value)} placeholder="123 Main St, Houston TX" className={inputCls} />
            </div>
            <div className="col-span-2"><label className={labelCls}>Description</label>
              <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={3} placeholder="Brief description of the incident…" className={inputCls} />
            </div>
            <div className="col-span-2"><label className={labelCls}>Injuries</label>
              <textarea value={form.injuries} onChange={e => set('injuries', e.target.value)} rows={2} placeholder="Describe the injuries sustained…" className={inputCls} />
            </div>
          </div>
        </div>

        <div className="bg-[#161b25] border border-white/[0.07] rounded-xl p-5">
          <h2 className="text-sm font-semibold mb-4" style={{ fontFamily: 'var(--font-syne)' }}>Additional Info</h2>
          <div className="grid grid-cols-2 gap-4">
            <div><label className={labelCls}>Medical Provider</label>
              <input type="text" value={form.medical_provider} onChange={e => set('medical_provider', e.target.value)} placeholder="Houston Medical Center" className={inputCls} />
            </div>
            <div><label className={labelCls}>Estimated Value ($)</label>
              <input type="number" value={form.estimated_value} onChange={e => set('estimated_value', e.target.value)} placeholder="50000" className={inputCls} />
            </div>
            <div><label className={labelCls}>Police Report #</label>
              <input type="text" value={form.police_report_number} onChange={e => set('police_report_number', e.target.value)} className={inputCls} />
            </div>
            <div><label className={labelCls}>Insurance Claim #</label>
              <input type="text" value={form.insurance_claim_number} onChange={e => set('insurance_claim_number', e.target.value)} className={inputCls} />
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button type="button" onClick={() => router.back()}
            className="px-5 py-2.5 rounded-lg border border-white/[0.13] text-sm text-[#8d95a8] hover:bg-white/[0.04] transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={loading}
            className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-[#c9a84c] to-[#e8c76a] text-[#0a0c10] text-sm font-semibold disabled:opacity-60 hover:opacity-90 transition-opacity"
            style={{ fontFamily: 'var(--font-syne)' }}>
            {loading ? 'Creating…' : 'Create Case'}
          </button>
        </div>
      </form>
    </div>
  )
}
