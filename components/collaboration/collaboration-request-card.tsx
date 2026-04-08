'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Package, Heart, CheckCircle, XCircle, Loader2, Store as StoreIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { respondToCollaboration } from '@/lib/collaboration/service'
import { formatPrice } from '@/lib/marketplace/service'
import type { NgoProductCollaborationWithRelations } from '@/lib/auth/types'
import { toast } from 'sonner'

interface CollaborationRequestCardProps {
  collaboration: NgoProductCollaborationWithRelations
  onResponded: (id: string, accepted: boolean) => void
}

export function CollaborationRequestCard({ collaboration, onResponded }: CollaborationRequestCardProps) {
  const [responseMessage, setResponseMessage] = useState('')
  const [submitting, setSubmitting] = useState<'accept' | 'reject' | null>(null)

  const handleRespond = async (accept: boolean) => {
    setSubmitting(accept ? 'accept' : 'reject')
    const { error } = await respondToCollaboration(
      collaboration.id,
      accept,
      responseMessage.trim() || null
    )
    setSubmitting(null)
    if (error) {
      toast.error(error)
    } else {
      toast.success(accept ? 'Collaboration accepted! Product is now featured.' : 'Collaboration declined.')
      onResponded(collaboration.id, accept)
    }
  }

  const product = collaboration.product
  const store = collaboration.store
  const firstImage = product.images?.[0] ?? null

  const statusColor: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-800',
    accepted: 'bg-emerald-100 text-emerald-800',
    rejected: 'bg-destructive/10 text-destructive',
  }

  return (
    <div className="bg-card rounded-2xl boty-shadow overflow-hidden">
      {/* Product info row */}
      <div className="flex items-center gap-4 p-4 border-b border-border/40">
        <div className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center overflow-hidden shrink-0">
          {firstImage ? (
            <Image src={firstImage} alt={product.name} width={56} height={56} className="w-full h-full object-cover" />
          ) : (
            <Package className="w-6 h-6 text-muted-foreground/40" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-foreground truncate">{product.name}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <StoreIcon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <p className="text-sm text-muted-foreground truncate">{store.name}</p>
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="font-semibold text-foreground">{formatPrice(product.price)}</p>
          {product.category && (
            <span className="text-xs text-muted-foreground capitalize">{product.category}</span>
          )}
        </div>
      </div>

      {/* Collaboration details */}
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
              <Heart className="w-3.5 h-3.5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                {collaboration.ngo_proceeds_percent}% of proceeds donated to your NGO
              </p>
              <p className="text-xs text-muted-foreground">
                ≈ {formatPrice((product.price * collaboration.ngo_proceeds_percent) / 100)} per sale
              </p>
            </div>
          </div>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${statusColor[collaboration.status] ?? ''}`}>
            {collaboration.status}
          </span>
        </div>

        {collaboration.store_message && (
          <div className="rounded-xl bg-muted/50 px-4 py-3">
            <p className="text-xs font-medium text-muted-foreground mb-1">Message from store</p>
            <p className="text-sm text-foreground italic">&quot;{collaboration.store_message}&quot;</p>
          </div>
        )}

        {/* Response form — only for pending */}
        {collaboration.status === 'pending' && (
          <div className="space-y-3 pt-1">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                Your response message <span className="font-normal">(optional)</span>
              </label>
              <textarea
                value={responseMessage}
                onChange={(e) => setResponseMessage(e.target.value)}
                rows={2}
                maxLength={300}
                placeholder="Add a note to the store owner…"
                className="w-full px-3 py-2 rounded-xl bg-background border border-border/60 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-destructive hover:text-destructive border-destructive/30 hover:bg-destructive/5"
                onClick={() => handleRespond(false)}
                disabled={submitting !== null}
              >
                {submitting === 'reject' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5 mr-1" />}
                Decline
              </Button>
              <Button
                size="sm"
                className="flex-1"
                onClick={() => handleRespond(true)}
                disabled={submitting !== null}
              >
                {submitting === 'accept' ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <CheckCircle className="w-3.5 h-3.5 mr-1" />}
                Accept & Feature
              </Button>
            </div>
          </div>
        )}

        {/* Show NGO response if already responded */}
        {collaboration.status !== 'pending' && collaboration.ngo_response_message && (
          <div className="rounded-xl bg-muted/50 px-4 py-3">
            <p className="text-xs font-medium text-muted-foreground mb-1">Your response</p>
            <p className="text-sm text-foreground italic">&quot;{collaboration.ngo_response_message}&quot;</p>
          </div>
        )}
      </div>
    </div>
  )
}
