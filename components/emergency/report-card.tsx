'use client'

import Link from 'next/link'
import Image from 'next/image'
import { MapPin, User } from 'lucide-react'
import { EMERGENCY_STATUS_CONFIG, EMERGENCY_CATEGORY_CONFIG } from '@/lib/auth/types'
import { formatReportDate } from '@/lib/emergency/service'
import type { EmergencyReportWithReporter } from '@/lib/auth/types'
import { cn } from '@/lib/utils'

interface ReportCardProps {
  report: EmergencyReportWithReporter
  className?: string
}

export function ReportCard({ report, className }: ReportCardProps) {
  const statusConfig = EMERGENCY_STATUS_CONFIG[report.status]
  const categoryConfig = EMERGENCY_CATEGORY_CONFIG[report.category]
  const firstImage = report.image_urls?.[0]

  return (
    <Link
      href={`/emergency/${report.id}`}
      className={cn(
        'group flex gap-4 p-4 rounded-xl border border-border/60 bg-card',
        'hover:border-primary/40 hover:shadow-sm boty-transition',
        className
      )}
    >
      {/* Thumbnail */}
      <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted shrink-0">
        {firstImage ? (
          <Image
            src={firstImage}
            alt={report.title}
            width={64}
            height={64}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-2xl">
            {categoryConfig.label.split(' ')[0]}
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
              categoryConfig.color
            )}
          >
            {categoryConfig.label}
          </span>
          <span
            className={cn(
              'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
              statusConfig.color
            )}
          >
            {statusConfig.label}
          </span>
        </div>

        <p className="font-semibold text-foreground truncate group-hover:text-primary boty-transition">
          {report.title}
        </p>

        {report.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">{report.description}</p>
        )}

        <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            <span className="truncate max-w-48">{report.location}</span>
          </span>
          <span className="flex items-center gap-1">
            <User className="w-3 h-3" />
            {report.reporter?.full_name ?? 'Anonymous'}
          </span>
          <span>{formatReportDate(report.created_at)}</span>
        </div>
      </div>
    </Link>
  )
}
