'use client'

import { useState, useEffect, useRef } from 'react'
import { SlidersHorizontal, X, Search, ShoppingBag, Heart, ExternalLink } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { ProductCard } from '@/components/marketplace/product-card'
import { getProducts } from '@/lib/marketplace/service'
import { getFeaturedProducts } from '@/lib/collaboration/service'
import { formatPrice } from '@/lib/marketplace/service'
import { PRODUCT_CATEGORIES } from '@/lib/auth/types'
import type { ProductWithStore, ProductCategory, ProductWithCollaboration } from '@/lib/auth/types'
import { useCart } from '@/components/boty/cart-context'

const ALL_CATEGORIES = [{ value: 'all', label: 'All Products' }, ...PRODUCT_CATEGORIES]

export default function MarketplacePage() {
  const { addItem } = useCart()
  const [products, setProducts] = useState<ProductWithStore[]>([])
  const [featuredProducts, setFeaturedProducts] = useState<ProductWithCollaboration[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | 'all'>('all')
  const [search, setSearch] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const gridRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    getFeaturedProducts()
      .then(setFeaturedProducts)
      .catch(() => setFeaturedProducts([]))
  }, [])

  useEffect(() => {
    setLoading(true)
    getProducts({ category: selectedCategory, search: search || undefined })
      .then(setProducts)
      .catch(() => setProducts([]))
      .finally(() => setLoading(false))
  }, [selectedCategory, search])

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true) },
      { threshold: 0.1 }
    )
    if (gridRef.current) observer.observe(gridRef.current)
    return () => { if (gridRef.current) observer.unobserve(gridRef.current) }
  }, [])

  useEffect(() => {
    setIsVisible(false)
    const t = setTimeout(() => setIsVisible(true), 50)
    return () => clearTimeout(t)
  }, [selectedCategory, search])

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="bg-card border-b border-border/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-16 pb-8 sm:pt-8">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <ShoppingBag className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="font-serif text-3xl font-bold text-foreground mb-1.5">Marketplace</h1>
                <p className="text-muted-foreground text-sm max-w-lg">
                  Discover quality pet products from verified stores on our platform.
                </p>
              </div>
            </div>

            {/* Search */}
            <div className="relative w-full sm:w-64 shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                placeholder="Search products…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2.5 rounded-xl bg-background border border-border/60 text-sm outline-none focus:ring-2 focus:ring-primary/30 w-full"
              />
            </div>
          </div>

          {/* Category filter bar */}
          <div className="mt-5 flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className="lg:hidden inline-flex items-center gap-2 text-sm text-foreground min-h-[36px] px-3 rounded-xl bg-background border border-border/60 shrink-0"
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filters
              {selectedCategory !== 'all' && <span className="w-2 h-2 rounded-full bg-primary inline-block" />}
            </button>
            <div className="hidden lg:flex items-center gap-2 flex-wrap">
              {ALL_CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setSelectedCategory(cat.value as ProductCategory | 'all')}
                  className={`px-4 py-1.5 rounded-full text-sm boty-transition shrink-0 ${
                    selectedCategory === cat.value
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-background border border-border/60 text-foreground/70 hover:text-foreground'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
            <span className="text-sm text-muted-foreground whitespace-nowrap ml-auto hidden sm:inline">
              {products.length} {products.length === 1 ? 'product' : 'products'}
            </span>
          </div>
        </div>
      </div>

      {/* Mobile filters drawer */}
      {showFilters && (
        <div className="lg:hidden fixed inset-0 z-50 bg-background">
          <div className="p-6">
            <div className="flex items-center justify-between mb-8">
              <h2 className="font-serif text-2xl text-foreground">Categories</h2>
              <button type="button" onClick={() => setShowFilters(false)} className="p-2 text-foreground/70 hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              {ALL_CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => { setSelectedCategory(cat.value as ProductCategory | 'all'); setShowFilters(false) }}
                  className={`w-full px-6 py-4 rounded-2xl text-left boty-transition ${
                    selectedCategory === cat.value
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-card text-foreground boty-shadow'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Featured Collaborations */}
      {featuredProducts.length > 0 && (
        <div className="bg-primary/5 border-b border-primary/10">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Heart className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h2 className="font-serif text-xl font-semibold text-foreground">Featured for Good</h2>
                <p className="text-xs text-muted-foreground">Every purchase supports a verified animal NGO</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {featuredProducts.map((product) => {
                const collab = product.collaboration!
                const ngoName = collab.ngo.ngo_profile?.organization_name ?? collab.ngo.full_name ?? 'NGO'
                const storeSlug = product.store?.slug ?? product.store_id
                const firstImage = product.images?.[0] ?? null
                return (
                  <Link
                    key={product.id}
                    href={`/marketplace/${storeSlug}/${product.id}`}
                    className="group bg-card rounded-2xl boty-shadow overflow-hidden boty-transition hover:scale-[1.02] block"
                  >
                    {/* Image */}
                    <div className="relative aspect-4/3 bg-muted overflow-hidden">
                      {firstImage ? (
                        <Image
                          src={firstImage}
                          alt={product.name}
                          fill
                          className="object-cover group-hover:scale-105 boty-transition"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-muted">
                          <ShoppingBag className="w-10 h-10 text-muted-foreground/30" />
                        </div>
                      )}
                      {/* NGO badge overlay */}
                      <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-white/90 backdrop-blur-sm rounded-full px-2.5 py-1">
                        <Heart className="w-3 h-3 text-primary fill-primary" />
                        <span className="text-xs font-medium text-primary">{collab.ngo_proceeds_percent}% to {ngoName}</span>
                      </div>
                    </div>
                    {/* Info */}
                    <div className="p-4">
                      <p className="text-xs text-muted-foreground mb-0.5">{product.store?.name}</p>
                      <h3 className="font-serif text-base font-semibold text-foreground mb-2 truncate">{product.name}</h3>
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-foreground">{formatPrice(product.price)}</span>
                        {product.stock > 0 && (
                          <button
                            type="button"
                            onClick={(e) => {
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
                            }}
                            className="text-xs px-3 py-1.5 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 boty-transition"
                          >
                            Add to cart
                          </button>
                        )}
                      </div>
                      {/* NGO info row */}
                      <div className="mt-3 pt-3 border-t border-border/40 flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <Heart className="w-3 h-3 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-foreground truncate">{ngoName}</p>
                          {collab.ngo.ngo_profile?.mission_statement && (
                            <p className="text-xs text-muted-foreground truncate">{collab.ngo.ngo_profile.mission_statement}</p>
                          )}
                        </div>
                        <ExternalLink className="w-3 h-3 text-muted-foreground/50 shrink-0" />
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-card rounded-3xl overflow-hidden boty-shadow animate-pulse">
                <div className="aspect-square bg-muted" />
                <div className="p-5 space-y-2">
                  <div className="h-4 bg-muted rounded w-1/2" />
                  <div className="h-5 bg-muted rounded w-3/4" />
                  <div className="h-4 bg-muted rounded w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="py-24 text-center bg-card rounded-2xl boty-shadow">
            <ShoppingBag className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
            <p className="font-semibold text-foreground">No products found</p>
            <p className="text-sm text-muted-foreground mt-1">
              {search ? 'Try a different search term' : 'Check back soon — stores are being added'}
            </p>
          </div>
        ) : (
          <div ref={gridRef} className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
            {products.map((product, i) => (
              <ProductCard key={product.id} product={product} index={i} isVisible={isVisible} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
