'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { Package, CheckCircle, Loader2 } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { OrderCard } from '@/components/marketplace/order-card'
import { getUserOrders, getOwnerStore, getStoreOrders } from '@/lib/marketplace/service'
import { supabaseClient } from '@/lib/supabase/client'
import type { OrderWithItems, Store } from '@/lib/auth/types'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function OrdersPage() {
  const { user, profile } = useAuth()
  const searchParams = useSearchParams()
  const success = searchParams.get('success') === 'true'

  const [userOrders, setUserOrders] = useState<OrderWithItems[]>([])
  const [storeOrders, setStoreOrders] = useState<OrderWithItems[]>([])
  const [store, setStore] = useState<Store | null>(null)
  const [loading, setLoading] = useState(true)

  const loadOrders = useCallback(async () => {
    if (!user?.id) return
    setLoading(true)
    try {
      const [orders, ownerStore] = await Promise.all([
        getUserOrders(user.id, supabaseClient),
        profile?.role === 'store_owner' ? getOwnerStore(user.id, supabaseClient) : Promise.resolve(null),
      ])
      setUserOrders(orders)
      setStore(ownerStore)
      if (ownerStore) {
        const sOrders = await getStoreOrders(ownerStore.id, supabaseClient)
        setStoreOrders(sOrders)
      }
    } finally {
      setLoading(false)
    }
  }, [user?.id, profile?.role])

  useEffect(() => { loadOrders() }, [loadOrders])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground gap-2">
        <Loader2 className="w-5 h-5 animate-spin" /> Loading orders…
      </div>
    )
  }

  const isStoreOwner = profile?.role === 'store_owner'

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="bg-card border-b border-border/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
              <Package className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="font-serif text-3xl font-bold text-foreground mb-1.5">My Orders</h1>
              <p className="text-muted-foreground text-sm max-w-lg">
                Track and manage your purchases{isStoreOwner ? ' and incoming store orders' : ''}.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-4">
        {/* Success banner */}
        {success && (
          <div className="flex items-center gap-3 bg-emerald-50 text-emerald-800 rounded-xl p-4 text-sm">
            <CheckCircle className="w-5 h-5 shrink-0" />
            Your order has been placed! We&apos;ll notify you when it&apos;s confirmed.
          </div>
        )}

        {isStoreOwner && store ? (
          <Tabs defaultValue="purchases">
            <TabsList>
              <TabsTrigger value="purchases">My Purchases ({userOrders.length})</TabsTrigger>
              <TabsTrigger value="store">Store Orders ({storeOrders.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="purchases" className="mt-4 space-y-4">
              <OrdersList orders={userOrders} isStoreOwner={false} onRefresh={loadOrders} />
            </TabsContent>

            <TabsContent value="store" className="mt-4 space-y-4">
              <OrdersList orders={storeOrders} isStoreOwner={true} onRefresh={loadOrders} />
            </TabsContent>
          </Tabs>
        ) : (
          <div className="space-y-4">
            <OrdersList orders={userOrders} isStoreOwner={false} onRefresh={loadOrders} />
          </div>
        )}
      </div>
    </div>
  )
}

function OrdersList({
  orders,
  isStoreOwner,
  onRefresh,
}: {
  orders: OrderWithItems[]
  isStoreOwner: boolean
  onRefresh: () => void
}) {
  if (orders.length === 0) {
    return (
      <div className="py-20 text-center bg-card rounded-2xl boty-shadow">
        <Package className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
        <p className="font-semibold text-foreground">No orders yet</p>
        <p className="text-sm text-muted-foreground mt-1">
          {isStoreOwner ? "You haven't received any orders yet." : "You haven't placed any orders yet."}
        </p>
      </div>
    )
  }

  return (
    <>
      {orders.map((order) => (
        <OrderCard key={order.id} order={order} isStoreOwner={isStoreOwner} onStatusChange={onRefresh} />
      ))}
    </>
  )
}
