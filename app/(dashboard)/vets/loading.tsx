import { Skeleton } from '@/components/ui/skeleton'

export default function VetsLoading() {
  return (
    <div className="min-h-screen py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <Skeleton className="h-8 w-48 rounded-md" />
          <Skeleton className="h-4 w-72 rounded-md" />
        </div>

        {/* Search/filter bar */}
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 flex-1 rounded-full" />
          <Skeleton className="h-10 w-32 rounded-full" />
        </div>

        {/* Vet grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-card rounded-2xl boty-shadow p-5 space-y-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-14 w-14 rounded-2xl shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-5 w-3/4 rounded-md" />
                  <Skeleton className="h-3 w-1/2 rounded-md" />
                </div>
              </div>
              <div className="space-y-2">
                <Skeleton className="h-3 w-full rounded-md" />
                <Skeleton className="h-3 w-5/6 rounded-md" />
              </div>
              <div className="flex items-center gap-2 pt-1">
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
              <Skeleton className="h-9 w-full rounded-xl" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
