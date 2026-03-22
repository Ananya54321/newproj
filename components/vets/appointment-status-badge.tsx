import { Badge } from '@/components/ui/badge'
import { APPOINTMENT_STATUS_CONFIG } from '@/lib/auth/types'
import type { AppointmentStatus } from '@/lib/auth/types'
import { cn } from '@/lib/utils'

interface AppointmentStatusBadgeProps {
  status: AppointmentStatus
  className?: string
}

export function AppointmentStatusBadge({ status, className }: AppointmentStatusBadgeProps) {
  const config = APPOINTMENT_STATUS_CONFIG[status]
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        config.color,
        className
      )}
    >
      {config.label}
    </span>
  )
}
