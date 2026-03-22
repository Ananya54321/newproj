'use client'

import { useState } from 'react'
import Link from 'next/link'
import { MessageSquare, Trash2, ExternalLink, Pin, PawPrint } from 'lucide-react'
import { VoteButtons } from './vote-buttons'
import { votePost, deletePost, formatPostDate } from '@/lib/community/service'
import type { PostWithMeta } from '@/lib/auth/types'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

interface PostCardProps {
  post: PostWithMeta
  userId?: string
  showCommunity?: boolean
  onDeleted?: (postId: string) => void
}

export function PostCard({ post, userId, showCommunity = true, onDeleted }: PostCardProps) {
  const [score, setScore] = useState(post.vote_score)
  const [userVote, setUserVote] = useState<1 | -1 | null>(post.user_vote)
  const [voting, setVoting] = useState(false)

  const handleVote = async (vote: 1 | -1) => {
    if (!userId) { toast.error('Sign in to vote'); return }
    setVoting(true)
    const { newVote, error } = await votePost(post.id, userId, vote)
    if (error) { toast.error(error) }
    else {
      const diff = (newVote ?? 0) - (userVote ?? 0)
      setScore((s) => s + diff)
      setUserVote(newVote)
    }
    setVoting(false)
  }

  const handleDelete = async () => {
    const { error } = await deletePost(post.id)
    if (error) toast.error(error)
    else { toast.success('Post deleted'); onDeleted?.(post.id) }
  }

  const postHref = `/community/${post.community?.slug ?? post.community_id}/post/${post.id}`

  return (
    <article className={cn(
      'bg-card rounded-xl boty-shadow boty-transition hover:shadow-md',
      post.is_pinned && 'ring-1 ring-primary/20'
    )}>
      <div className="flex gap-0">
        {/* Vote column */}
        <div className="flex flex-col items-center py-3 px-2.5 bg-background/40 rounded-l-xl">
          <VoteButtons score={score} userVote={userVote} onVote={handleVote} disabled={voting} size="sm" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 p-3.5">
          {/* Meta row */}
          <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
            {post.is_pinned && (
              <span className="inline-flex items-center gap-0.5 text-xs text-primary font-medium">
                <Pin className="w-3 h-3" /> Pinned
              </span>
            )}
            {showCommunity && post.community && (
              <Link
                href={`/community/${post.community.slug}`}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-xs font-semibold text-primary hover:bg-primary/20 boty-transition"
              >
                {post.community.icon_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={post.community.icon_url} alt="" className="w-3.5 h-3.5 rounded-full object-cover" />
                ) : (
                  <PawPrint className="w-3 h-3 text-primary" />
                )}
                {post.community.name}
              </Link>
            )}
            <span className="text-xs text-muted-foreground">
              by{' '}
              <span className="font-medium text-foreground/70">
                {post.author?.full_name ?? 'Anonymous'}
              </span>
            </span>
            <span className="text-muted-foreground/50 text-xs">·</span>
            <span className="text-xs text-muted-foreground">{formatPostDate(post.created_at)}</span>
          </div>

          {/* Title */}
          <Link
            href={postHref}
            className="font-semibold text-foreground hover:text-primary boty-transition block leading-snug text-sm sm:text-base"
          >
            {post.title}
          </Link>

          {/* Body preview */}
          {post.content && (
            <p className="text-sm text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed">
              {post.content}
            </p>
          )}

          {post.image_urls?.length > 0 && (
            <Link href={postHref} className="block mt-2 rounded-lg overflow-hidden max-h-52 bg-background/50">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={post.image_urls[0]} alt={post.title} className="w-full h-full object-cover" />
            </Link>
          )}

          {post.link_url && (
            <a
              href={post.link_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline mt-1.5 px-2 py-1 rounded bg-primary/5 boty-transition"
            >
              <ExternalLink className="w-3 h-3 shrink-0" />
              <span className="truncate max-w-[240px]">{new URL(post.link_url).hostname}</span>
            </a>
          )}

          {/* Footer */}
          <div className="flex items-center gap-3 mt-2.5">
            <Link
              href={postHref}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground boty-transition"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>{post.comment_count} {post.comment_count === 1 ? 'comment' : 'comments'}</span>
            </Link>

            {userId === post.author_id && onDeleted && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button
                    type="button"
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive boty-transition ml-auto"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete post?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This cannot be undone. The post and all its comments will be permanently removed.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
      </div>
    </article>
  )
}
