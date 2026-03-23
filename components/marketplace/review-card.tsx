import { Star, User } from 'lucide-react'
import type { ProductReviewWithUser } from '@/lib/auth/types'

interface Props {
  review: ProductReviewWithUser
}

export function ReviewCard({ review }: Props) {
  return (
    <div className="bg-card rounded-xl p-4 boty-shadow space-y-2">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
          {review.user?.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={review.user.avatar_url} alt={review.user.full_name ?? ''} className="w-full h-full object-cover" />
          ) : (
            <User className="w-4 h-4 text-primary" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">
            {review.user?.full_name ?? 'Anonymous'}
          </p>
          <div className="flex items-center gap-1 mt-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-3 h-3 ${star <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'}`}
              />
            ))}
          </div>
        </div>
        <span className="text-xs text-muted-foreground shrink-0">
          {new Date(review.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </span>
      </div>

      {review.comment && (
        <p className="text-sm text-muted-foreground leading-relaxed">{review.comment}</p>
      )}
    </div>
  )
}
