'use client'

import { useState, useEffect } from 'react'
import { useParams, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2, MessageSquare, ExternalLink } from 'lucide-react'
import { getPostById, getComments, createComment, votePost, formatPostDate } from '@/lib/community/service'
import { VoteButtons } from '@/components/community/vote-buttons'
import { CommentItem } from '@/components/community/comment-item'
import { useAuth } from '@/hooks/use-auth'
import type { PostWithMeta, CommentWithMeta } from '@/lib/auth/types'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

export default function PostDetailPage() {
  const { slug, postId } = useParams<{ slug: string; postId: string }>()
  const { user } = useAuth()

  const [post, setPost] = useState<PostWithMeta | null>(null)
  const [comments, setComments] = useState<CommentWithMeta[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound404, setNotFound404] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [voting, setVoting] = useState(false)

  useEffect(() => {
    const load = async () => {
      const [p, c] = await Promise.all([
        getPostById(postId, user?.id),
        getComments(postId, user?.id),
      ])
      if (!p) { setNotFound404(true) }
      else { setPost(p); setComments(c) }
      setLoading(false)
    }
    load()
  }, [postId, user?.id])

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
      <div className="flex items-center justify-center py-20 text-muted-foreground gap-2">
        <Loader2 className="w-5 h-5 animate-spin" /> Loading…
      </div>
    )
  }

  if (!post) return null

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6 space-y-6">
      {/* Back */}
      <Link
        href={`/community/${slug}`}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground boty-transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to {post.community?.name ?? 'community'}
      </Link>

      {/* Post */}
      <div className="bg-card rounded-2xl p-6 boty-shadow">
        {/* Meta */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
          <Link href={`/community/${slug}`} className="font-medium text-foreground hover:text-primary boty-transition">
            {post.community?.name}
          </Link>
          <span>·</span>
          <span>Posted by {post.author?.full_name ?? 'Anonymous'}</span>
          <span>·</span>
          <span>{formatPostDate(post.created_at)}</span>
        </div>

        {/* Title */}
        <h1 className="font-serif text-xl font-semibold text-foreground mb-3 leading-snug">
          {post.is_pinned && <span className="text-primary text-sm mr-2">📌</span>}
          {post.title}
        </h1>

        {/* Content */}
        {post.type === 'text' && post.content && (
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{post.content}</p>
        )}

        {post.type === 'link' && post.link_url && (
          <a
            href={post.link_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
          >
            <ExternalLink className="w-4 h-4" />
            {post.link_url}
          </a>
        )}

        {post.type === 'image' && post.image_urls?.length > 0 && (
          <div className="space-y-2 mt-2">
            {post.image_urls.map((url, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={i} src={url} alt={`Image ${i + 1}`} className="rounded-xl max-h-96 object-cover w-full" />
            ))}
          </div>
        )}

        {/* Votes + stats */}
        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border/60">
          <VoteButtons
            score={post.vote_score}
            userVote={post.user_vote}
            onVote={handleVote}
            disabled={voting}
          />
          <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <MessageSquare className="w-4 h-4" />
            {post.comment_count} comments
          </span>
        </div>
      </div>

      {/* Comment form */}
      {user && (
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
      )}

      {/* Comments */}
      <div className="space-y-1">
        <h2 className="font-semibold text-foreground mb-3">
          {comments.length} {comments.length === 1 ? 'comment' : 'comments'}
        </h2>
        {comments.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">No comments yet. Be the first!</p>
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
  )
}
