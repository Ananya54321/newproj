'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, notFound, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  Plus, Users, FileText, Loader2, PawPrint, Clock, TrendingUp,
  Flame, Calendar, ArrowLeft, MapPin, ExternalLink, Trash2,
} from 'lucide-react'
import {
  getCommunityBySlug,
  getPosts,
  getMembership,
  joinCommunity,
  leaveCommunity,
  getCommunityEvents,
  deleteCommunityEvent,
  type PostSort,
} from '@/lib/community/service'
import { PostCard } from '@/components/community/post-card'
import { CreatePostDialog } from '@/components/community/create-post-dialog'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import type { Community, PostWithMeta, CommunityEventWithCreator } from '@/lib/auth/types'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

function formatStat(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k`
  return n.toString()
}

const SORT_OPTS: { value: PostSort; label: string; icon: React.ElementType }[] = [
  { value: 'hot', label: 'Hot', icon: Flame },
  { value: 'new', label: 'New', icon: Clock },
  { value: 'top', label: 'Top', icon: TrendingUp },
]

type ViewMode = PostSort | 'events'

export default function CommunityPage() {
  const { slug } = useParams<{ slug: string }>()
  const { user } = useAuth()
  const router = useRouter()

  const [community, setCommunity] = useState<Community | null>(null)
  const [posts, setPosts] = useState<PostWithMeta[]>([])
  const [events, setEvents] = useState<CommunityEventWithCreator[]>([])
  const [isMember, setIsMember] = useState(false)
  const [memberRole, setMemberRole] = useState<'member' | 'moderator' | null>(null)
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<ViewMode>('new')
  const [joining, setJoining] = useState(false)
  const [notFound404, setNotFound404] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const c = await getCommunityBySlug(slug)
      if (!c) { setNotFound404(true); return }
      setCommunity(c)

      const [communityPosts, membership, communityEvents] = await Promise.all([
        getPosts({ communityId: c.id, sort: view === 'events' ? 'new' : view as PostSort, userId: user?.id }),
        user?.id ? getMembership(c.id, user.id) : Promise.resolve({ is_member: false, role: null }),
        getCommunityEvents(c.id),
      ])
      setPosts(communityPosts)
      setIsMember(membership.is_member)
      setMemberRole(membership.role)
      setEvents(communityEvents)
    } catch (err) {
      console.error('Failed to load community:', err)
      toast.error('Failed to load community. Please refresh.')
    } finally {
      setLoading(false)
    }
  }, [slug, view, user?.id])

  useEffect(() => { load() }, [load])

  if (notFound404) notFound()

  const handleJoin = async () => {
    if (!user?.id) { toast.error('Sign in to join'); return }
    setJoining(true)
    const { error } = await joinCommunity(community!.id, user.id)
    if (error) toast.error(error)
    else { setIsMember(true); setCommunity((c) => c ? { ...c, member_count: c.member_count + 1 } : c) }
    setJoining(false)
  }

  const handleLeave = async () => {
    if (!user?.id) return
    setJoining(true)
    const { error } = await leaveCommunity(community!.id, user.id)
    if (error) toast.error(error)
    else { setIsMember(false); setCommunity((c) => c ? { ...c, member_count: Math.max(0, c.member_count - 1) } : c) }
    setJoining(false)
  }

  const handlePostDeleted = (id: string) => setPosts((p) => p.filter((x) => x.id !== id))

  const handleDeleteEvent = async (eventId: string) => {
    const { error } = await deleteCommunityEvent(eventId)
    if (error) toast.error(error)
    else {
      setEvents((prev) => prev.filter((e) => e.id !== eventId))
      toast.success('Event removed')
    }
  }

  if (loading && !community) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground gap-2">
        <Loader2 className="w-5 h-5 animate-spin" /> Loading…
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Back link */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-4">
        <Link
          href="/community"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          All Communities
        </Link>
      </div>

      {/* Banner */}
      <div
        className="h-44 bg-primary/10 mt-3"
        style={
          community?.banner_url
            ? { backgroundImage: `url(${community.banner_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }
            : {}
        }
      />

      {/* Community header bar */}
      <div className="bg-card border-b border-border/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex items-end gap-4 -mt-10 pb-5">
            {/* Community icon */}
            <div className="w-20 h-20 rounded-2xl bg-background border-4 border-background flex items-center justify-center overflow-hidden shadow-lg shrink-0">
              {community?.icon_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={community.icon_url} alt={community.name} className="w-full h-full object-cover" />
              ) : (
                <PawPrint className="w-9 h-9 text-primary/40" />
              )}
            </div>

            {/* Name + inline stats */}
            <div className="flex-1 min-w-0 pt-10">
              <h1 className="font-serif text-2xl font-bold text-foreground leading-tight">{community?.name}</h1>
              <div className="flex items-center gap-5 mt-1">
                <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Users className="w-3.5 h-3.5" />
                  <span className="font-semibold text-foreground">{formatStat(community?.member_count ?? 0)}</span>
                  Members
                </span>
                <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <FileText className="w-3.5 h-3.5" />
                  <span className="font-semibold text-foreground">{formatStat(community?.post_count ?? 0)}</span>
                  Posts
                </span>
                <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Calendar className="w-3.5 h-3.5" />
                  <span className="font-semibold text-foreground">{events.length}</span>
                  Events
                </span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 pb-0.5">
              {user && community && (
                <CreatePostDialog communityId={community.id} communitySlug={slug} onCreated={load}>
                  <Button size="sm" variant="outline" className="gap-1.5">
                    <Plus className="w-4 h-4" /> Post
                  </Button>
                </CreatePostDialog>
              )}
              {user && (
                <Button
                  size="sm"
                  variant={isMember ? 'outline' : 'default'}
                  onClick={isMember ? handleLeave : handleJoin}
                  disabled={joining}
                >
                  {joining ? <Loader2 className="w-4 h-4 animate-spin" /> : isMember ? 'Leave' : 'Join'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex items-start gap-6">
          {/* Main feed */}
          <div className="flex-1 min-w-0 space-y-3">
            {/* Tab bar */}
            <div className="flex items-center gap-1 bg-card rounded-xl p-1 boty-shadow w-fit">
              {SORT_OPTS.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setView(value)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium boty-transition',
                    view === value ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />{label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setView('events')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium boty-transition',
                  view === 'events' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Calendar className="w-3.5 h-3.5" />Events
                {events.length > 0 && (
                  <span className={cn(
                    'text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full',
                    view === 'events' ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-primary/10 text-primary'
                  )}>
                    {events.length}
                  </span>
                )}
              </button>
            </div>

            {loading ? (
              <div className="flex justify-center py-10 text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
            ) : view === 'events' ? (
              /* Events tab */
              <div className="space-y-3">
                {/* Create event button */}
                {user && isMember && community && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5"
                    onClick={() => router.push(`/community/${slug}/events/new`)}
                  >
                    <Plus className="w-4 h-4" /> Create Event
                  </Button>
                )}

                {events.length === 0 ? (
                  <div className="py-16 text-center bg-card rounded-2xl boty-shadow">
                    <Calendar className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
                    <p className="font-semibold text-foreground">No events yet</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {isMember ? 'Be the first to organise a meetup!' : 'Join the community to create events.'}
                    </p>
                  </div>
                ) : (
                  events.map((event) => (
                    <CommunityEventCard
                      key={event.id}
                      event={event}
                      canDelete={user?.id === event.creator_id || memberRole === 'moderator'}
                      onDelete={() => handleDeleteEvent(event.id)}
                    />
                  ))
                )}
              </div>
            ) : posts.length === 0 ? (
              <div className="py-16 text-center bg-card rounded-2xl boty-shadow">
                <FileText className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
                <p className="font-semibold text-foreground">No posts yet</p>
                {user && community && (
                  <CreatePostDialog communityId={community.id} communitySlug={slug} onCreated={load}>
                    <Button size="sm" className="mt-4">Create First Post</Button>
                  </CreatePostDialog>
                )}
              </div>
            ) : (
              posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  userId={user?.id}
                  showCommunity={false}
                  onDeleted={handlePostDeleted}
                />
              ))
            )}
          </div>

          {/* Right sidebar */}
          <aside className="hidden lg:flex flex-col w-64 shrink-0 gap-4">
            {/* About Community */}
            <div className="bg-card rounded-2xl p-5 boty-shadow">
              <h3 className="font-semibold text-foreground mb-2">About Community</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                {community?.description ?? 'No description provided.'}
              </p>

              {/* Prominent stats */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-background rounded-xl p-3 text-center">
                  <p className="font-bold text-xl text-foreground">{formatStat(community?.member_count ?? 0)}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Members</p>
                </div>
                <div className="bg-background rounded-xl p-3 text-center">
                  <p className="font-bold text-xl text-foreground">{formatStat(community?.post_count ?? 0)}+</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Posts</p>
                </div>
              </div>

              {user && (
                <Button
                  size="sm"
                  className="w-full"
                  variant={isMember ? 'outline' : 'default'}
                  onClick={isMember ? handleLeave : handleJoin}
                  disabled={joining}
                >
                  {joining ? <Loader2 className="w-4 h-4 animate-spin" /> : isMember ? 'Leave Community' : 'Join Community'}
                </Button>
              )}
            </div>

            {/* Upcoming events sidebar card */}
            <div className="bg-card rounded-2xl p-5 boty-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Calendar className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground text-sm">Upcoming Events</h3>
                </div>
                {events.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setView('events')}
                    className="text-xs text-primary hover:underline"
                  >
                    View all
                  </button>
                )}
              </div>
              {events.length === 0 ? (
                <p className="text-xs text-muted-foreground leading-relaxed">
                  No upcoming events. {isMember && 'Organise a meetup for community members!'}
                </p>
              ) : (
                <div className="space-y-2.5">
                  {events.slice(0, 2).map((event) => (
                    <div key={event.id} className="text-sm">
                      <p className="font-medium text-foreground leading-tight">{event.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {new Date(event.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  ))}
                </div>
              )}
              {user && isMember && community && (
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full mt-3 gap-1.5"
                  onClick={() => router.push(`/community/${slug}/events/new`)}
                >
                  <Plus className="w-3.5 h-3.5" /> Create Event
                </Button>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}

// ─── Community Event Card ────────────────────────────────────────────────────

function CommunityEventCard({
  event,
  canDelete,
  onDelete,
}: {
  event: CommunityEventWithCreator
  canDelete: boolean
  onDelete: () => void
}) {
  const TYPE_COLORS: Record<string, string> = {
    meetup:   'bg-blue-100 text-blue-800',
    social:   'bg-purple-100 text-purple-800',
    training: 'bg-amber-100 text-amber-800',
    other:    'bg-secondary text-secondary-foreground',
  }

  return (
    <div className="bg-card rounded-2xl overflow-hidden boty-shadow">
      {event.image_url && (
        <div className="relative h-36 w-full">
          <Image src={event.image_url} alt={event.title} fill className="object-cover" />
          <span className={`absolute top-3 left-3 text-xs px-2.5 py-1 rounded-full font-medium capitalize ${TYPE_COLORS[event.type] ?? TYPE_COLORS.other}`}>
            {event.type}
          </span>
        </div>
      )}
      <div className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            {!event.image_url && (
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${TYPE_COLORS[event.type] ?? TYPE_COLORS.other}`}>
                {event.type}
              </span>
            )}
            <h3 className="font-serif text-base font-semibold text-foreground mt-1 leading-tight">{event.title}</h3>
          </div>
          {canDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
              aria-label="Delete event"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>

        {event.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">{event.description}</p>
        )}

        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            {new Date(event.event_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </span>
          {event.location && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              {event.location}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-1.5">
            {event.creator?.avatar_url ? (
              <Image src={event.creator.avatar_url} alt="" width={18} height={18} className="rounded-full" />
            ) : (
              <div className="w-[18px] h-[18px] rounded-full bg-muted" />
            )}
            <span className="text-xs text-muted-foreground">{event.creator?.full_name ?? 'Member'}</span>
          </div>
          {event.registration_url && (
            <a
              href={event.registration_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs px-3 py-1.5 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center gap-1"
            >
              Register <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
