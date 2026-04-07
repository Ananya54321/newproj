'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ChevronLeft, Minus, Plus, ShoppingBag, Check, Store as StoreIcon, Package, Loader2 } from 'lucide-react'
import { useCart } from '@/components/boty/cart-context'
import { getProductById, formatPrice } from '@/lib/marketplace/service'
import { PRODUCT_CATEGORIES } from '@/lib/auth/types'
import type { ProductWithStore } from '@/lib/auth/types'

export default function ProductDetailPage() {
  const params = useParams<{ storeSlug: string; productId: string }>()
  const [product, setProduct] = useState<ProductWithStore | null>(null)
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [selectedImage, setSelectedImage] = useState(0)
  const [added, setAdded] = useState(false)
  const { addItem } = useCart()

  useEffect(() => {
    if (!params.productId) return
    getProductById(params.productId)
      .then(setProduct)
      .finally(() => setLoading(false))
  }, [params.productId])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground gap-2">
        <Loader2 className="w-5 h-5 animate-spin" /> Loading product…
      </div>
    )
  }

  if (!product) {
    return (
      <div className="py-20 text-center text-muted-foreground">Product not found.</div>
    )
  }

  const images = product.images?.filter(Boolean) ?? []
  const categoryLabel = PRODUCT_CATEGORIES.find((c) => c.value === product.category)?.label

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      addItem({
        id: product.id,
        name: product.name,
        description: product.description ?? '',
        price: product.price,
        image: images[0] ?? '/placeholder.svg',
        stock: product.stock,
        storeId: product.store_id,
        storeSlug: product.store?.slug ?? product.store_id,
      })
    }
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  return (
    <div className="pt-16 pb-8 sm:py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        {/* Back link */}
        <Link
          href={`/marketplace/${params.storeSlug}`}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground boty-transition mb-8"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to {product.store?.name ?? 'Store'}
        </Link>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-20">
          {/* Images */}
          <div className="space-y-4">
            <div className="relative aspect-square rounded-3xl overflow-hidden bg-card boty-shadow">
              {images[selectedImage] ? (
                <Image
                  src={images[selectedImage]}
                  alt={product.name}
                  fill
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-muted">
                  <Package className="w-20 h-20 text-muted-foreground/20" />
                </div>
              )}
            </div>
            {images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none]">
                {images.map((img, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setSelectedImage(i)}
                    className={`relative w-20 h-20 rounded-xl overflow-hidden bg-card boty-shadow boty-transition ${
                      i === selectedImage ? 'ring-2 ring-primary' : 'opacity-60 hover:opacity-100'
                    }`}
                  >
                    <Image src={img} alt={`${product.name} ${i + 1}`} fill className="object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex flex-col">
            {/* Store link */}
            <Link
              href={`/marketplace/${params.storeSlug}`}
              className="inline-flex items-center gap-2 text-sm text-primary mb-4 hover:underline"
            >
              <StoreIcon className="w-3.5 h-3.5" />
              {product.store?.name}
            </Link>

            {/* Header */}
            <div className="mb-6">
              {categoryLabel && (
                <span className="text-sm tracking-[0.2em] uppercase text-primary mb-2 block">
                  {categoryLabel}
                </span>
              )}
              <h1 className="font-serif text-4xl md:text-5xl text-foreground mb-3">
                {product.name}
              </h1>
              {product.description && (
                <p className="text-foreground/80 leading-relaxed">{product.description}</p>
              )}
            </div>

            {/* Price */}
            <div className="flex items-center gap-3 mb-8">
              <span className="text-3xl font-medium text-foreground">{formatPrice(product.price)}</span>
              {product.stock === 0 && (
                <span className="text-sm text-destructive">Out of stock</span>
              )}
              {product.stock > 0 && product.stock <= 5 && (
                <span className="text-sm text-amber-600">Only {product.stock} left</span>
              )}
            </div>

            {/* Quantity */}
            {product.stock > 0 && (
              <div className="mb-8">
                <label className="text-sm font-medium text-foreground mb-3 block">Quantity</label>
                <div className="inline-flex items-center gap-4 bg-card rounded-full px-2 py-2 boty-shadow">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 rounded-full bg-background flex items-center justify-center text-foreground/60 hover:text-foreground boty-transition"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-8 text-center font-medium text-foreground">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    className="w-10 h-10 rounded-full bg-background flex items-center justify-center text-foreground/60 hover:text-foreground boty-transition"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* CTA */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                type="button"
                disabled={product.stock === 0}
                onClick={handleAddToCart}
                className={`flex-1 inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full text-sm tracking-wide boty-transition boty-shadow disabled:opacity-50 disabled:cursor-not-allowed ${
                  added
                    ? 'bg-primary/80 text-primary-foreground'
                    : 'bg-primary text-primary-foreground hover:bg-primary/90'
                }`}
              >
                {added ? (
                  <><Check className="w-4 h-4" /> Added to Cart</>
                ) : product.stock === 0 ? (
                  'Out of Stock'
                ) : (
                  <><ShoppingBag className="w-4 h-4" /> Add to Cart</>
                )}
              </button>
            </div>

            {/* Stock info */}
            {product.stock > 0 && (
              <p className="text-sm text-muted-foreground mt-4">
                {product.stock} unit{product.stock !== 1 ? 's' : ''} in stock
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
