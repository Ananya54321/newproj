export default function VetPracticeLoading() {
  return (
    <div className="min-h-screen animate-pulse">
      {/* Hero skeleton */}
      <div className="bg-card border-b border-border/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-16 pb-8 sm:py-8">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-muted shrink-0" />
              <div className="space-y-2">
                <div className="h-8 w-48 bg-muted rounded-lg" />
                <div className="h-5 w-28 bg-muted rounded-full" />
              </div>
            </div>
            <div className="h-9 w-36 bg-muted rounded-lg" />
          </div>
          <div className="grid grid-cols-3 gap-4 mt-6">
            {[0, 1, 2].map((i) => (
              <div key={i} className="rounded-2xl bg-muted h-20" />
            ))}
          </div>
        </div>
      </div>

      {/* Tabs + cards skeleton */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-4">
        <div className="h-10 w-64 bg-muted rounded-xl" />
        {[0, 1, 2].map((i) => (
          <div key={i} className="bg-card rounded-2xl p-5 h-28 bg-muted" />
        ))}
      </div>
    </div>
  )
}
