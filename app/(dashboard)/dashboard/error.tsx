'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex items-center justify-center py-20 px-4">
      <div className="bg-card rounded-2xl boty-shadow p-8 max-w-sm w-full text-center">
        <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center mx-auto mb-5">
          <AlertTriangle className="w-6 h-6 text-destructive" />
        </div>
        <h2 className="font-serif text-xl font-semibold text-foreground mb-2">
          Something went wrong
        </h2>
        <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
          {error.message
            ? error.message.length > 100
              ? error.message.slice(0, 100) + '…'
              : error.message
            : 'An unexpected error occurred. Please try again.'}
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
          <Button onClick={reset} size="sm" variant="default">
            Try again
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href="/dashboard">Go to Dashboard</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
