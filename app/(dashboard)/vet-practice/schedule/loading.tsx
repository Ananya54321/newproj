export default function ScheduleLoading() {
  return (
    <div className="min-h-screen animate-pulse">
      <div className="bg-card border-b border-border/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-16 pb-8 sm:py-8">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-muted rounded" />
            <div className="w-10 h-10 rounded-xl bg-muted" />
            <div className="space-y-2">
              <div className="h-8 w-40 bg-muted rounded-lg" />
              <div className="h-4 w-64 bg-muted rounded" />
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        <div className="max-w-xl space-y-5">
          <div className="bg-card rounded-2xl p-6 h-64 bg-muted" />
          <div className="bg-card rounded-2xl p-6 h-40 bg-muted" />
          <div className="h-11 bg-muted rounded-xl" />
        </div>
      </div>
    </div>
  )
}
