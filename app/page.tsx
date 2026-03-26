import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getProducts } from '@/lib/marketplace/service'
import type { ProductWithStore } from '@/lib/auth/types'
import { Header } from "@/components/boty/header"
import { Hero } from "@/components/boty/hero"
import { TrustBadges } from "@/components/boty/trust-badges"
import { FeatureSection } from "@/components/boty/feature-section"
import { ProductGrid } from "@/components/boty/product-grid"
import { Testimonials } from "@/components/boty/testimonials"
import { Newsletter } from "@/components/boty/newsletter"
import { Footer } from "@/components/boty/footer"

export default async function HomePage() {
  const supabase = await createServerSupabaseClient()
  let homeProducts: ProductWithStore[] = []
  try {
    const all = await getProducts({}, supabase)
    homeProducts = all.filter(p =>
      p.category === 'food' || p.category === 'toys' || p.category === 'health'
    ).slice(0, 12)
  } catch {
    // leave empty — grid shows placeholder state
  }

  return (
    <main>
      <Header />
      <Hero />
      <TrustBadges />
      <ProductGrid products={homeProducts} />
      <FeatureSection />
      <Testimonials />
      <Newsletter />
      <Footer />
    </main>
  )
}
