'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function AcceptInviteForm() {
  const [fullName, setFullName] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [invitation, setInvitation] = useState<{ email: string; role: string } | null>(null)
  const [checking, setChecking] = useState(true)
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const supabase = createClient()

  useEffect(() => {
    if (!token) { setError('Invalid invitation link.'); setChecking(false); return }
    fetch(`/api/invitations/validate?token=${token}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) setError(data.error)
        else setInvitation(data)
        setChecking(false)
      })
  }, [token])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!invitation) return
    setLoading(true)
    setError('')

    const res = await fetch('/api/invitations/accept', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, full_name: fullName, password, phone }),
    })
    const data = await res.json()
    if (data.error) { setError(data.error); setLoading(false); return }

    const { error: signInError } = await supabase.auth.signInWithPassword({ email: invitation.email, password })
    if (signInError) { setError(signInError.message); setLoading(false); return }
    router.push('/dashboard')
  }

  if (checking) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-[#c9a84c] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#c9a84c] to-[#e8c76a] flex items-center justify-center text-[#0a0c10] font-bold text-sm">P</div>
          <span className="font-semibold text-sm" style={{ fontFamily: 'var(--font-syne)' }}>Pinnacle Case Management</span>
        </div>

        {error && !invitation ? (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-bold mb-1.5" style={{ fontFamily: 'var(--font-syne)' }}>Set up your account</h1>
            <p className="text-sm text-[#8d95a8] mb-2">
              You were invited as <span className="text-[#f0f2f7] font-medium capitalize">{invitation?.role}</span>
            </p>
            <p className="text-xs text-[#4e5668] mb-8">{invitation?.email}</p>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-sm text-red-400 mb-5">{error}</div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-medium uppercase tracking-widest text-[#8d95a8] mb-1.5">Full Name</label>
                <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Jane Smith" required
                  className="w-full px-3.5 py-2.5 rounded-lg border border-white/[0.13] bg-white/[0.04] text-sm text-[#f0f2f7] placeholder-[#4e5668] outline-none focus:border-[#c9a84c] transition-colors" />
              </div>
              <div>
                <label className="block text-[11px] font-medium uppercase tracking-widest text-[#8d95a8] mb-1.5">Phone (for SMS alerts)</label>
                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+1 (555) 000-0000"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-white/[0.13] bg-white/[0.04] text-sm text-[#f0f2f7] placeholder-[#4e5668] outline-none focus:border-[#c9a84c] transition-colors" />
              </div>
              <div>
                <label className="block text-[11px] font-medium uppercase tracking-widest text-[#8d95a8] mb-1.5">Create Password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 8 characters" required minLength={8}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-white/[0.13] bg-white/[0.04] text-sm text-[#f0f2f7] placeholder-[#4e5668] outline-none focus:border-[#c9a84c] transition-colors" />
              </div>
              <button type="submit" disabled={loading}
                className="w-full py-2.5 rounded-lg bg-gradient-to-r from-[#c9a84c] to-[#e8c76a] text-[#0a0c10] font-semibold text-sm tracking-wide disabled:opacity-60 hover:opacity-90 transition-opacity"
                style={{ fontFamily: 'var(--font-syne)' }}>
                {loading ? 'Creating account…' : 'Create Account & Sign In'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}

export default function AcceptInvitePage() {
  return <Suspense><AcceptInviteForm /></Suspense>
}
