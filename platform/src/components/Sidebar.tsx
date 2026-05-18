'use client'

import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { cn, getInitials, ROLE_COLORS, ROLE_LABELS } from '@/lib/utils'
import type { Profile } from '@/types/database'

const NAV = [
  { href: '/dashboard', icon: '⊞', label: 'Overview', roles: ['admin', 'specialist', 'lawyer'] },
  { href: '/dashboard/cases', icon: '📁', label: 'Cases', roles: ['admin', 'specialist', 'lawyer'] },
  { href: '/dashboard/pipeline', icon: '⟶', label: 'Pipeline', roles: ['admin', 'specialist'] },
  { href: '/dashboard/clients', icon: '👤', label: 'Clients', roles: ['admin', 'specialist'] },
  { href: '/dashboard/lawyers', icon: '⚖', label: 'Lawyers', roles: ['admin', 'specialist'] },
  { href: '/dashboard/notifications', icon: '🔔', label: 'Notifications', roles: ['admin', 'specialist'] },
  { href: '/dashboard/users', icon: '👥', label: 'Users', roles: ['admin'] },
  { href: '/dashboard/analytics', icon: '📊', label: 'Analytics', roles: ['admin'] },
]

export default function Sidebar({ profile }: { profile: Profile }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const visibleNav = NAV.filter(n => n.roles.includes(profile.role))

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="w-60 min-w-60 bg-[#161b25] border-r border-white/[0.07] flex flex-col h-full overflow-y-auto">
      {/* Logo */}
      <div className="px-4 py-4 border-b border-white/[0.07] flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#c9a84c] to-[#e8c76a] flex items-center justify-center text-[#0a0c10] font-bold text-xs shrink-0" style={{ fontFamily: 'var(--font-syne)' }}>P</div>
        <div>
          <div className="text-xs font-semibold" style={{ fontFamily: 'var(--font-syne)' }}>Pinnacle CMS</div>
          <div className="text-[10px] text-[#4e5668] capitalize mt-0.5">{ROLE_LABELS[profile.role]} Portal</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-2.5 space-y-0.5">
        <div className="text-[10px] font-semibold uppercase tracking-widest text-[#4e5668] px-2 py-2 mt-1">Navigation</div>
        {visibleNav.map(item => {
          const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
          return (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className={cn(
                'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium text-left transition-all',
                active
                  ? 'bg-[rgba(201,168,76,0.12)] text-[#e8c76a]'
                  : 'text-[#8d95a8] hover:bg-white/[0.05] hover:text-[#f0f2f7]'
              )}
            >
              <span className="text-sm w-4 text-center">{item.icon}</span>
              {item.label}
            </button>
          )
        })}
      </nav>

      {/* User */}
      <div className="p-3 border-t border-white/[0.07]">
        <div className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-white/[0.04] transition-colors">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#c9a84c] to-[#e8c76a] flex items-center justify-center text-[#0a0c10] text-[10px] font-bold shrink-0">
            {getInitials(profile.full_name)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium truncate">{profile.full_name}</div>
            <div className={cn('text-[10px] px-1.5 py-px rounded-full inline-block mt-0.5', ROLE_COLORS[profile.role])}>
              {ROLE_LABELS[profile.role]}
            </div>
          </div>
          <button onClick={handleLogout} className="text-[#4e5668] hover:text-red-400 transition-colors text-xs p-1" title="Sign out">
            ⏻
          </button>
        </div>
      </div>
    </aside>
  )
}
