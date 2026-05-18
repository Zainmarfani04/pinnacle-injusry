'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'

export default function InviteUserButton() {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('specialist')
  const [loading, setLoading] = useState(false)

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const res = await fetch('/api/invitations/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, role }),
    })
    const data = await res.json()

    if (data.error) {
      toast.error(data.error)
    } else {
      toast.success(`Invitation sent to ${email}`)
      setEmail('')
      setRole('specialist')
      setOpen(false)
    }
    setLoading(false)
  }

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="bg-gradient-to-r from-[#c9a84c] to-[#e8c76a] text-[#0a0c10] font-semibold hover:opacity-90 border-0 font-[var(--font-syne)]"
      >
        + Invite User
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-[#161b25] border-white/[0.13] text-[#f0f2f7] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-[var(--font-syne)]">Invite New User</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleInvite} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-[#8d95a8] uppercase tracking-widest text-[11px]">Email Address</Label>
              <Input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="jane@lawfirm.com"
                className="bg-white/[0.04] border-white/[0.13] text-[#f0f2f7] placeholder:text-[#4e5668] focus-visible:ring-[#c9a84c]"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[#8d95a8] uppercase tracking-widest text-[11px]">Role</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger className="bg-white/[0.04] border-white/[0.13] text-[#f0f2f7] focus:ring-[#c9a84c]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#161b25] border-white/[0.13] text-[#f0f2f7]">
                  <SelectItem value="specialist">Specialist (Internal)</SelectItem>
                  <SelectItem value="lawyer">Lawyer</SelectItem>
                  <SelectItem value="client">Client</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter className="gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}
                className="border-white/[0.13] text-[#8d95a8] bg-transparent hover:bg-white/[0.04] hover:text-[#f0f2f7]">
                Cancel
              </Button>
              <Button type="submit" disabled={loading}
                className="bg-gradient-to-r from-[#c9a84c] to-[#e8c76a] text-[#0a0c10] font-semibold hover:opacity-90 border-0 font-[var(--font-syne)]">
                {loading ? 'Sending…' : 'Send Invitation'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
