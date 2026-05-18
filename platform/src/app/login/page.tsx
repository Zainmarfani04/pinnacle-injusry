'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function LoginForm() {
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(
    searchParams.get('error') === 'no_profile'
      ? 'Your account was found but has no profile. Please run the database schema in Supabase first, then insert your admin profile row.'
      : ''
  )
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Brand panel */}
      <div className="hidden lg:flex w-[420px] min-w-[420px] bg-[#161b25] border-r border-white/[0.07] flex-col p-12 relative overflow-hidden">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-[radial-gradient(circle,rgba(201,168,76,0.1)_0%,transparent_70%)] pointer-events-none" />
        <div className="flex items-center gap-3 mb-auto">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#c9a84c] to-[#e8c76a] flex items-center justify-center text-[#0a0c10] font-bold text-lg" style={{ fontFamily: 'var(--font-syne)' }}>P</div>
          <div>
            <div className="font-bold text-sm tracking-wide" style={{ fontFamily: 'var(--font-syne)' }}>Pinnacle Injury Consultants</div>
            <div className="text-[11px] text-[#4e5668] tracking-widest uppercase mt-0.5">Case Management Platform</div>
          </div>
        </div>
        <div className="mt-auto pt-10">
          <h2 className="text-3xl font-bold leading-tight mb-4" style={{ fontFamily: 'var(--font-syne)' }}>
            Built for <span className="text-[#c9a84c]">results</span>,<br />not paperwork.
          </h2>
          <p className="text-sm text-[#8d95a8] leading-relaxed mb-8">
            Manage every case from first contact to settlement. Real-time updates for clients, lawyers, and your internal team.
          </p>
          <div className="flex gap-6">
            {[['100%', 'Secure'], ['Real-time', 'Notifications'], ['Multi-role', 'Access']].map(([val, label]) => (
              <div key={label}>
                <div className="text-xl font-bold text-[#c9a84c]" style={{ fontFamily: 'var(--font-syne)' }}>{val}</div>
                <div className="text-[11px] text-[#4e5668] uppercase tracking-widest mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Login form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#c9a84c] to-[#e8c76a] flex items-center justify-center text-[#0a0c10] font-bold text-sm">P</div>
            <span className="font-semibold text-sm" style={{ fontFamily: 'var(--font-syne)' }}>Pinnacle Case Management</span>
          </div>

          <h1 className="text-2xl font-bold mb-1.5" style={{ fontFamily: 'var(--font-syne)' }}>Welcome back</h1>
          <p className="text-sm text-[#8d95a8] mb-8">Sign in to your account to continue</p>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-sm text-red-400 mb-5">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-[11px] font-medium uppercase tracking-widest text-[#8d95a8] mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full px-3.5 py-2.5 rounded-lg border border-white/[0.13] bg-white/[0.04] text-sm text-[#f0f2f7] placeholder-[#4e5668] outline-none focus:border-[#c9a84c] transition-colors"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium uppercase tracking-widest text-[#8d95a8] mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-3.5 py-2.5 rounded-lg border border-white/[0.13] bg-white/[0.04] text-sm text-[#f0f2f7] placeholder-[#4e5668] outline-none focus:border-[#c9a84c] transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-gradient-to-r from-[#c9a84c] to-[#e8c76a] text-[#0a0c10] font-semibold text-sm tracking-wide disabled:opacity-60 transition-opacity hover:opacity-90"
              style={{ fontFamily: 'var(--font-syne)' }}
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <p className="mt-6 text-xs text-[#4e5668] text-center">
            Access is by invitation only. Contact your administrator.
          </p>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return <Suspense><LoginForm /></Suspense>
}
