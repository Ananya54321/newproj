'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Calendar, MapPin, Heart, Users, Target, CheckCircle2, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import type { NgoEvent, NgoEventWithNgo } from '@/lib/auth/types'
import { formatDonationAmount } from '@/lib/ngo/service'
import { cn } from '@/lib/utils'

interface EventCardProps {
  event: NgoEvent | NgoEventWithNgo
  showNgo?: boolean
  /** Registration count shown in NGO management view */
  registrationCount?: number
  /** Whether the current user is registered (public view) */
  isRegistered?: boolean
  /** Called when user clicks Register / Unregister */
  onRegister?: (registered: boolean) => Promise<void>
}

function hasNgo(e: NgoEvent | NgoEventWithNgo): e is NgoEventWithNgo {
  return 'ngo' in e && !!e.ngo
}

export function EventCard({
  event,
  showNgo = false,
  registrationCount,
  isRegistered,
  onRegister,
}: EventCardProps) {
  const [registering, setRegistering] = useState(false)

  const isFundraiser = event.type === 'fundraiser'
  const eventDate = new Date(event.event_date)
  const ngo = showNgo && hasNgo(event) ? event.ngo : null
  const orgName = ngo?.ngo_profile?.organization_name ?? ngo?.full_name

  const raisedPct =
    isFundraiser && event.goal_amount && event.raised_amount
      ? Math.min(100, Math.round((event.raised_amount / event.goal_amount) * 100))
      : 0

  const handleRegistrationClick = async () => {
    if (!onRegister) return
    setRegistering(true)
    await onRegister(!isRegistered)
    setRegistering(false)
  }

  return (
    <div className="bg-card rounded-2xl overflow-hidden boty-shadow boty-transition hover:shadow-md group">
      {/* Image */}
      <div className="relative h-44 bg-muted overflow-hidden">
        {event.image_url ? (
          <Image
            src={event.image_url}
            alt={event.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-linear-to-br from-primary/10 to-primary/5">
            {isFundraiser
              ? <Heart className="w-12 h-12 text-primary/30" />
              : <Users className="w-12 h-12 text-primary/30" />}
          </div>
        )}

        {/* Type badge */}
        <div className="absolute top-3 left-3">
          <span className={cn(
            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold backdrop-blur-sm',
            isFundraiser
              ? 'bg-rose-500/90 text-white'
              : 'bg-primary/90 text-primary-foreground'
          )}>
            {isFundraiser ? <Heart className="w-3 h-3" /> : <Users className="w-3 h-3" />}
            {isFundraiser ? 'Fundraiser' : 'Meetup'}
          </span>
        </div>

        {/* Date chip */}
        <div className="absolute top-3 right-3 bg-background/90 backdrop-blur-sm rounded-xl px-2.5 py-1.5 text-center min-w-10">
          <p className="text-xs font-bold text-foreground leading-none">{format(eventDate, 'dd')}</p>
          <p className="text-xs text-muted-foreground leading-none mt-0.5">{format(eventDate, 'MMM')}</p>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        {showNgo && orgName && (
          <p className="text-xs text-primary font-medium mb-1 truncate">{orgName}</p>
        )}

        <h3 className="font-serif text-lg font-semibold text-foreground mb-2 line-clamp-2 leading-snug">
          {event.title}
        </h3>

        {event.description && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{event.description}</p>
        )}

        <div className="space-y-1.5 mb-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="w-3.5 h-3.5 shrink-0 text-primary/60" />
            <span>{format(eventDate, 'EEE, dd MMM yyyy · h:mm a')}</span>
          </div>
          {event.location && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <MapPin className="w-3.5 h-3.5 shrink-0 text-primary/60" />
              <span className="truncate">{event.location}</span>
            </div>
          )}
        </div>

        {/* Fundraiser progress */}
        {isFundraiser && event.goal_amount && (
          <div className="mb-4 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1 text-muted-foreground">
                <Target className="w-3 h-3" /> Goal
              </span>
              <span className="font-semibold text-foreground">
                {formatDonationAmount(event.goal_amount)}
              </span>
            </div>
            {event.raised_amount != null && (
              <>
                <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-rose-500 rounded-full transition-all duration-500"
                    style={{ width: `${raisedPct}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{formatDonationAmount(event.raised_amount)} raised</span>
                  <span>{raisedPct}%</span>
                </div>
              </>
            )}
          </div>
        )}

        {/* CTA */}
        {onRegister ? (
          /* Public view — in-app registration */
          <button
            type="button"
            onClick={handleRegistrationClick}
            disabled={registering}
            className={cn(
              'inline-flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl text-sm font-medium boty-transition',
              isRegistered
                ? 'bg-emerald-100 text-emerald-700 hover:bg-rose-100 hover:text-rose-700'
                : 'bg-primary text-primary-foreground hover:bg-primary/90'
            )}
          >
            {registering ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isRegistered ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Registered — click to cancel
              </>
            ) : (
              'Register'
            )}
          </button>
        ) : registrationCount !== undefined ? (
          /* NGO management view — show count */
          <div className="inline-flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl bg-muted/50 text-muted-foreground text-sm">
            <Users className="w-3.5 h-3.5" />
            {registrationCount} {registrationCount === 1 ? 'registration' : 'registrations'}
          </div>
        ) : (
          /* Fallback */
          <div className="inline-flex items-center justify-center w-full py-2.5 rounded-xl bg-muted/50 text-muted-foreground text-sm">
            No registration required
          </div>
        )}
      </div>
    </div>
  )
}
