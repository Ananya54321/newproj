import { redirect } from 'next/navigation'
import { getServerUser, createServerSupabaseClient } from '@/lib/supabase/server'
import { ChatWrapper } from '@/components/chat-wrapper'
import type { Profile } from '@/lib/auth/types'

export const metadata = { title: 'Chat | Furever' }

export default async function ChatPage() {
  // ── Auth check (layout already handles unauthenticated users, but be explicit) ──
  const user = await getServerUser()
  if (!user) redirect('/login')

  // ── Role check — only pet owners (role === 'user') may access this page ───
  const supabase = await createServerSupabaseClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single() as { data: Profile | null; error: unknown }

  if (!profile || profile.role !== 'user') {
    redirect('/dashboard')
  }

  return (
    <div className="h-full overflow-hidden">
      <ChatWrapper profile={profile} />
    </div>
  )
}
