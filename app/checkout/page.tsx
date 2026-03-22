'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, Package, Loader2, ShoppingCart } from 'lucide-react'
import { Header } from '@/components/boty/header'
import { Footer } from '@/components/boty/footer'
import { useCart } from '@/components/boty/cart-context'
import { useAuth } from '@/hooks/use-auth'
import { checkout, formatPrice } from '@/lib/marketplace/service'
import type { CheckoutItem } from '@/lib/marketplace/service'
import { toast } from 'sonner'

export default function CheckoutPage() {
  const { items, subtotal, clearCart } = useCart()
  const { user } = useAuth()
  const router = useRouter()
  const [shippingAddress, setShippingAddress] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Only items with a storeId can be checked out
  const checkoutItems = items.filter((i) => i.storeId) as (typeof items[0] & { storeId: string })[]
  const nonCheckoutItems = items.filter((i) => !i.storeId)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      toast.error('Please sign in to complete your purchase')
      router.push('/login')
      return
    }
    if (checkoutItems.length === 0) {
      toast.error('No items to checkout')
      return
    }
    if (!shippingAddress.trim()) {
      toast.error('Please enter a shipping address')
      return
    }

    setSubmitting(true)
    const payload: CheckoutItem[] = checkoutItems.map((i) => ({
      id: i.id,
      name: i.name,
      price: i.price,
      quantity: i.quantity,
      image: i.image,
      storeId: i.storeId,
    }))

    const { orderIds, error } = await checkout(payload, user.id, shippingAddress.trim())
    setSubmitting(false)

    if (error) {
      toast.error(error)
      return
    }

    clearCart()
    toast.success(`Order${orderIds.length > 1 ? 's' : ''} placed successfully!`)
    router.push('/orders?success=true')
  }

  if (items.length === 0) {
    return (
      <main className="min-h-screen">
        <Header />
        <div className="pt-28 pb-20">
          <div className="max-w-2xl mx-auto px-6 py-20 text-center">
            <ShoppingCart className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
            <p className="font-semibold text-foreground text-lg">Your cart is empty</p>
            <p className="text-sm text-muted-foreground mt-1 mb-6">Add some products to proceed to checkout.</p>
            <Link
              href="/marketplace"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-full text-sm font-medium hover:bg-primary/90 boty-transition"
            >
              Browse Marketplace
            </Link>
          </div>
        </div>
        <Footer />
      </main>
    )
  }

  return (
    <main className="min-h-screen">
      <Header />

      <div className="pt-28 pb-20">
        <div className="max-w-5xl mx-auto px-6 lg:px-8">
          <Link
            href="/marketplace"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground boty-transition mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Continue Shopping
          </Link>

          <h1 className="font-serif text-3xl text-foreground mb-8">Checkout</h1>

          <div className="grid lg:grid-cols-[1fr_400px] gap-8">
            {/* Left: Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="bg-card rounded-2xl p-6 boty-shadow space-y-4">
                <h2 className="font-semibold text-foreground">Shipping Information</h2>

                {!user && (
                  <div className="text-sm text-amber-700 bg-amber-50 rounded-xl p-3">
                    You need to{' '}
                    <Link href="/login" className="underline font-medium">sign in</Link>
                    {' '}to complete your purchase.
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Shipping Address <span className="text-destructive">*</span>
                  </label>
                  <textarea
                    value={shippingAddress}
                    onChange={(e) => setShippingAddress(e.target.value)}
                    rows={3}
                    placeholder="Street address, city, state, ZIP code…"
                    required
                    className="w-full px-4 py-3 rounded-xl bg-background border border-border/60 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Order Notes <span className="text-muted-foreground text-xs">(optional)</span>
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                    placeholder="Any special instructions for your order…"
                    className="w-full px-4 py-3 rounded-xl bg-background border border-border/60 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>

              {nonCheckoutItems.length > 0 && (
                <div className="text-sm text-muted-foreground bg-muted/50 rounded-xl p-4">
                  {nonCheckoutItems.length} item{nonCheckoutItems.length !== 1 ? 's' : ''} in your cart cannot be checked out (not from a verified store) and will be removed.
                </div>
              )}

              <button
                type="submit"
                disabled={submitting || !user || checkoutItems.length === 0}
                className="w-full py-4 bg-primary text-primary-foreground rounded-full font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed boty-transition flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Placing Order…</>
                ) : (
                  `Place Order · ${formatPrice(checkoutItems.reduce((s, i) => s + i.price * i.quantity, 0))}`
                )}
              </button>
            </form>

            {/* Right: Order summary */}
            <div className="space-y-4">
              <div className="bg-card rounded-2xl p-6 boty-shadow">
                <h2 className="font-semibold text-foreground mb-4">Order Summary</h2>
                <div className="space-y-4">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-xl bg-muted overflow-hidden shrink-0 flex items-center justify-center">
                        {item.image && item.image !== '/placeholder.svg' ? (
                          <Image src={item.image} alt={item.name} width={56} height={56} className="object-cover w-full h-full" />
                        ) : (
                          <Package className="w-5 h-5 text-muted-foreground/40" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
                        <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                      </div>
                      <p className="text-sm font-medium text-foreground">{formatPrice(item.price * item.quantity)}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-6 pt-4 border-t border-border/50 space-y-2 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Shipping</span>
                    <span>Free</span>
                  </div>
                  <div className="flex justify-between font-semibold text-foreground text-base pt-2 border-t border-border/50">
                    <span>Total</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  )
}
