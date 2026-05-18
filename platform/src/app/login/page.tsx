'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

function LoginForm() {
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(
    searchParams.get('error') === 'no_profile'
      ? 'Account found but no profile exists. Please contact your administrator.'
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
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#c9a84c] to-[#e8c76a] flex items-center justify-center text-[#0a0c10] font-bold text-lg font-[var(--font-syne)]">P</div>
          <div>
            <div className="font-bold text-sm tracking-wide font-[var(--font-syne)]">Pinnacle Injury Consultants</div>
            <div className="text-[11px] text-[#4e5668] tracking-widest uppercase mt-0.5">Case Management Platform</div>
          </div>
        </div>
        <div className="mt-auto pt-10">
          <h2 className="text-3xl font-bold leading-tight mb-4 font-[var(--font-syne)]">
            Built for <span className="text-[#c9a84c]">results</span>,<br />not paperwork.
          </h2>
          <p className="text-sm text-[#8d95a8] leading-relaxed mb-8">
            Manage every case from first contact to settlement. Real-time updates for clients, lawyers, and your internal team.
          </p>
          <div className="flex gap-6">
            {[['100%', 'Secure'], ['Real-time', 'Notifications'], ['Multi-role', 'Access']].map(([val, label]) => (
              <div key={label}>
                <div className="text-xl font-bold text-[#c9a84c] font-[var(--font-syne)]">{val}</div>
                <div className="text-[11px] text-[#4e5668] uppercase tracking-widest mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Login form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-[#0a0c10]">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#c9a84c] to-[#e8c76a] flex items-center justify-center text-[#0a0c10] font-bold text-sm">P</div>
            <span className="font-semibold text-sm font-[var(--font-syne)]">Pinnacle Case Management</span>
          </div>

          <Card className="bg-[#161b25] border-white/[0.07] shadow-2xl">
            <CardHeader className="pb-4">
              <CardTitle className="text-2xl font-[var(--font-syne)]">Welcome back</CardTitle>
              <CardDescription className="text-[#8d95a8]">Sign in to your account to continue</CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-sm text-red-400 mb-5">
                  {error}
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-[#8d95a8] uppercase tracking-widest text-[11px]">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="bg-white/[0.04] border-white/[0.13] text-[#f0f2f7] placeholder:text-[#4e5668] focus-visible:ring-[#c9a84c] focus-visible:border-[#c9a84c]"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-[#8d95a8] uppercase tracking-widest text-[11px]">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="bg-white/[0.04] border-white/[0.13] text-[#f0f2f7] placeholder:text-[#4e5668] focus-visible:ring-[#c9a84c] focus-visible:border-[#c9a84c]"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-[#c9a84c] to-[#e8c76a] text-[#0a0c10] font-semibold hover:opacity-90 transition-opacity border-0 font-[var(--font-syne)]"
                >
                  {loading ? 'Signing in…' : 'Sign In'}
                </Button>
              </form>

              <p className="mt-5 text-xs text-[#4e5668] text-center">
                Access is by invitation only. Contact your administrator.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return <Suspense><LoginForm /></Suspense>
}
