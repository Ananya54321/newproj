'use client'

import Image from 'next/image'
import { Package } from 'lucide-react'
import { ORDER_STATUS_CONFIG } from '@/lib/auth/types'
import type { OrderWithItems, OrderStatus } from '@/lib/auth/types'
import { updateOrderStatus, formatPrice } from '@/lib/marketplace/service'
import { useState } from 'react'
import { toast } from 'sonner'

interface OrderCardProps {
  order: OrderWithItems
  isStoreOwner?: boolean
  onStatusChange?: () => void
}

const STORE_OWNER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending:    ['confirmed', 'cancelled'],
  confirmed:  ['processing', 'cancelled'],
  processing: ['shipped'],
  shipped:    ['delivered'],
  delivered:  [],
  cancelled:  [],
}

export function OrderCard({ order, isStoreOwner = false, onStatusChange }: OrderCardProps) {
  const [updating, setUpdating] = useState(false)
  const config = ORDER_STATUS_CONFIG[order.status]
  const nextStatuses = isStoreOwner ? STORE_OWNER_TRANSITIONS[order.status] : []

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

  return (
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
            <p className="text-sm font-medium text-foreground">{formatPrice(item.unit_price * item.quantity)}</p>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-border/50">
        <div>
          {order.shipping_address && (
            <p className="text-xs text-muted-foreground truncate max-w-[200px]">
              Ship to: {order.shipping_address}
            </p>
          )}
        </div>
        <p className="font-semibold text-foreground">{formatPrice(order.total_amount)}</p>
      </div>

      {/* Store owner status actions */}
      {isStoreOwner && nextStatuses.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {nextStatuses.map((status) => (
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
        </div>
      )}
    </div>
  )
}
