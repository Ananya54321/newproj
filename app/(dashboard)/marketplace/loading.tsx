import { Skeleton } from '@/components/ui/skeleton'

export default function MarketplaceLoading() {
  return (
    <div className="min-h-screen py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        {/* Page header */}
        <div className="text-center mb-12 space-y-3">
          <Skeleton className="h-4 w-28 rounded-full mx-auto" />
          <Skeleton className="h-12 w-64 rounded-md mx-auto" />
          <Skeleton className="h-5 w-72 rounded-md mx-auto" />
        </div>

        {/* Filter bar */}
        <div className="flex items-center justify-between mb-10 pb-6 border-b border-border/50 gap-4">
          <div className="hidden lg:flex items-center gap-2 flex-wrap">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-24 rounded-full" />
            ))}
          </div>
          <Skeleton className="h-9 w-48 rounded-full" />
          <Skeleton className="h-4 w-20 rounded-md" />
        </div>

        {/* Product grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-card rounded-3xl overflow-hidden boty-shadow">
              <Skeleton className="aspect-square w-full rounded-none" />
              <div className="p-5 space-y-2">
                <Skeleton className="h-3 w-1/3 rounded-md" />
                <Skeleton className="h-5 w-3/4 rounded-md" />
                <Skeleton className="h-4 w-full rounded-md" />
                <div className="flex items-center justify-between pt-2">
                  <Skeleton className="h-6 w-16 rounded-md" />
                  <Skeleton className="h-8 w-20 rounded-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
