import { Skeleton } from '@/components/ui/skeleton'

export default function DashboardGroupLoading() {
  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar skeleton */}
      <aside className="hidden lg:flex flex-col w-56 xl:w-60 min-h-screen border-r border-border/60 bg-card shrink-0">
        <div className="px-4 py-5 border-b border-border/60 space-y-2">
          <Skeleton className="h-5 w-24 rounded-md" />
          <Skeleton className="h-3 w-32 rounded-md" />
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1.5">
          {Array.from({ length: 9 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-full rounded-lg" />
          ))}
        </nav>
        <div className="px-3 pb-5 space-y-2">
          <Skeleton className="h-9 w-full rounded-lg" />
          <Skeleton className="h-9 w-full rounded-lg" />
        </div>
      </aside>

      {/* Main content skeleton */}
      <div className="flex-1 p-6 space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <Skeleton className="h-7 w-48 rounded-md" />
          <Skeleton className="h-4 w-72 rounded-md" />
        </div>
        {/* Content area */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-card rounded-2xl boty-shadow p-5 space-y-3">
              <Skeleton className="h-5 w-3/4 rounded-md" />
              <Skeleton className="h-4 w-full rounded-md" />
              <Skeleton className="h-4 w-5/6 rounded-md" />
              <Skeleton className="h-8 w-24 rounded-full mt-2" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
