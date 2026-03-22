'use client'

import Link from 'next/link'
import { Users, FileText, ArrowRight, PawPrint } from 'lucide-react'
import type { Community } from '@/lib/auth/types'
import { cn } from '@/lib/utils'

interface CommunityCardProps {
  community: Community
  isMember?: boolean
  onJoin?: () => void
  onLeave?: () => void
  joining?: boolean
}

export function CommunityCard({ community, isMember, onJoin, onLeave, joining }: CommunityCardProps) {
  return (
    <div className={cn(
      'bg-card rounded-2xl boty-shadow boty-transition group overflow-hidden',
      'hover:shadow-md hover:ring-1 hover:ring-primary/10'
    )}>
      {/* Banner or gradient header */}
      <div className="h-12 bg-linear-to-r from-primary/15 via-primary/8 to-transparent relative overflow-hidden">
        {community.banner_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={community.banner_url}
            alt=""
            className="w-full h-full object-cover opacity-40"
          />
        )}
        <div className="absolute inset-0 bg-linear-to-b from-transparent to-card/30" />
      </div>

      <div className="px-5 pb-5 -mt-5 relative">
        {/* Icon */}
        <div className="w-12 h-12 rounded-xl bg-card border-2 border-background boty-shadow flex items-center justify-center shrink-0 overflow-hidden mb-3">
          {community.icon_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={community.icon_url} alt={community.name} className="w-full h-full object-cover" />
          ) : (
            <PawPrint className="w-6 h-6 text-primary/40" />
          )}
        </div>

        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <Link
              href={`/community/${community.slug}`}
              className="font-semibold text-foreground hover:text-primary boty-transition block leading-snug"
            >
              {community.name}
              <ArrowRight className="w-3.5 h-3.5 inline ml-1 opacity-0 group-hover:opacity-100 boty-transition -translate-x-1 group-hover:translate-x-0 transition-transform" />
            </Link>
            {community.description && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                {community.description}
              </p>
            )}
          </div>

          {(onJoin || onLeave) && (
            <button
              type="button"
              onClick={isMember ? onLeave : onJoin}
              disabled={joining}
              className={cn(
                'shrink-0 text-sm px-3.5 py-1.5 rounded-lg font-medium boty-transition',
                isMember
                  ? 'bg-secondary text-secondary-foreground hover:bg-destructive/10 hover:text-destructive'
                  : 'bg-primary text-primary-foreground hover:bg-primary/90'
              )}
            >
              {joining ? (
                <span className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
                  <span>{isMember ? 'Leaving…' : 'Joining…'}</span>
                </span>
              ) : isMember ? 'Leave' : 'Join'}
            </button>
          )}
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border/50">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <div className="w-5 h-5 rounded bg-primary/10 flex items-center justify-center">
              <Users className="w-3 h-3 text-primary" />
            </div>
            <span>
              <span className="font-semibold text-foreground">{community.member_count.toLocaleString()}</span>
              {' '}members
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <div className="w-5 h-5 rounded bg-primary/10 flex items-center justify-center">
              <FileText className="w-3 h-3 text-primary" />
            </div>
            <span>
              <span className="font-semibold text-foreground">{community.post_count.toLocaleString()}</span>
              {' '}posts
            </span>
          </div>
          {isMember && (
            <span className="ml-auto text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
              Joined
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
