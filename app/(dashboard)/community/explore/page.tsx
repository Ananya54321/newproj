'use client'

import { useState, useEffect } from 'react'
import { Plus, Loader2, Search } from 'lucide-react'
import { getCommunities, getUserCommunities, joinCommunity, leaveCommunity } from '@/lib/community/service'
import { CommunityCard } from '@/components/community/community-card'
import { CreateCommunityDialog } from '@/components/community/create-community-dialog'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import type { Community } from '@/lib/auth/types'
import { toast } from 'sonner'

export default function ExplorePage() {
  const { user } = useAuth()
  const [communities, setCommunities] = useState<Community[]>([])
  const [memberIds, setMemberIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [joining, setJoining] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      const [all, uc] = await Promise.all([
        getCommunities(),
        user?.id ? getUserCommunities(user.id) : Promise.resolve([]),
      ])
      setCommunities(all)
      setMemberIds(new Set(uc.map((c) => c.id)))
      setLoading(false)
    }
    load()
  }, [user?.id])

  const handleJoin = async (communityId: string) => {
    if (!user?.id) { toast.error('Sign in to join'); return }
    setJoining(communityId)
    const { error } = await joinCommunity(communityId, user.id)
    if (error) toast.error(error)
    else setMemberIds((s) => new Set([...s, communityId]))
    setJoining(null)
  }

  const handleLeave = async (communityId: string) => {
    if (!user?.id) return
    setJoining(communityId)
    const { error } = await leaveCommunity(communityId, user.id)
    if (error) toast.error(error)
    else setMemberIds((s) => { const n = new Set(s); n.delete(communityId); return n })
    setJoining(null)
  }

  const filtered = communities.filter((c) =>
    !search || c.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="max-w-3xl mx-auto pt-16 pb-8 sm:py-8 px-4 sm:px-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-foreground">Explore Communities</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Discover and join pet communities</p>
        </div>
        <CreateCommunityDialog>
          <Button size="sm" className="gap-1.5">
            <Plus className="w-4 h-4" /> New
          </Button>
        </CreateCommunityDialog>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search communities…"
          className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-card border border-border/60 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground gap-2">
          <Loader2 className="w-5 h-5 animate-spin" /> Loading…
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center bg-card rounded-2xl boty-shadow">
          <Search className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
          <p className="font-semibold text-foreground">No communities found</p>
          <p className="text-sm text-muted-foreground mt-1 mb-4">Try a different search or create one!</p>
          <CreateCommunityDialog>
            <Button size="sm">Create Community</Button>
          </CreateCommunityDialog>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((c) => (
            <CommunityCard
              key={c.id}
              community={c}
              isMember={memberIds.has(c.id)}
              onJoin={() => handleJoin(c.id)}
              onLeave={() => handleLeave(c.id)}
              joining={joining === c.id}
            />
          ))}
        </div>
      )}
    </div>
  )
}
