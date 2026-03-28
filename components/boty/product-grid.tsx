"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import { ShoppingBag } from "lucide-react"
import { useCart } from "./cart-context"
import type { ProductWithStore } from "@/lib/auth/types"
import { formatPrice } from "@/lib/marketplace/service"

type Category = "food" | "toys" | "health"

const categories = [
  { value: "food" as Category, label: "Food" },
  { value: "toys" as Category, label: "Toys" },
  { value: "health" as Category, label: "Health" }
]

interface ProductGridProps {
  products?: ProductWithStore[]
}

export function ProductGrid({ products = [] }: ProductGridProps) {
  const [selectedCategory, setSelectedCategory] = useState<Category>("food")
  const [isVisible, setIsVisible] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [headerVisible, setHeaderVisible] = useState(false)
  const gridRef = useRef<HTMLDivElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)
  const { addItem } = useCart()

  const filteredProducts = products
    .filter(p => p.category === selectedCategory)
    .slice(0, 4)

  const handleCategoryChange = (category: Category) => {
    if (category !== selectedCategory) {
      setIsTransitioning(true)
      setTimeout(() => {
        setSelectedCategory(category)
        setTimeout(() => {
          setIsTransitioning(false)
        }, 50)
      }, 300)
    }
  }

  useEffect(() => {
    const gridObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.1 }
    )

    const headerObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHeaderVisible(true)
        }
      },
      { threshold: 0.1 }
    )

    if (gridRef.current) {
      gridObserver.observe(gridRef.current)
    }

    if (headerRef.current) {
      headerObserver.observe(headerRef.current)
    }

    return () => {
      if (gridRef.current) {
        gridObserver.unobserve(gridRef.current)
      }
      if (headerRef.current) {
        headerObserver.unobserve(headerRef.current)
      }
    }
  }, [])

  return (
    <section className="py-24 bg-card">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Header */}
        <div ref={headerRef} className="text-center mb-16">
          <span className={`text-sm tracking-[0.3em] uppercase text-primary mb-4 block ${headerVisible ? 'animate-blur-in opacity-0' : 'opacity-0'}`} style={headerVisible ? { animationDelay: '0.2s', animationFillMode: 'forwards' } : {}}>
            Marketplace
          </span>
          <h2 className={`font-serif leading-tight text-foreground mb-4 text-balance text-7xl ${headerVisible ? 'animate-blur-in opacity-0' : 'opacity-0'}`} style={headerVisible ? { animationDelay: '0.4s', animationFillMode: 'forwards' } : {}}>
            Pet Essentials
          </h2>
          <p className={`text-lg text-muted-foreground max-w-md mx-auto ${headerVisible ? 'animate-blur-in opacity-0' : 'opacity-0'}`} style={headerVisible ? { animationDelay: '0.6s', animationFillMode: 'forwards' } : {}}>
            Carefully selected products for every stage of your pet&apos;s life
          </p>
        </div>

        {/* Segmented Control */}
        <div className="flex justify-center mb-12">
          <div className="inline-flex bg-background rounded-full p-1 gap-1 relative">
            {/* Animated background slide */}
            <div
              className="absolute top-1 bottom-1 bg-foreground rounded-full transition-all duration-300 ease-out shadow-sm"
              style={{
                left: selectedCategory === 'food' ? '4px' : selectedCategory === 'toys' ? 'calc(33.333% + 2px)' : 'calc(66.666%)',
                width: 'calc(33.333% - 4px)'
              }}
            />
            {categories.map((category) => (
              <button
                key={category.value}
                type="button"
                onClick={() => handleCategoryChange(category.value)}
                className={`relative z-10 px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
                  selectedCategory === category.value
                    ? "text-background"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        <div
          ref={gridRef}
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {filteredProducts.length === 0 ? (
            <div className="col-span-full text-center py-16 text-muted-foreground text-sm">
              No products in this category yet.
            </div>
          ) : (
            filteredProducts.map((product, index) => (
              <Link
                key={`${selectedCategory}-${product.id}`}
                href={`/marketplace/${product.store.slug}/${product.id}`}
                className={`group transition-all duration-500 ease-out ${
                  isVisible && !isTransitioning ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
                }`}
                style={{ transitionDelay: isTransitioning ? '0ms' : `${index * 80}ms` }}
              >
                <div className="bg-background rounded-3xl overflow-hidden boty-shadow boty-transition group-hover:scale-[1.02]">
                  {/* Image */}
                  <div className="relative aspect-square bg-muted overflow-hidden">
                    <Image
                      src={product.images?.[0] ?? "/placeholder.svg"}
                      alt={product.name}
                      fill
                      className="object-cover boty-transition group-hover:scale-105"
                    />
                    {/* Quick add button */}
                    <button
                      type="button"
                      className="absolute bottom-4 right-4 w-10 h-10 rounded-full bg-background/90 backdrop-blur-sm flex items-center justify-center opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 boty-transition boty-shadow"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        addItem({
                          id: product.id,
                          name: product.name,
                          description: product.description ?? '',
                          price: product.price,
                          image: product.images?.[0] ?? '/placeholder.svg',
                          stock: product.stock,
                          storeId: product.store.id,
                          storeSlug: product.store.slug ?? undefined,
                        })
                      }}
                      aria-label="Add to cart"
                    >
                      <ShoppingBag className="w-4 h-4 text-foreground" />
                    </button>
                  </div>

                  {/* Info */}
                  <div className="p-5">
                    <h3 className="font-serif text-lg text-foreground mb-1">{product.name}</h3>
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{product.description}</p>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">{formatPrice(product.price)}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>

        {/* View All Button */}
        <div className="text-center mt-12">
          <Link
            href="/marketplace"
            className="inline-flex items-center justify-center gap-2 bg-transparent border border-foreground/20 text-foreground px-8 py-4 rounded-full text-sm tracking-wide boty-transition hover:bg-foreground/5"
          >
            View All Products
          </Link>
        </div>
      </div>
    </section>
  )
}
