import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Store as StoreIcon, MapPin, ArrowLeft, Package } from 'lucide-react'
import { ProductCard } from '@/components/marketplace/product-card'
import { getStoreBySlug, getStoreProducts } from '@/lib/marketplace/service'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export default async function StorePage({ params }: { params: Promise<{ storeSlug: string }> }) {
  const { storeSlug } = await params
  const client = await createServerSupabaseClient()

  const store = await getStoreBySlug(storeSlug, client)
  if (!store) notFound()

  const products = await getStoreProducts(store.id, client)
  const activeProducts = products.filter((p) => p.is_active)

  const productsWithStore = activeProducts.map((p) => ({
    ...p,
    store: { id: store.id, name: store.name, slug: store.slug, logo_url: store.logo_url },
  }))

  return (
    <div className="min-h-screen">
      <div className="py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          {/* Back link */}
          <Link
            href="/marketplace"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground boty-transition mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Marketplace
          </Link>

          {/* Store header */}
          <div className="bg-card rounded-3xl p-8 boty-shadow mb-10">
            <div className="flex items-start gap-6">
              <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center overflow-hidden shrink-0">
                {store.logo_url ? (
                  <Image src={store.logo_url} alt={store.name} width={80} height={80} className="object-cover w-full h-full" />
                ) : (
                  <StoreIcon className="w-8 h-8 text-muted-foreground/50" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="font-serif text-3xl text-foreground font-semibold">{store.name}</h1>
                {store.description && (
                  <p className="text-muted-foreground mt-2 max-w-xl">{store.description}</p>
                )}
                {store.address && (
                  <div className="flex items-center gap-1.5 mt-3 text-sm text-muted-foreground">
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    <span>{store.address}</span>
                  </div>
                )}
                <p className="text-sm text-muted-foreground mt-2">
                  {activeProducts.length} product{activeProducts.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </div>

          {/* Products */}
          {productsWithStore.length === 0 ? (
            <div className="py-20 text-center">
              <Package className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
              <p className="font-semibold text-foreground">No products yet</p>
              <p className="text-sm text-muted-foreground mt-1">This store hasn't listed any products yet.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {productsWithStore.map((product, i) => (
                <ProductCard key={product.id} product={product} index={i} isVisible />
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  )
}
