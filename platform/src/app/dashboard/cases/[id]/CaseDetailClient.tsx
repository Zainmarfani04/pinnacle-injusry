'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { STATUS_LABELS } from '@/lib/utils'
import type { CaseStatus } from '@/types/database'

const STATUSES: CaseStatus[] = ['lead', 'intake', 'sent_to_attorney', 'accepted', 'rejected', 'signed', 'settled', 'closed']

export default function CaseDetailClient({ caseId, currentStatus }: { caseId: string; currentStatus: CaseStatus }) {
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState<CaseStatus>(currentStatus)
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch(`/api/cases/${caseId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, notes }),
    })
    const data = await res.json()
    if (data.error) { setError(data.error); setLoading(false); return }
    setOpen(false)
    router.refresh()
  }

  return (
    <>
      <button onClick={() => setOpen(true)}
        className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#c9a84c] to-[#e8c76a] text-[#0a0c10] text-sm font-semibold hover:opacity-90 transition-opacity"
        style={{ fontFamily: 'var(--font-syne)' }}>
        Update Status
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && setOpen(false)}>
          <div className="bg-[#161b25] border border-white/[0.13] rounded-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.07]">
              <h2 className="font-semibold text-sm" style={{ fontFamily: 'var(--font-syne)' }}>Update Case Status</h2>
              <button onClick={() => setOpen(false)} className="text-[#4e5668] hover:text-[#f0f2f7] text-lg leading-none">×</button>
            </div>
            <form onSubmit={handleUpdate} className="p-6 space-y-4">
              {error && <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-sm text-red-400">{error}</div>}
              <div>
                <label className="block text-[11px] font-medium uppercase tracking-widest text-[#8d95a8] mb-1.5">New Status</label>
                <select value={status} onChange={e => setStatus(e.target.value as CaseStatus)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-white/[0.13] bg-[#0a0c10] text-sm text-[#f0f2f7] outline-none focus:border-[#c9a84c] transition-colors">
                  {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-medium uppercase tracking-widest text-[#8d95a8] mb-1.5">Notes (sent to client)</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
                  placeholder="Optional message to include in the client notification…"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-white/[0.13] bg-white/[0.04] text-sm text-[#f0f2f7] placeholder-[#4e5668] outline-none focus:border-[#c9a84c] transition-colors resize-none" />
              </div>
              <p className="text-xs text-[#4e5668]">The client will be notified via email/SMS when you save.</p>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setOpen(false)}
                  className="flex-1 py-2.5 rounded-lg border border-white/[0.13] text-sm text-[#8d95a8] hover:bg-white/[0.04] transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={loading}
                  className="flex-1 py-2.5 rounded-lg bg-gradient-to-r from-[#c9a84c] to-[#e8c76a] text-[#0a0c10] text-sm font-semibold disabled:opacity-60 hover:opacity-90 transition-opacity"
                  style={{ fontFamily: 'var(--font-syne)' }}>
                  {loading ? 'Saving…' : 'Save & Notify'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
