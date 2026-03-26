import { redirect } from 'next/navigation'
import { getServerUser, createServerSupabaseClient } from '@/lib/supabase/server'
import { ChatWrapper } from '@/components/chat-wrapper'

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
    .single()

  if (!profile || profile.role !== 'user') {
    redirect('/dashboard')
  }

  return (
    <div className="flex h-full flex-col">
      {/* Page header */}
      <div className="bg-card border-b border-border/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          <h1 className="font-serif text-2xl font-semibold text-foreground">Chat</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Connect with other pet owners in your community
          </p>
        </div>
      </div>

      {/* Chat UI fills remaining height */}
      <div className="flex-1 overflow-hidden">
        <ChatWrapper profile={profile} />
      </div>
    </div>
  )
}
