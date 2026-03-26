import Link from 'next/link'
import { Plus, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { RealtimeFeed } from '@/components/emergency/realtime-feed'

export const metadata = { title: 'Emergency Reports — Furever' }

export default function EmergencyPage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="bg-card border-b border-border/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center shrink-0 mt-0.5">
                <AlertTriangle className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <h1 className="font-serif text-3xl font-bold text-foreground mb-1.5">Emergency Reports</h1>
                <p className="text-muted-foreground text-sm max-w-lg">
                  Real-time feed of active animal emergencies in the community. Report an animal in distress immediately.
                </p>
              </div>
            </div>
            <Button asChild variant="destructive">
              <Link href="/emergency/report" className="gap-2">
                <Plus className="w-4 h-4" />
                Report Emergency
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        <RealtimeFeed />
      </div>
    </div>
  )
}
