'use client'

import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { cn, getInitials, ROLE_COLORS, ROLE_LABELS } from '@/lib/utils'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { LayoutDashboard, FolderOpen, GitBranch, Users, Scale, Bell, BarChart3, UserCog, LogOut } from 'lucide-react'
import type { Profile } from '@/types/database'

const NAV = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Overview', roles: ['admin', 'specialist', 'lawyer'] },
  { href: '/dashboard/cases', icon: FolderOpen, label: 'Cases', roles: ['admin', 'specialist', 'lawyer'] },
  { href: '/dashboard/pipeline', icon: GitBranch, label: 'Pipeline', roles: ['admin', 'specialist'] },
  { href: '/dashboard/clients', icon: Users, label: 'Clients', roles: ['admin', 'specialist'] },
  { href: '/dashboard/lawyers', icon: Scale, label: 'Lawyers', roles: ['admin', 'specialist'] },
  { href: '/dashboard/notifications', icon: Bell, label: 'Notifications', roles: ['admin', 'specialist'] },
  { href: '/dashboard/users', icon: UserCog, label: 'Users', roles: ['admin'] },
  { href: '/dashboard/analytics', icon: BarChart3, label: 'Analytics', roles: ['admin'] },
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
      <div className="px-4 py-4 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#c9a84c] to-[#e8c76a] flex items-center justify-center text-[#0a0c10] font-bold text-xs shrink-0 font-[var(--font-syne)]">P</div>
        <div>
          <div className="text-xs font-semibold font-[var(--font-syne)]">Pinnacle CMS</div>
          <div className="text-[10px] text-[#4e5668] capitalize mt-0.5">{ROLE_LABELS[profile.role]} Portal</div>
        </div>
      </div>

      <Separator className="bg-white/[0.07]" />

      {/* Nav */}
      <nav className="flex-1 p-2.5 space-y-0.5 mt-1">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-[#4e5668] px-2 py-2">Navigation</p>
        {visibleNav.map(item => {
          const Icon = item.icon
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
              <Icon size={14} className={active ? 'text-[#c9a84c]' : 'text-[#4e5668]'} />
              {item.label}
            </button>
          )
        })}
      </nav>

      <Separator className="bg-white/[0.07]" />

      {/* User */}
      <div className="p-3">
        <div className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-white/[0.04] transition-colors">
          <Avatar className="w-7 h-7 shrink-0">
            <AvatarFallback className="bg-gradient-to-br from-[#c9a84c] to-[#e8c76a] text-[#0a0c10] text-[10px] font-bold">
              {getInitials(profile.full_name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium truncate">{profile.full_name}</div>
            <Badge variant="outline" className={cn('text-[9px] px-1.5 py-0 h-4 mt-0.5 border-0', ROLE_COLORS[profile.role])}>
              {ROLE_LABELS[profile.role]}
            </Badge>
          </div>
          <button onClick={handleLogout} title="Sign out"
            className="text-[#4e5668] hover:text-red-400 transition-colors p-1 rounded">
            <LogOut size={13} />
          </button>
        </div>
      </div>
    </aside>
  )
}
