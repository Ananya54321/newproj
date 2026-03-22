'use client'

import { useState } from 'react'
import { ReportCard } from './report-card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useEmergencyRealtime } from '@/hooks/use-emergency-realtime'
import {
  EMERGENCY_STATUS_CONFIG,
  EMERGENCY_CATEGORY_CONFIG,
  type EmergencyCategory,
  type EmergencyStatus,
} from '@/lib/auth/types'

export function RealtimeFeed() {
  const [statusFilter, setStatusFilter] = useState<EmergencyStatus | 'all'>('all')
  const [categoryFilter, setCategoryFilter] = useState<EmergencyCategory | 'all'>('all')

  const { reports, loading, error, reload } = useEmergencyRealtime({
    status: statusFilter === 'all' ? undefined : statusFilter,
    category: categoryFilter === 'all' ? undefined : categoryFilter,
  })

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as EmergencyStatus | 'all')}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {(Object.entries(EMERGENCY_STATUS_CONFIG) as [EmergencyStatus, { label: string; color: string }][]).map(
              ([value, config]) => (
                <SelectItem key={value} value={value}>
                  {config.label}
                </SelectItem>
              )
            )}
          </SelectContent>
        </Select>

        <Select
          value={categoryFilter}
          onValueChange={(v) => setCategoryFilter(v as EmergencyCategory | 'all')}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {(Object.entries(EMERGENCY_CATEGORY_CONFIG) as [EmergencyCategory, { label: string; color: string }][]).map(
              ([value, config]) => (
                <SelectItem key={value} value={value}>
                  {config.label}
                </SelectItem>
              )
            )}
          </SelectContent>
        </Select>

        <Button variant="ghost" size="sm" onClick={reload} disabled={loading}>
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>

        <p className="text-sm text-muted-foreground ml-auto">
          {loading ? 'Loading...' : `${reports.length} report${reports.length !== 1 ? 's' : ''}`}
        </p>
      </div>

      {/* Content */}
      {loading && reports.length === 0 ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
          <Loader2 className="w-5 h-5 animate-spin" />
          Loading reports...
        </div>
      ) : error ? (
        <div className="py-10 text-center text-destructive">{error}</div>
      ) : reports.length === 0 ? (
        <div className="py-10 text-center text-muted-foreground">
          No emergency reports found.
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => (
            <ReportCard key={report.id} report={report} />
          ))}
        </div>
      )}
    </div>
  )
}
