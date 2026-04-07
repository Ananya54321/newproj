'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ShoppingBag, Package } from 'lucide-react'
import { useCart } from '@/components/boty/cart-context'
import { formatPrice } from '@/lib/marketplace/service'
import type { ProductWithStore } from '@/lib/auth/types'

interface ProductCardProps {
  product: ProductWithStore
  index?: number
  isVisible?: boolean
}

export function ProductCard({ product, index = 0, isVisible = true }: ProductCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false)
  const { addItem } = useCart()

  const firstImage = product.images?.[0] ?? null
  const storeSlug = product.store?.slug ?? product.store_id

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    addItem({
      id: product.id,
      name: product.name,
      description: product.description ?? '',
      price: product.price,
      image: firstImage ?? '/placeholder.svg',
      stock: product.stock,
      storeId: product.store_id,
      storeSlug: storeSlug,
    })
  }

  return (
    <Link
      href={`/marketplace/${storeSlug}/${product.id}`}
      className={`group transition-all duration-700 ease-out ${
        isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
      }`}
      style={{ transitionDelay: `${index * 60}ms` }}
    >
      <div className="bg-card rounded-3xl overflow-hidden boty-shadow boty-transition group-hover:scale-[1.02]">
        {/* Image */}
        <div className="relative aspect-square bg-muted overflow-hidden">
          <div
            className={`absolute inset-0 bg-linear-to-br from-muted via-muted/50 to-muted animate-pulse transition-opacity duration-500 ${
              imageLoaded ? 'opacity-0' : 'opacity-100'
            }`}
          />
          {firstImage ? (
            <Image
              src={firstImage}
              alt={product.name}
              fill
              className={`object-cover boty-transition group-hover:scale-105 transition-opacity duration-500 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              onLoad={() => setImageLoaded(true)}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-muted">
              <Package className="w-12 h-12 text-muted-foreground/30" />
            </div>
          )}

          {/* Category badge */}
          {product.category && (
            <span className="absolute top-4 left-4 px-3 py-1 rounded-full text-xs tracking-wide bg-primary/10 text-primary capitalize">
              {product.category}
            </span>
          )}

          {/* Sold out */}
          {product.stock === 0 && (
            <span className="absolute top-4 right-4 px-3 py-1 rounded-full text-xs bg-destructive/10 text-destructive font-medium">
              Sold out
            </span>
          )}

          {/* Quick add */}
          {product.stock > 0 && (
            <button
              type="button"
              onClick={handleAddToCart}
              className="absolute bottom-3 right-3 w-9 h-9 sm:w-12 sm:h-12 rounded-full bg-background/90 backdrop-blur-sm flex items-center justify-center sm:opacity-0 sm:translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 boty-transition boty-shadow"
              aria-label="Add to cart"
            >
              <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 text-foreground" />
            </button>
          )}
        </div>

        {/* Info */}
        <div className="p-3 sm:p-5">
          <p className="text-xs text-muted-foreground mb-1 truncate">{product.store?.name}</p>
          <h3 className="font-serif text-sm sm:text-lg text-foreground mb-1 truncate">{product.name}</h3>
          {product.description && (
            <p className="hidden sm:block text-sm text-muted-foreground mb-3 line-clamp-2">{product.description}</p>
          )}
          <div className="flex items-center justify-between mt-1 sm:mt-0">
            <span className="text-sm sm:text-lg font-medium text-foreground">{formatPrice(product.price)}</span>
            {product.stock > 0 && product.stock <= 5 && (
              <span className="text-xs text-amber-600 hidden sm:inline">Only {product.stock} left</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
