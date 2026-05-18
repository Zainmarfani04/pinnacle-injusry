import { redirect } from 'next/navigation'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import Sidebar from '@/components/Sidebar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Use admin client to bypass RLS for the profile lookup
  const adminClient = await createAdminClient()
  const { data: profile, error: profileError } = await adminClient
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    await supabase.auth.signOut()
    redirect('/login?error=no_profile')
  }

  if (profile.role === 'client') redirect('/portal')

  return (
    <div className="flex h-screen overflow-hidden bg-[#0a0c10]">
      <Sidebar profile={profile} />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
