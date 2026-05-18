'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { STATUS_LABELS } from '@/lib/utils'
import type { CaseStatus } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'

const STATUSES: CaseStatus[] = ['lead', 'intake', 'sent_to_attorney', 'accepted', 'rejected', 'signed', 'settled', 'closed']

export default function CaseDetailClient({ caseId, currentStatus }: { caseId: string; currentStatus: CaseStatus }) {
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState<CaseStatus>(currentStatus)
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const res = await fetch(`/api/cases/${caseId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, notes }),
    })
    const data = await res.json()

    if (data.error) {
      toast.error(data.error)
      setLoading(false)
      return
    }

    toast.success('Status updated — client has been notified.')
    setOpen(false)
    setLoading(false)
    router.refresh()
  }

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="bg-gradient-to-r from-[#c9a84c] to-[#e8c76a] text-[#0a0c10] font-semibold hover:opacity-90 border-0 font-[var(--font-syne)]"
      >
        Update Status
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-[#161b25] border-white/[0.13] text-[#f0f2f7] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-[var(--font-syne)]">Update Case Status</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleUpdate} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-[#8d95a8] uppercase tracking-widest text-[11px]">New Status</Label>
              <Select value={status} onValueChange={v => setStatus(v as CaseStatus)}>
                <SelectTrigger className="bg-white/[0.04] border-white/[0.13] text-[#f0f2f7] focus:ring-[#c9a84c]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#161b25] border-white/[0.13] text-[#f0f2f7]">
                  {STATUSES.map(s => (
                    <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[#8d95a8] uppercase tracking-widest text-[11px]">Notes (sent to client)</Label>
              <Textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Optional message included in the client notification…"
                rows={3}
                className="bg-white/[0.04] border-white/[0.13] text-[#f0f2f7] placeholder:text-[#4e5668] focus-visible:ring-[#c9a84c] resize-none"
              />
            </div>

            <p className="text-xs text-[#4e5668]">The client will be notified via email/SMS when you save.</p>

            <DialogFooter className="gap-2 pt-1">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}
                className="border-white/[0.13] text-[#8d95a8] bg-transparent hover:bg-white/[0.04] hover:text-[#f0f2f7]">
                Cancel
              </Button>
              <Button type="submit" disabled={loading}
                className="bg-gradient-to-r from-[#c9a84c] to-[#e8c76a] text-[#0a0c10] font-semibold hover:opacity-90 border-0 font-[var(--font-syne)]">
                {loading ? 'Saving…' : 'Save & Notify'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
