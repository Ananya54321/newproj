'use client'

import Image from 'next/image'
import { useState } from 'react'
import { Package, Truck, MapPin, Star, RotateCcw } from 'lucide-react'
import { ORDER_STATUS_CONFIG, RETURN_STATUS_CONFIG } from '@/lib/auth/types'
import type { OrderWithItems, OrderStatus, ReturnRequest } from '@/lib/auth/types'
import { updateOrderStatus, markOrderDelivered, formatPrice, getReturnEligibility, getReturnRequestByOrder } from '@/lib/marketplace/service'
import { DispatchModal } from './dispatch-modal'
import { ProductReviewForm } from './product-review-form'
import { ReturnRequestForm } from './return-request-form'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'
import { useEffect } from 'react'

interface OrderCardProps {
  order: OrderWithItems
  isStoreOwner?: boolean
  onStatusChange?: () => void
}

const STORE_OWNER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending:    ['confirmed', 'cancelled'],
  confirmed:  ['processing'],
  processing: [], // "shipped" handled via dispatch modal
  shipped:    [],
  delivered:  [],
  cancelled:  [],
}

export function OrderCard({ order, isStoreOwner = false, onStatusChange }: OrderCardProps) {
  const { user } = useAuth()
  const [updating, setUpdating] = useState(false)
  const [showDispatch, setShowDispatch] = useState(false)
  const [showReturn, setShowReturn] = useState(false)
  const [reviewProductId, setReviewProductId] = useState<string | null>(null)
  const [existingReturn, setExistingReturn] = useState<ReturnRequest | null | undefined>(undefined)
  const config = ORDER_STATUS_CONFIG[order.status]

  // Check for existing return request on delivered orders
  useEffect(() => {
    if (!isStoreOwner && order.status === 'delivered') {
      getReturnRequestByOrder(order.id).then(setExistingReturn)
    }
  }, [order.id, order.status, isStoreOwner])

  // Determine first item category for return eligibility check
  const firstItemCategory = (order.items[0]?.product as unknown as { category?: string })?.category

  // Use order.updated_at as a proxy for delivery date when status is delivered
  const deliveredAt = order.status === 'delivered' ? order.updated_at : null
  const returnCheck = getReturnEligibility(firstItemCategory, deliveredAt, existingReturn !== null && existingReturn !== undefined)

  const handleStatusChange = async (status: OrderStatus) => {
    setUpdating(true)
    const { error } = await updateOrderStatus(order.id, status)
    setUpdating(false)
    if (error) {
      toast.error(error)
    } else {
      toast.success('Order status updated')
      onStatusChange?.()
    }
  }

  const handleMarkReceived = async () => {
    setUpdating(true)
    const { error } = await markOrderDelivered(order.id)
    setUpdating(false)
    if (error) {
      toast.error(error)
    } else {
      toast.success('Order marked as received')
      onStatusChange?.()
    }
  }

  const reviewProduct = order.items.find((i) => i.product_id === reviewProductId)?.product

  return (
    <>
      <div className="bg-card rounded-2xl p-5 boty-shadow space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs text-muted-foreground">Order #{order.id.slice(0, 8).toUpperCase()}</p>
            <p className="font-serif text-base font-semibold text-foreground mt-0.5">{order.store?.name}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium shrink-0 ${config.color}`}>
            {config.label}
          </span>
        </div>

        {/* Items */}
        <div className="space-y-3">
          {order.items.map((item) => (
            <div key={item.id} className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-muted overflow-hidden shrink-0 flex items-center justify-center">
                {item.product?.images?.[0] ? (
                  <Image
                    src={item.product.images[0]}
                    alt={item.product.name ?? ''}
                    width={48}
                    height={48}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <Package className="w-5 h-5 text-muted-foreground/40" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{item.product?.name ?? 'Product'}</p>
                <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-foreground">{formatPrice(item.unit_price * item.quantity)}</p>
                {/* Review button per product for delivered orders (customer) */}
                {!isStoreOwner && order.status === 'delivered' && item.product_id && (
                  <button
                    onClick={() => setReviewProductId(reviewProductId === item.product_id ? null : item.product_id)}
                    className="text-xs text-primary hover:underline flex items-center gap-0.5 mt-0.5 ml-auto"
                  >
                    <Star className="w-2.5 h-2.5" />
                    Review
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Inline review form */}
        {reviewProductId && reviewProduct && (
          <div className="bg-background rounded-xl p-4 border border-border/40">
            <ProductReviewForm
              productId={reviewProductId}
              productName={reviewProduct.name}
              orderId={order.id}
              onSuccess={() => {
                setReviewProductId(null)
                toast.success('Review submitted')
              }}
            />
          </div>
        )}

        {/* Shipping info (customer sees this when shipped) */}
        {!isStoreOwner && order.status === 'shipped' && (
          <div className="bg-blue-50 rounded-xl p-3 space-y-1">
            <p className="text-xs font-medium text-blue-800 flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5" /> Your order is on its way!
            </p>
            {(order as OrderWithItems & { tracking_number?: string }).tracking_number && (
              <p className="text-xs text-blue-700">
                Tracking: {(order as OrderWithItems & { tracking_number?: string }).tracking_number}
              </p>
            )}
            {(order as OrderWithItems & { dispatch_note?: string }).dispatch_note && (
              <p className="text-xs text-blue-700 italic">
                &ldquo;{(order as OrderWithItems & { dispatch_note?: string }).dispatch_note}&rdquo;
              </p>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-border/50">
          <div>
            {order.shipping_address && (
              <p className="text-xs text-muted-foreground truncate max-w-[200px] flex items-center gap-1">
                <MapPin className="w-3 h-3 shrink-0" />
                {order.shipping_address}
              </p>
            )}
          </div>
          <p className="font-semibold text-foreground">{formatPrice(order.total_amount)}</p>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2 pt-1">
          {/* Store owner actions */}
          {isStoreOwner && STORE_OWNER_TRANSITIONS[order.status].map((status) => (
            <button
              key={status}
              type="button"
              disabled={updating}
              onClick={() => handleStatusChange(status)}
              className="text-xs px-3 py-1.5 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              Mark as {ORDER_STATUS_CONFIG[status].label}
            </button>
          ))}

          {/* Store owner: dispatch (processing → shipped) */}
          {isStoreOwner && order.status === 'processing' && (
            <Button
              size="sm"
              className="text-xs gap-1.5"
              onClick={() => setShowDispatch(true)}
            >
              <Truck className="w-3.5 h-3.5" />
              Mark as Shipped
            </Button>
          )}

          {/* Customer: mark as received (shipped → delivered) */}
          {!isStoreOwner && order.status === 'shipped' && (
            <Button
              size="sm"
              disabled={updating}
              onClick={handleMarkReceived}
              className="text-xs"
            >
              Mark as Received
            </Button>
          )}

          {/* Customer: return request (delivered, within 7 days) */}
          {!isStoreOwner && order.status === 'delivered' && existingReturn === null && returnCheck.eligible && (
            <button
              type="button"
              onClick={() => setShowReturn(true)}
              className="text-xs px-3 py-1.5 rounded-full border border-border/60 text-muted-foreground hover:border-primary/50 hover:text-foreground transition-colors flex items-center gap-1.5"
            >
              <RotateCcw className="w-3 h-3" />
              Request Return
            </button>
          )}

          {/* Show existing return status */}
          {!isStoreOwner && existingReturn && (
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${RETURN_STATUS_CONFIG[existingReturn.status].color}`}>
              {RETURN_STATUS_CONFIG[existingReturn.status].label}
            </span>
          )}
        </div>
      </div>

      {/* Dispatch modal */}
      {showDispatch && (
        <DispatchModal
          orderId={order.id}
          onSuccess={() => {
            setShowDispatch(false)
            onStatusChange?.()
          }}
          onClose={() => setShowDispatch(false)}
        />
      )}

      {/* Return request modal */}
      {showReturn && user && (
        <ReturnRequestForm
          order={order}
          userId={user.id}
          onSuccess={() => {
            setShowReturn(false)
            getReturnRequestByOrder(order.id).then(setExistingReturn)
          }}
          onClose={() => setShowReturn(false)}
        />
      )}
    </>
  )
}
