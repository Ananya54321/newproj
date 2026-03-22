'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { updateReportStatus } from '@/lib/emergency/service'
import { EMERGENCY_STATUS_CONFIG, type EmergencyStatus } from '@/lib/auth/types'
import { cn } from '@/lib/utils'

interface StatusUpdateButtonProps {
  reportId: string
  currentStatus: EmergencyStatus
  onUpdated?: (status: EmergencyStatus) => void
}

const STATUS_ORDER: EmergencyStatus[] = ['open', 'in_progress', 'resolved', 'closed']

export function StatusUpdateButton({ reportId, currentStatus, onUpdated }: StatusUpdateButtonProps) {
  const [status, setStatus] = useState<EmergencyStatus>(currentStatus)
  const [loading, setLoading] = useState(false)

  const handleChange = async (value: string) => {
    const newStatus = value as EmergencyStatus
    setLoading(true)
    const { error } = await updateReportStatus(reportId, newStatus)
    if (error) {
      toast.error(error)
    } else {
      setStatus(newStatus)
      toast.success('Status updated.')
      onUpdated?.(newStatus)
    }
    setLoading(false)
  }

  const config = EMERGENCY_STATUS_CONFIG[status]

  return (
    <Select value={status} onValueChange={handleChange} disabled={loading}>
      <SelectTrigger
        className={cn(
          'w-40 text-xs font-medium rounded-full border-0 h-7 px-3',
          config.color
        )}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {STATUS_ORDER.map((s) => (
          <SelectItem key={s} value={s} className="text-sm">
            <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', EMERGENCY_STATUS_CONFIG[s].color)}>
              {EMERGENCY_STATUS_CONFIG[s].label}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
