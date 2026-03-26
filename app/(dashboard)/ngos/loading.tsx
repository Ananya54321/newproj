export default function NGOsLoading() {
  return (
    <div className="min-h-screen animate-pulse">
      <div className="bg-card border-b border-border/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-muted shrink-0" />
              <div className="space-y-2">
                <div className="h-9 w-44 bg-muted rounded-lg" />
                <div className="h-4 w-72 bg-muted rounded" />
              </div>
            </div>
            <div className="h-10 w-64 bg-muted rounded-xl" />
          </div>
        </div>
      </div>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-5">
        <div className="h-10 w-52 bg-muted rounded-xl" />
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="bg-card rounded-2xl h-24 bg-muted" />
        ))}
      </div>
    </div>
  )
}
