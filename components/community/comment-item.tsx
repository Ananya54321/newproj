'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, Reply, Trash2 } from 'lucide-react'
import { VoteButtons } from './vote-buttons'
import { voteComment, deleteComment, createComment, formatPostDate } from '@/lib/community/service'
import type { CommentWithMeta } from '@/lib/auth/types'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface CommentItemProps {
  comment: CommentWithMeta
  postId: string
  userId?: string
  depth?: number
  onCommentAdded?: (comment: CommentWithMeta) => void
}

export function CommentItem({ comment, postId, userId, depth = 0, onCommentAdded }: CommentItemProps) {
  const [score, setScore] = useState(comment.vote_score)
  const [userVote, setUserVote] = useState<1 | -1 | null>(comment.user_vote)
  const [voting, setVoting] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [replying, setReplying] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [localReplies, setLocalReplies] = useState<CommentWithMeta[]>(comment.replies)

  const handleVote = async (vote: 1 | -1) => {
    if (!userId) { toast.error('Sign in to vote'); return }
    setVoting(true)
    const { newVote, error } = await voteComment(comment.id, userId, vote)
    if (error) toast.error(error)
    else {
      const diff = (newVote ?? 0) - (userVote ?? 0)
      setScore((s) => s + diff)
      setUserVote(newVote)
    }
    setVoting(false)
  }

  const handleReply = async () => {
    if (!replyText.trim()) return
    setSubmitting(true)
    const { comment: newComment, error } = await createComment(postId, userId!, replyText, comment.id)
    if (error) toast.error(error)
    else if (newComment) {
      const meta: CommentWithMeta = {
        ...newComment,
        author: { id: userId!, full_name: 'You', avatar_url: null },
        user_vote: null,
        replies: [],
      }
      setLocalReplies((r) => [...r, meta])
      onCommentAdded?.(meta)
      setReplyText('')
      setReplying(false)
    }
    setSubmitting(false)
  }

  const handleDelete = async () => {
    const { error } = await deleteComment(comment.id)
    if (error) toast.error(error)
    else toast.success('Comment deleted')
  }

  if (comment.is_deleted && localReplies.length === 0) return null

  return (
    <div className={cn('', depth > 0 && 'border-l-2 border-border/40 pl-3 ml-1')}>
      <div className="py-2">
        {/* Author + collapse */}
        <div className="flex items-center gap-2 mb-1">
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            className="text-muted-foreground hover:text-foreground boty-transition"
            aria-label={collapsed ? 'Expand' : 'Collapse'}
          >
            {collapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </button>
          <span className="text-xs font-medium text-foreground">
            {comment.author?.full_name ?? 'Anonymous'}
          </span>
          <span className="text-xs text-muted-foreground">{formatPostDate(comment.created_at)}</span>
        </div>

        {!collapsed && (
          <>
            {comment.is_deleted ? (
              <p className="text-sm text-muted-foreground italic">[deleted]</p>
            ) : (
              <p className="text-sm text-foreground whitespace-pre-wrap">{comment.content}</p>
            )}

            {!comment.is_deleted && (
              <div className="flex items-center gap-3 mt-1.5">
                <VoteButtons score={score} userVote={userVote} onVote={handleVote} disabled={voting} size="sm" />
                {userId && depth < 4 && (
                  <button
                    type="button"
                    onClick={() => setReplying((r) => !r)}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground boty-transition"
                  >
                    <Reply className="w-3 h-3" /> Reply
                  </button>
                )}
                {userId === comment.author_id && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive boty-transition"
                  >
                    <Trash2 className="w-3 h-3" /> Delete
                  </button>
                )}
              </div>
            )}

            {replying && (
              <div className="mt-2 space-y-2">
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  rows={3}
                  placeholder="Write a reply…"
                  className="w-full px-3 py-2 rounded-lg bg-background border border-border/60 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleReply}
                    disabled={submitting || !replyText.trim()}
                    className="text-xs px-3 py-1.5 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 boty-transition disabled:opacity-50"
                  >
                    {submitting ? 'Posting…' : 'Reply'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setReplying(false)}
                    className="text-xs px-3 py-1.5 bg-muted text-muted-foreground rounded-lg boty-transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Nested replies */}
      {!collapsed && localReplies.length > 0 && (
        <div className="space-y-0">
          {localReplies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              postId={postId}
              userId={userId}
              depth={depth + 1}
              onCommentAdded={onCommentAdded}
            />
          ))}
        </div>
      )}
    </div>
  )
}
