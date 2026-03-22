import { Skeleton } from '@/components/ui/skeleton'

export default function NGOsLoading() {
  return (
    <div className="min-h-screen py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <Skeleton className="h-8 w-44 rounded-md" />
          <Skeleton className="h-4 w-64 rounded-md" />
        </div>

        {/* Search bar */}
        <Skeleton className="h-10 w-full max-w-sm rounded-full" />

        {/* NGO list */}
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-card rounded-2xl boty-shadow p-5">
              <div className="flex items-start gap-4">
                <Skeleton className="h-14 w-14 rounded-2xl shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1.5">
                      <Skeleton className="h-5 w-40 rounded-md" />
                      <Skeleton className="h-3 w-24 rounded-md" />
                    </div>
                    <Skeleton className="h-8 w-24 rounded-full shrink-0" />
                  </div>
                  <Skeleton className="h-4 w-full rounded-md" />
                  <Skeleton className="h-4 w-4/5 rounded-md" />
                  <div className="flex items-center gap-2 pt-1">
                    <Skeleton className="h-6 w-20 rounded-full" />
                    <Skeleton className="h-6 w-16 rounded-full" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
