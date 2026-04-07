import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ReportForm } from '@/components/emergency/report-form'

export const metadata = { title: 'Submit Emergency Report — Furever' }

export default function ReportEmergencyPage() {
  return (
    <div className="max-w-xl mx-auto pt-16 pb-8 sm:py-8 px-4 sm:px-6 space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href="/emergency" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
        </Button>
      </div>

      <div>
        <h1 className="font-serif text-2xl font-semibold text-foreground">
          Report an Emergency
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Report an injured, lost, or sick animal so the community can respond quickly.
        </p>
      </div>

      <ReportForm />
    </div>
  )
}
