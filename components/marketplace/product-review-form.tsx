'use client'

import { useState } from 'react'
import { createReview } from '@/lib/marketplace/service'
import type { ReviewFormData } from '@/lib/marketplace/service'
import { useAuth } from '@/hooks/use-auth'
import { toast } from 'sonner'
import { Loader2, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
  productId: string
  productName: string
  orderId?: string | null
  onSuccess: () => void
}

export function ProductReviewForm({ productId, productName, orderId, onSuccess }: Props) {
  const { user } = useAuth()
  const [rating, setRating] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.id || rating === 0) {
      toast.error('Please select a rating')
      return
    }
    setLoading(true)
    const data: ReviewFormData = { product_id: productId, order_id: orderId ?? null, rating, comment: comment.trim() || null }
    const { error } = await createReview(data, user.id)
    setLoading(false)
    if (error) {
      toast.error(error)
    } else {
      toast.success('Review submitted')
      onSuccess()
    }
  }

  const displayed = hovered || rating

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <p className="text-sm font-medium text-foreground mb-2">Rate {productName}</p>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onMouseEnter={() => setHovered(star)}
              onMouseLeave={() => setHovered(0)}
              onClick={() => setRating(star)}
              className="p-0.5 transition-transform hover:scale-110"
            >
              <Star
                className={`w-7 h-7 transition-colors ${
                  star <= displayed ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/40'
                }`}
              />
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">Comment (optional)</label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          placeholder="Share your experience…"
          className="w-full px-4 py-2.5 rounded-xl bg-background border border-border/60 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      <Button type="submit" disabled={loading || rating === 0} className="w-full">
        {loading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Submitting…</> : 'Submit Review'}
      </Button>
    </form>
  )
}
