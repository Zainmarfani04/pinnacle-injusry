'use client'

import { useState } from 'react'

export default function InviteUserButton() {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('specialist')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    const res = await fetch('/api/invitations/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, role }),
    })
    const data = await res.json()
    if (data.error) {
      setError(data.error)
    } else {
      setSuccess(`Invitation sent to ${email}`)
      setEmail('')
      setRole('specialist')
    }
    setLoading(false)
  }

  return (
    <>
      <button onClick={() => setOpen(true)}
        className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#c9a84c] to-[#e8c76a] text-[#0a0c10] text-sm font-semibold hover:opacity-90 transition-opacity"
        style={{ fontFamily: 'var(--font-syne)' }}>
        + Invite User
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && setOpen(false)}>
          <div className="bg-[#161b25] border border-white/[0.13] rounded-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.07]">
              <h2 className="font-semibold text-sm" style={{ fontFamily: 'var(--font-syne)' }}>Invite New User</h2>
              <button onClick={() => setOpen(false)} className="text-[#4e5668] hover:text-[#f0f2f7] text-lg leading-none">×</button>
            </div>
            <form onSubmit={handleInvite} className="p-6 space-y-4">
              {success && <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-4 py-3 text-sm text-emerald-400">{success}</div>}
              {error && <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-sm text-red-400">{error}</div>}
              <div>
                <label className="block text-[11px] font-medium uppercase tracking-widest text-[#8d95a8] mb-1.5">Email Address</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="jane@lawfirm.com"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-white/[0.13] bg-white/[0.04] text-sm text-[#f0f2f7] placeholder-[#4e5668] outline-none focus:border-[#c9a84c] transition-colors" />
              </div>
              <div>
                <label className="block text-[11px] font-medium uppercase tracking-widest text-[#8d95a8] mb-1.5">Role</label>
                <select value={role} onChange={e => setRole(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-white/[0.13] bg-[#0a0c10] text-sm text-[#f0f2f7] outline-none focus:border-[#c9a84c] transition-colors">
                  <option value="specialist">Specialist (Internal)</option>
                  <option value="lawyer">Lawyer</option>
                  <option value="client">Client</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setOpen(false)}
                  className="flex-1 py-2.5 rounded-lg border border-white/[0.13] text-sm text-[#8d95a8] hover:bg-white/[0.04] transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={loading}
                  className="flex-1 py-2.5 rounded-lg bg-gradient-to-r from-[#c9a84c] to-[#e8c76a] text-[#0a0c10] text-sm font-semibold disabled:opacity-60 hover:opacity-90 transition-opacity"
                  style={{ fontFamily: 'var(--font-syne)' }}>
                  {loading ? 'Sending…' : 'Send Invitation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
