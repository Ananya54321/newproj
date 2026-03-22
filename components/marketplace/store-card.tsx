import Image from 'next/image'
import Link from 'next/link'
import { Store as StoreIcon, ArrowRight } from 'lucide-react'
import type { Store } from '@/lib/auth/types'

interface StoreCardProps {
  store: Store
  productCount?: number
}

export function StoreCard({ store, productCount }: StoreCardProps) {
  return (
    <Link href={`/marketplace/${store.slug ?? store.id}`}>
      <div className="bg-card rounded-3xl overflow-hidden boty-shadow boty-transition hover:scale-[1.02] p-6 flex items-center gap-5">
        {/* Logo */}
        <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center overflow-hidden shrink-0">
          {store.logo_url ? (
            <Image src={store.logo_url} alt={store.name} width={64} height={64} className="object-cover w-full h-full" />
          ) : (
            <StoreIcon className="w-7 h-7 text-muted-foreground/50" />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-serif text-lg text-foreground font-semibold truncate">{store.name}</h3>
          {store.description && (
            <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{store.description}</p>
          )}
          {productCount !== undefined && (
            <p className="text-xs text-muted-foreground mt-1">{productCount} product{productCount !== 1 ? 's' : ''}</p>
          )}
        </div>

        <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
      </div>
    </Link>
  )
}
