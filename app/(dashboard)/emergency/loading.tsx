export default function EmergencyLoading() {
  return (
    <div className="min-h-screen animate-pulse">
      <div className="bg-card border-b border-border/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-16 pb-8 sm:py-8">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-muted shrink-0" />
              <div className="space-y-2">
                <div className="h-9 w-52 bg-muted rounded-lg" />
                <div className="h-4 w-80 bg-muted rounded" />
              </div>
            </div>
            <div className="h-10 w-40 bg-muted rounded-lg" />
          </div>
        </div>
      </div>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-4">
        <div className="flex gap-3">
          <div className="h-10 w-40 bg-muted rounded-lg" />
          <div className="h-10 w-44 bg-muted rounded-lg" />
        </div>
        {[0, 1, 2].map((i) => (
          <div key={i} className="bg-card rounded-2xl h-28 bg-muted" />
        ))}
      </div>
    </div>
  )
}
