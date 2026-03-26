'use client'

import { useState, useEffect } from 'react'
import { useParams, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2, MessageSquare, ExternalLink, Pin, Users, FileText, PawPrint } from 'lucide-react'
import { getPostById, getComments, createComment, votePost, formatPostDate, getCommunityBySlug } from '@/lib/community/service'
import { VoteButtons } from '@/components/community/vote-buttons'
import { CommentItem } from '@/components/community/comment-item'
import { useAuth } from '@/hooks/use-auth'
import type { PostWithMeta, CommentWithMeta, Community } from '@/lib/auth/types'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

function formatStat(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k`
  return n.toString()
}

export default function PostDetailPage() {
  const { slug, postId } = useParams<{ slug: string; postId: string }>()
  const { user } = useAuth()

  const [post, setPost] = useState<PostWithMeta | null>(null)
  const [community, setCommunity] = useState<Community | null>(null)
  const [comments, setComments] = useState<CommentWithMeta[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound404, setNotFound404] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [voting, setVoting] = useState(false)

  useEffect(() => {
    const load = async () => {
      const [p, c, comm] = await Promise.all([
        getPostById(postId, user?.id),
        getComments(postId, user?.id),
        getCommunityBySlug(slug),
      ])
      if (!p) { setNotFound404(true) }
      else { setPost(p); setComments(c); setCommunity(comm) }
      setLoading(false)
    }
    load()
  }, [postId, user?.id, slug])

  if (notFound404 && !loading) notFound()

  const handleVote = async (vote: 1 | -1) => {
    if (!user?.id) { toast.error('Sign in to vote'); return }
    setVoting(true)
    const { newVote, error } = await votePost(postId, user.id, vote)
    if (error) toast.error(error)
    else {
      setPost((p) => p ? {
        ...p,
        vote_score: p.vote_score - (p.user_vote ?? 0) + (newVote ?? 0),
        user_vote: newVote,
      } : p)
    }
    setVoting(false)
  }

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!commentText.trim() || !user?.id) return
    setSubmitting(true)
    const { comment, error } = await createComment(postId, user.id, commentText)
    if (error) toast.error(error)
    else if (comment) {
      const meta: CommentWithMeta = {
        ...comment,
        author: { id: user.id, full_name: 'You', avatar_url: null },
        user_vote: null,
        replies: [],
      }
      setComments((c) => [...c, meta])
      setPost((p) => p ? { ...p, comment_count: p.comment_count + 1 } : p)
      setCommentText('')
    }
    setSubmitting(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen">
        <div className="bg-card border-b border-border/50">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5 animate-pulse">
            <div className="h-4 bg-muted rounded w-32" />
          </div>
        </div>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex items-start gap-6">
            <div className="flex-1 space-y-4">
              <div className="bg-card rounded-2xl p-6 boty-shadow animate-pulse space-y-3">
                <div className="h-3 bg-muted rounded w-1/4" />
                <div className="h-6 bg-muted rounded w-3/4" />
                <div className="h-4 bg-muted rounded w-full" />
                <div className="h-4 bg-muted rounded w-5/6" />
                <div className="h-4 bg-muted rounded w-4/5" />
              </div>
              <div className="bg-card rounded-2xl p-4 boty-shadow animate-pulse space-y-2">
                <div className="h-3 bg-muted rounded w-1/5" />
                <div className="h-20 bg-muted rounded" />
              </div>
            </div>
            <div className="hidden lg:block w-64 shrink-0 space-y-4">
              <div className="bg-card rounded-2xl p-5 boty-shadow animate-pulse space-y-3">
                <div className="h-4 bg-muted rounded w-1/2" />
                <div className="h-3 bg-muted rounded w-full" />
                <div className="h-3 bg-muted rounded w-4/5" />
                <div className="h-16 bg-muted rounded" />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!post) return null

  const communityData = community ?? post.community

  return (
    <div className="min-h-screen">
      {/* Hero bar */}
      <div className="bg-card border-b border-border/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5">
          <Link
            href={`/community/${slug}`}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground boty-transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to {post.community?.name ?? 'community'}
          </Link>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex items-start gap-6">
          {/* Left: post + comments */}
          <div className="flex-1 min-w-0 space-y-4">
            {/* Post card */}
            <div className="bg-card rounded-2xl p-6 boty-shadow">
              {/* Meta */}
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3 flex-wrap">
                {post.is_pinned && (
                  <span className="inline-flex items-center gap-0.5 text-primary font-medium mr-1">
                    <Pin className="w-3 h-3" /> Pinned ·
                  </span>
                )}
                <span>
                  Posted by{' '}
                  <span className="font-medium text-foreground/70">{post.author?.full_name ?? 'Anonymous'}</span>
                </span>
                <span>·</span>
                <span>{formatPostDate(post.created_at)}</span>
              </div>

              {/* Title */}
              <h1 className="font-serif text-xl sm:text-2xl font-semibold text-foreground mb-4 leading-snug">
                {post.title}
              </h1>

              {/* Content - type-agnostic */}
              {post.content && (
                <p className="text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed mb-4">
                  {post.content}
                </p>
              )}

              {post.image_urls?.length > 0 && (
                <div className="space-y-2 mb-4">
                  {post.image_urls.map((url, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={i} src={url} alt={`Image ${i + 1}`} className="rounded-xl max-h-96 object-cover w-full" />
                  ))}
                </div>
              )}

              {post.link_url && (
                <a
                  href={post.link_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline mb-4 px-3 py-1.5 rounded-lg bg-primary/5 boty-transition"
                >
                  <ExternalLink className="w-4 h-4 shrink-0" />
                  <span className="truncate max-w-sm">{post.link_url}</span>
                </a>
              )}

              {/* Votes + comment count */}
              <div className="flex items-center gap-4 pt-4 border-t border-border/60">
                <VoteButtons
                  score={post.vote_score}
                  userVote={post.user_vote}
                  onVote={handleVote}
                  disabled={voting}
                />
                <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <MessageSquare className="w-4 h-4" />
                  {post.comment_count} {post.comment_count === 1 ? 'comment' : 'comments'}
                </span>
              </div>
            </div>

            {/* Comment form */}
            {user ? (
              <form onSubmit={handleComment} className="bg-card rounded-2xl p-4 boty-shadow space-y-3">
                <p className="text-sm font-medium text-foreground">Add a comment</p>
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  rows={3}
                  placeholder="What are your thoughts?"
                  className="w-full px-4 py-2.5 rounded-xl bg-background border border-border/60 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <Button type="submit" size="sm" disabled={submitting || !commentText.trim()}>
                  {submitting ? <><Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />Posting…</> : 'Comment'}
                </Button>
              </form>
            ) : (
              <div className="bg-card rounded-2xl p-4 boty-shadow text-center">
                <p className="text-sm text-muted-foreground">
                  <Link href="/login" className="text-primary hover:underline">Sign in</Link> to join the conversation
                </p>
              </div>
            )}

            {/* Comments */}
            <div className="space-y-1">
              <h2 className="font-semibold text-foreground mb-3">
                {comments.length} {comments.length === 1 ? 'comment' : 'comments'}
              </h2>
              {comments.length === 0 ? (
                <div className="py-10 text-center bg-card rounded-2xl boty-shadow">
                  <MessageSquare className="w-8 h-8 mx-auto mb-2 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">No comments yet. Be the first!</p>
                </div>
              ) : (
                comments.map((c) => (
                  <CommentItem
                    key={c.id}
                    comment={c}
                    postId={postId}
                    userId={user?.id}
                  />
                ))
              )}
            </div>
          </div>

          {/* Right sidebar */}
          <aside className="hidden lg:flex flex-col w-64 shrink-0 gap-4">
            {communityData && (
              <div className="bg-card rounded-2xl p-5 boty-shadow">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center overflow-hidden shrink-0">
                    {communityData.icon_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={communityData.icon_url} alt={communityData.name} className="w-full h-full object-cover" />
                    ) : (
                      <PawPrint className="w-5 h-5 text-primary/40" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground text-sm truncate">{communityData.name}</p>
                    <p className="text-xs text-muted-foreground">Community</p>
                  </div>
                </div>

                {communityData.description && (
                  <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                    {communityData.description}
                  </p>
                )}

                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="bg-background rounded-xl p-2.5 text-center">
                    <p className="font-bold text-base text-foreground">{formatStat(communityData.member_count ?? 0)}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 flex items-center justify-center gap-1">
                      <Users className="w-3 h-3" /> Members
                    </p>
                  </div>
                  <div className="bg-background rounded-xl p-2.5 text-center">
                    <p className="font-bold text-base text-foreground">{formatStat(communityData.post_count ?? 0)}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 flex items-center justify-center gap-1">
                      <FileText className="w-3 h-3" /> Posts
                    </p>
                  </div>
                </div>

                <Button asChild size="sm" variant="outline" className="w-full">
                  <Link href={`/community/${slug}`}>View Community</Link>
                </Button>
              </div>
            )}

            {post.author && (
              <div className="bg-card rounded-2xl p-5 boty-shadow">
                <h3 className="text-sm font-semibold text-foreground mb-3">Posted by</h3>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
                    {post.author.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={post.author.avatar_url} alt={post.author.full_name ?? ''} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-sm font-bold text-primary">
                        {(post.author.full_name ?? 'A').charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{post.author.full_name ?? 'Anonymous'}</p>
                    <p className="text-xs text-muted-foreground">{formatPostDate(post.created_at)}</p>
                  </div>
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  )
}
