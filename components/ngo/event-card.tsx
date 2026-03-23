import Link from 'next/link'
import { Calendar, MapPin, ExternalLink, Heart, Users } from 'lucide-react'
import type { NgoEvent, NgoEventWithNgo } from '@/lib/auth/types'

interface Props {
  event: NgoEvent | NgoEventWithNgo
  showNgo?: boolean
}

function formatEventDate(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

export function EventCard({ event, showNgo = false }: Props) {
  const ngoEvent = event as NgoEventWithNgo
  const orgName = showNgo
    ? (ngoEvent.ngo?.ngo_profile as { organization_name?: string } | null)?.organization_name ??
      ngoEvent.ngo?.full_name
    : null

  const isFundraiser = event.type === 'fundraiser'
  const raised = Number(event.raised_amount ?? 0)
  const goal = Number(event.goal_amount ?? 0)
  const progress = goal > 0 ? Math.min((raised / goal) * 100, 100) : 0

  return (
    <div className="bg-card rounded-2xl overflow-hidden boty-shadow">
      {event.image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={event.image_url}
          alt={event.title}
          className="w-full h-36 object-cover"
        />
      )}
      <div className="p-5 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${
                  isFundraiser
                    ? 'bg-rose-100 text-rose-700'
                    : 'bg-blue-100 text-blue-700'
                }`}
              >
                {isFundraiser ? <Heart className="w-3 h-3" /> : <Users className="w-3 h-3" />}
                {isFundraiser ? 'Fundraiser' : 'Meetup'}
              </span>
              {orgName && (
                <span className="text-xs text-muted-foreground">{orgName}</span>
              )}
            </div>
            <h3 className="font-semibold text-foreground leading-snug">{event.title}</h3>
          </div>
        </div>

        {event.description && (
          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
            {event.description}
          </p>
        )}

        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="w-3.5 h-3.5 shrink-0" />
            {formatEventDate(event.event_date)}
          </div>
          {event.location && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              {event.location}
            </div>
          )}
        </div>

        {isFundraiser && goal > 0 && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>${raised.toLocaleString()} raised</span>
              <span>Goal: ${goal.toLocaleString()}</span>
            </div>
            <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-rose-500 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {event.registration_url && (
          <a
            href={event.registration_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
          >
            <ExternalLink className="w-3 h-3" />
            Register
          </a>
        )}
      </div>
    </div>
  )
}
