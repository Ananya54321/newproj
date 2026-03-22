'use client'

import Image from 'next/image'
import { CalendarDays, Clock, Stethoscope, PawPrint } from 'lucide-react'
import { AppointmentStatusBadge } from './appointment-status-badge'
import { Button } from '@/components/ui/button'
import { formatAppointmentDateTime } from '@/lib/vets/service'
import { CONSULTATION_TYPE_CONFIG } from '@/lib/auth/types'
import type { AppointmentStatus, AppointmentWithRelations } from '@/lib/auth/types'
import { cn } from '@/lib/utils'

interface AppointmentCardProps {
  appointment: AppointmentWithRelations
  viewAs?: 'user' | 'vet'
  onStatusChange?: (id: string, status: AppointmentStatus) => void
  className?: string
}

export function AppointmentCard({
  appointment,
  viewAs = 'user',
  onStatusChange,
  className,
}: AppointmentCardProps) {
  const typeConfig = CONSULTATION_TYPE_CONFIG[appointment.consultation_type]
  const counterpart =
    viewAs === 'user' ? appointment.vet_profile : appointment.user_profile

  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row gap-4 p-5 rounded-xl border border-border/60 bg-card',
        className
      )}
    >
      {/* Avatar */}
      <div className="w-12 h-12 rounded-full overflow-hidden bg-muted shrink-0">
        {counterpart?.avatar_url ? (
          <Image
            src={counterpart.avatar_url}
            alt={counterpart.full_name ?? ''}
            width={48}
            height={48}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Stethoscope className="w-5 h-5 text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Details */}
      <div className="flex-1 space-y-2 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-semibold text-foreground truncate">
            {counterpart?.full_name ?? 'Unknown'}
          </p>
          <AppointmentStatusBadge status={appointment.status} />
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <CalendarDays className="w-3.5 h-3.5" />
            {formatAppointmentDateTime(appointment.scheduled_at)}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            {appointment.duration_minutes} min
          </span>
          <span>{typeConfig.icon} {typeConfig.label}</span>
        </div>

        {appointment.pet && (
          <p className="text-sm text-muted-foreground flex items-center gap-1.5">
            <PawPrint className="w-3.5 h-3.5" />
            {appointment.pet.name} ({appointment.pet.species})
          </p>
        )}

        {appointment.notes && (
          <p className="text-sm text-muted-foreground line-clamp-2 italic">
            &ldquo;{appointment.notes}&rdquo;
          </p>
        )}
      </div>

      {/* Actions */}
      {onStatusChange && appointment.status !== 'completed' && appointment.status !== 'cancelled' && (
        <div className="flex flex-wrap gap-2 sm:flex-col sm:justify-start">
          {viewAs === 'vet' && appointment.status === 'pending' && (
            <Button
              size="sm"
              onClick={() => onStatusChange(appointment.id, 'confirmed')}
            >
              Confirm
            </Button>
          )}
          {viewAs === 'vet' && appointment.status === 'confirmed' && (
            <Button
              size="sm"
              onClick={() => onStatusChange(appointment.id, 'completed')}
            >
              Complete
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={() => onStatusChange(appointment.id, 'cancelled')}
            className="text-destructive border-destructive/40 hover:bg-destructive/10"
          >
            Cancel
          </Button>
        </div>
      )}
    </div>
  )
}
