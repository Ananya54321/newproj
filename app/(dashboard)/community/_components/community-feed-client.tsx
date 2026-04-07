'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { Plus, Loader2, TrendingUp, Clock, Flame, Users, Star, PawPrint } from 'lucide-react'
import { getPosts, type PostSort } from '@/lib/community/service'
import { PostCard } from '@/components/community/post-card'
import { CreatePostDialog } from '@/components/community/create-post-dialog'
import { CreateCommunityDialog } from '@/components/community/create-community-dialog'
import { Button } from '@/components/ui/button'
import type { PostWithMeta, Community, CommunityWithMembership } from '@/lib/auth/types'
import { cn } from '@/lib/utils'

const SORT_OPTS: { value: PostSort; label: string; icon: React.ElementType }[] = [
  { value: 'hot', label: 'Hot', icon: Flame },
  { value: 'new', label: 'New', icon: Clock },
  { value: 'top', label: 'Top', icon: TrendingUp },
]

interface Props {
  userId: string | null
  initialPosts: PostWithMeta[]
  communities: Community[]
  userCommunities: CommunityWithMembership[]
}

export function CommunityFeedClient({ userId, initialPosts, communities, userCommunities }: Props) {
  const [posts, setPosts] = useState<PostWithMeta[]>(initialPosts)
  const [sort, setSort] = useState<PostSort>('hot')
  const [loadingSort, setLoadingSort] = useState(false)

  const handleSortChange = useCallback(async (newSort: PostSort) => {
    if (newSort === sort) return
    setSort(newSort)
    setLoadingSort(true)
    try {
      const newPosts = await getPosts({ sort: newSort, userId: userId ?? undefined })
      setPosts(newPosts)
    } finally {
      setLoadingSort(false)
    }
  }, [sort, userId])

  const handlePostDeleted = (id: string) => setPosts((p) => p.filter((x) => x.id !== id))

  const followedIds = new Set(userCommunities.map((c) => c.id))
  const feedPosts = userId
    ? [...posts.filter((p) => followedIds.has(p.community_id)), ...posts.filter((p) => !followedIds.has(p.community_id))]
    : posts

  const trendingCommunities = [...communities].sort((a, b) => b.member_count - a.member_count).slice(0, 6)

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="bg-card border-b border-border/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-16 pb-8 sm:py-8">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <h1 className="font-serif text-3xl font-bold text-foreground mb-1.5">Community</h1>
              <p className="text-muted-foreground text-sm max-w-lg">
                Connect with fellow pet owners, share stories, ask questions, and discover communities built around the animals you love.
              </p>
            </div>
            {userId && (
              <div className="flex items-center gap-2 shrink-0">
                <CreateCommunityDialog>
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <Plus className="w-4 h-4" /> New Community
                  </Button>
                </CreateCommunityDialog>
                <CreatePostDialog communities={userCommunities.map((c) => ({ id: c.id, slug: c.slug, name: c.name }))}>
                  <Button size="sm" className="gap-1.5">
                    <Plus className="w-4 h-4" /> Create Post
                  </Button>
                </CreatePostDialog>
              </div>
            )}
          </div>

          {/* Your Communities Pills */}
          {userId && userCommunities.length > 0 && (
            <div className="mt-5">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2.5">Your Communities</p>
              <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible sm:pb-0 [scrollbar-width:none] [-webkit-overflow-scrolling:touch]">
                {userCommunities.slice(0, 8).map((c) => (
                  <Link
                    key={c.id}
                    href={`/community/${c.slug}`}
                    className="inline-flex shrink-0 items-center gap-1.5 px-3 py-1.5 rounded-full bg-background border border-border text-sm text-foreground hover:bg-primary/5 hover:border-primary/30 boty-transition"
                  >
                    {c.icon_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={c.icon_url} alt="" className="w-4 h-4 rounded-full object-cover" />
                    ) : (
                      <PawPrint className="w-3 h-3 text-primary" />
                    )}
                    <span className="truncate max-w-[120px]">{c.name}</span>
                  </Link>
                ))}
                {userCommunities.length > 8 && (
                  <Link href="/community/explore" className="text-xs text-primary hover:underline boty-transition">
                    +{userCommunities.length - 8} more
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex items-start gap-6">
          {/* Feed column */}
          <div className="flex-1 min-w-0 space-y-4">
            {/* Sort bar */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 bg-card rounded-xl p-1 boty-shadow">
                {SORT_OPTS.map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => handleSortChange(value)}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium boty-transition',
                      sort === value
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {label}
                  </button>
                ))}
              </div>
              <span className="text-xs text-muted-foreground">
                {loadingSort ? 'Loading…' : `${feedPosts.length} posts`}
              </span>
            </div>

            {/* Feed */}
            {loadingSort ? (
              <div className="flex items-center justify-center py-20 text-muted-foreground gap-2">
                <Loader2 className="w-5 h-5 animate-spin" /> Loading feed…
              </div>
            ) : feedPosts.length === 0 ? (
              <div className="py-20 text-center bg-card rounded-2xl boty-shadow">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <PawPrint className="w-7 h-7 text-primary/40" />
                </div>
                <p className="font-semibold text-foreground text-lg">No posts yet</p>
                <p className="text-sm text-muted-foreground mt-1 mb-5 max-w-xs mx-auto">
                  Join a community and be the first to share something!
                </p>
                <div className="flex items-center justify-center gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link href="/community/explore">Explore Communities</Link>
                  </Button>
                  {userId && (
                    <CreateCommunityDialog>
                      <Button size="sm">Create Community</Button>
                    </CreateCommunityDialog>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {feedPosts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    userId={userId ?? undefined}
                    showCommunity
                    onDeleted={handlePostDeleted}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="hidden lg:block w-72 shrink-0 space-y-4">
            {trendingCommunities.length > 0 && (
              <div className="bg-card rounded-2xl p-5 boty-shadow">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                    <TrendingUp className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground text-sm">Trending Communities</h3>
                </div>
                <div className="space-y-3">
                  {trendingCommunities.map((c, idx) => (
                    <Link key={c.id} href={`/community/${c.slug}`} className="flex items-center gap-3 group">
                      <span className="text-xs font-bold text-muted-foreground w-4 shrink-0 tabular-nums">{idx + 1}</span>
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-sm shrink-0 overflow-hidden">
                        {c.icon_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={c.icon_url} alt="" className="w-full h-full object-cover" />
                        ) : <PawPrint className="w-4 h-4 text-primary/40" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground group-hover:text-primary boty-transition truncate">{c.name}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Users className="w-3 h-3" />
                          {c.member_count.toLocaleString()} members
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
                <Link href="/community/explore" className="text-xs text-primary hover:underline mt-4 block boty-transition">
                  See all communities →
                </Link>
              </div>
            )}

            <div className="bg-card rounded-2xl p-5 boty-shadow">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Star className="w-3.5 h-3.5 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground text-sm">Start a Community</h3>
              </div>
              <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                Build a space for pet owners who share your passion. It only takes a minute!
              </p>
              <CreateCommunityDialog>
                <Button size="sm" className="w-full gap-1.5">
                  <Plus className="w-4 h-4" /> New Community
                </Button>
              </CreateCommunityDialog>
            </div>

            {communities.length > 0 && (
              <div className="bg-card rounded-2xl p-5 boty-shadow">
                <h3 className="font-semibold text-foreground text-sm mb-3">Community Stats</h3>
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Communities</span>
                    <span className="font-semibold text-foreground">{communities.length.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Total members</span>
                    <span className="font-semibold text-foreground">
                      {communities.reduce((acc, c) => acc + c.member_count, 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Total posts</span>
                    <span className="font-semibold text-foreground">
                      {communities.reduce((acc, c) => acc + c.post_count, 0).toLocaleString()}
                    </span>
                  </div>
                  {userId && userCommunities.length > 0 && (
                    <div className="flex items-center justify-between text-sm border-t border-border/50 pt-2.5">
                      <span className="text-muted-foreground">Joined</span>
                      <span className="font-semibold text-primary">{userCommunities.length}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  )
}
