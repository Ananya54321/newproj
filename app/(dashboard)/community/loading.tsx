export default function CommunityLoading() {
  return (
    <div className="min-h-screen animate-pulse">
      <div className="bg-card border-b border-border/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="h-9 w-48 bg-muted rounded-lg" />
              <div className="h-4 w-80 bg-muted rounded" />
            </div>
            <div className="flex gap-2">
              <div className="h-9 w-36 bg-muted rounded-lg" />
              <div className="h-9 w-28 bg-muted rounded-lg" />
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex items-start gap-6">
          <div className="flex-1 space-y-4">
            <div className="h-10 w-52 bg-muted rounded-xl" />
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="bg-card rounded-2xl h-32 bg-muted" />
            ))}
          </div>
          <aside className="hidden lg:block w-72 space-y-4">
            <div className="bg-card rounded-2xl h-52 bg-muted" />
            <div className="bg-card rounded-2xl h-28 bg-muted" />
          </aside>
        </div>
      </div>
    </div>
  )
}
