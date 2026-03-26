import { notFound, redirect } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, MapPin, User, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { StatusUpdateButton } from '@/components/emergency/status-update-button'
import { getServerUser, createServerSupabaseClient } from '@/lib/supabase/server'
import { getReportById, formatReportDate } from '@/lib/emergency/service'
import {
  EMERGENCY_CATEGORY_CONFIG,
  EMERGENCY_STATUS_CONFIG,
} from '@/lib/auth/types'
import { cn } from '@/lib/utils'

export const metadata = { title: 'Emergency Report — Furever' }

interface Props {
  params: Promise<{ id: string }>
}

export default async function EmergencyReportDetailPage({ params }: Props) {
  const { id } = await params
  const user = await getServerUser()
  if (!user) redirect('/login')

  const client = await createServerSupabaseClient()
  const report = await getReportById(id, client)
  if (!report) notFound()

  const categoryConfig = EMERGENCY_CATEGORY_CONFIG[report.category]
  const statusConfig = EMERGENCY_STATUS_CONFIG[report.status]
  const isOwner = report.reporter_id === user.id
  const reportedAt = new Date(report.created_at).toLocaleString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true,
  })

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 sm:px-6 space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href="/emergency" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
        </Button>
      </div>

      {/* Header */}
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <span className={cn('inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium', categoryConfig.color)}>
            {categoryConfig.label}
          </span>
          <span className={cn('inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium', statusConfig.color)}>
            {statusConfig.label}
          </span>
        </div>

        <h1 className="font-serif text-2xl font-semibold text-foreground">{report.title}</h1>

        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <MapPin className="w-4 h-4" />
            {report.location}
          </span>
          <span className="flex items-center gap-1.5">
            <User className="w-4 h-4" />
            {report.reporter?.full_name ?? 'Anonymous'}
          </span>
          <span className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4" />
            {reportedAt}
          </span>
        </div>
      </div>

      {/* Images */}
      {report.image_urls && report.image_urls.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {report.image_urls.map((url, i) => (
            <div key={i} className="aspect-video rounded-xl overflow-hidden bg-muted">
              <Image
                src={url}
                alt={`Photo ${i + 1}`}
                width={640}
                height={360}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
      )}

      {/* Description */}
      {report.description && (
        <div className="p-5 rounded-xl border border-border/60 bg-card">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Description</p>
          <p className="text-sm text-foreground whitespace-pre-wrap">{report.description}</p>
        </div>
      )}

      {/* Status update (owner only) */}
      {isOwner && (
        <div className="flex items-center gap-3 p-4 rounded-xl border border-border/60 bg-card">
          <p className="text-sm text-muted-foreground">Update status:</p>
          <StatusUpdateButton reportId={report.id} currentStatus={report.status} />
        </div>
      )}
    </div>
  )
}
