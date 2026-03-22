'use client'

import { ArrowUp, ArrowDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface VoteButtonsProps {
  score: number
  userVote: 1 | -1 | null
  onVote: (vote: 1 | -1) => void
  disabled?: boolean
  size?: 'sm' | 'md'
}

export function VoteButtons({ score, userVote, onVote, disabled, size = 'md' }: VoteButtonsProps) {
  const iconCls = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'
  const btnCls = size === 'sm' ? 'p-0.5' : 'p-1'

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => onVote(1)}
        disabled={disabled}
        aria-label="Upvote"
        className={cn(
          btnCls,
          'rounded boty-transition',
          userVote === 1
            ? 'text-primary bg-primary/10'
            : 'text-muted-foreground hover:text-primary hover:bg-primary/10'
        )}
      >
        <ArrowUp className={iconCls} />
      </button>

      <span className={cn(
        'font-semibold tabular-nums min-w-[2ch] text-center',
        size === 'sm' ? 'text-xs' : 'text-sm',
        score > 0 ? 'text-primary' : score < 0 ? 'text-destructive' : 'text-muted-foreground'
      )}>
        {score > 0 ? `+${score}` : score}
      </span>

      <button
        type="button"
        onClick={() => onVote(-1)}
        disabled={disabled}
        aria-label="Downvote"
        className={cn(
          btnCls,
          'rounded boty-transition',
          userVote === -1
            ? 'text-destructive bg-destructive/10'
            : 'text-muted-foreground hover:text-destructive hover:bg-destructive/10'
        )}
      >
        <ArrowDown className={iconCls} />
      </button>
    </div>
  )
}
