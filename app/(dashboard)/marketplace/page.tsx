'use client'

import { useState, useEffect, useRef } from 'react'
import { SlidersHorizontal, X, Search, ShoppingBag } from 'lucide-react'
import { ProductCard } from '@/components/marketplace/product-card'
import { getProducts } from '@/lib/marketplace/service'
import { PRODUCT_CATEGORIES } from '@/lib/auth/types'
import type { ProductWithStore, ProductCategory } from '@/lib/auth/types'

const ALL_CATEGORIES = [{ value: 'all', label: 'All Products' }, ...PRODUCT_CATEGORIES]

export default function MarketplacePage() {
  const [products, setProducts] = useState<ProductWithStore[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | 'all'>('all')
  const [search, setSearch] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const gridRef = useRef<HTMLDivElement>(null)

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
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex items-start justify-between gap-4 flex-wrap">
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
            <div className="relative shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                placeholder="Search products…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2.5 rounded-xl bg-background border border-border/60 text-sm outline-none focus:ring-2 focus:ring-primary/30 w-64"
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

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
              {search ? 'Try a different search term' : 'Check back soon - stores are being added'}
            </p>
          </div>
        ) : (
          <div ref={gridRef} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product, i) => (
              <ProductCard key={product.id} product={product} index={i} isVisible={isVisible} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
