import { Skeleton } from '@/components/ui/skeleton'

export default function CommunityLoading() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="bg-card border-b border-border/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <Skeleton className="h-8 w-40 rounded-md" />
              <Skeleton className="h-4 w-80 rounded-md" />
            </div>
            <div className="flex gap-2 shrink-0">
              <Skeleton className="h-9 w-32 rounded-full" />
              <Skeleton className="h-9 w-32 rounded-full" />
            </div>
          </div>
          {/* Community pills */}
          <div className="flex items-center gap-2 mt-5 flex-wrap">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-7 w-24 rounded-full" />
            ))}
          </div>
        </div>
      </div>

      {/* Main layout */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex items-start gap-6">
          {/* Feed */}
          <div className="flex-1 min-w-0 space-y-4">
            {/* Sort bar */}
            <div className="flex items-center justify-between">
              <Skeleton className="h-9 w-36 rounded-xl" />
              <Skeleton className="h-4 w-16 rounded-md" />
            </div>
            {/* Post skeletons */}
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-card rounded-2xl boty-shadow p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-7 w-7 rounded-full shrink-0" />
                  <Skeleton className="h-4 w-24 rounded-md" />
                  <Skeleton className="h-4 w-16 rounded-md ml-auto" />
                </div>
                <Skeleton className="h-5 w-3/4 rounded-md" />
                <Skeleton className="h-4 w-full rounded-md" />
                <Skeleton className="h-4 w-5/6 rounded-md" />
                <div className="flex items-center gap-4 pt-1">
                  <Skeleton className="h-4 w-12 rounded-md" />
                  <Skeleton className="h-4 w-16 rounded-md" />
                </div>
              </div>
            ))}
          </div>

          {/* Sidebar */}
          <aside className="hidden lg:block w-72 shrink-0 space-y-4">
            <div className="bg-card rounded-2xl boty-shadow p-5 space-y-3">
              <Skeleton className="h-5 w-40 rounded-md" />
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-8 w-8 rounded-lg shrink-0" />
                  <div className="flex-1 space-y-1">
                    <Skeleton className="h-4 w-3/4 rounded-md" />
                    <Skeleton className="h-3 w-1/2 rounded-md" />
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-card rounded-2xl boty-shadow p-5 space-y-3">
              <Skeleton className="h-5 w-32 rounded-md" />
              <Skeleton className="h-4 w-full rounded-md" />
              <Skeleton className="h-4 w-5/6 rounded-md" />
              <Skeleton className="h-9 w-full rounded-full mt-1" />
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
