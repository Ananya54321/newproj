import Link from 'next/link'
import Image from 'next/image'
import { MapPin, Stethoscope, Clock, Star } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { VetWithProfile } from '@/lib/auth/types'
import { cn } from '@/lib/utils'

interface VetCardProps {
  vet: VetWithProfile
  className?: string
}

export function VetCard({ vet, className }: VetCardProps) {
  const name = vet.profile?.full_name ?? 'Dr. Unknown'
  const avatar = vet.profile?.avatar_url
  const specialties = vet.specialty ?? []

  return (
    <div
      className={cn(
        'flex flex-col gap-4 p-5 rounded-xl border border-border/60 bg-card',
        'hover:border-primary/40 hover:shadow-sm boty-transition',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-full overflow-hidden bg-muted shrink-0">
          {avatar ? (
            <Image src={avatar} alt={name} width={56} height={56} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Stethoscope className="w-6 h-6 text-muted-foreground" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground truncate">{name}</p>
          {vet.clinic_name && (
            <p className="text-sm text-muted-foreground truncate">{vet.clinic_name}</p>
          )}
          {vet.years_experience != null && (
            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {vet.years_experience} yrs experience
            </p>
          )}
        </div>
        {vet.consultation_fee != null && (
          <div className="shrink-0 text-right">
            <p className="text-sm font-semibold text-primary">
              ${vet.consultation_fee}
            </p>
            <p className="text-xs text-muted-foreground">per visit</p>
          </div>
        )}
      </div>

      {/* Specialties */}
      {specialties.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {specialties.slice(0, 3).map((s) => (
            <Badge key={s} variant="secondary" className="text-xs">
              {s}
            </Badge>
          ))}
          {specialties.length > 3 && (
            <Badge variant="secondary" className="text-xs">
              +{specialties.length - 3} more
            </Badge>
          )}
        </div>
      )}

      {/* Clinic address */}
      {vet.clinic_address && (
        <p className="text-xs text-muted-foreground flex items-start gap-1.5">
          <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          <span className="line-clamp-1">{vet.clinic_address}</span>
        </p>
      )}

      {/* CTA */}
      <Button asChild size="sm" className="mt-auto">
        <Link href={`/vets/${vet.id}`}>View Profile & Book</Link>
      </Button>
    </div>
  )
}
