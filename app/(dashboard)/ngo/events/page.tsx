'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useAuth } from '@/hooks/use-auth'
import { getNGOEvents, deleteNGOEvent, getNgoEventRegistrationCounts } from '@/lib/ngo/service'
import { EventCard } from '@/components/ngo/event-card'
import type { NgoEvent } from '@/lib/auth/types'
import { toast } from 'sonner'
import { Calendar, Plus, Loader2, Pencil, Trash2, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function NgoEventsPage() {
  const { user } = useAuth()
  const [events, setEvents] = useState<NgoEvent[]>([])
  const [registrationCounts, setRegistrationCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const fetchEvents = useCallback(async () => {
    if (!user?.id) return
    setLoading(true)
    try {
      const [data, counts] = await Promise.all([
        getNGOEvents(user.id),
        getNgoEventRegistrationCounts(user.id),
      ])
      setEvents(data)
      setRegistrationCounts(counts)
    } catch {
      toast.error('Failed to load events')
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => { fetchEvents() }, [fetchEvents])

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this event?')) return
    setDeletingId(id)
    const { error } = await deleteNGOEvent(id)
    setDeletingId(null)
    if (error) {
      toast.error(error)
    } else {
      toast.success('Event removed')
      fetchEvents()
    }
  }

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="bg-card border-b border-border/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="font-serif text-3xl font-bold text-foreground">Events</h1>
                <p className="text-sm text-muted-foreground">Manage your organisation&apos;s meetups and fundraisers</p>
              </div>
            </div>
            <Link href="/ngo/events/new">
              <Button className="gap-1.5">
                <Plus className="w-4 h-4" />
                New Event
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin" /> Loading events…
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-20">
            <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-30" />
            <h3 className="text-lg font-semibold text-foreground mb-1">No events yet</h3>
            <p className="text-sm text-muted-foreground mb-5">
              Create your first meetup or fundraiser to connect with the community.
            </p>
            <Link href="/ngo/events/new">
              <Button className="gap-1.5">
                <Plus className="w-4 h-4" />
                Create Event
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {events.map((event) => (
              <div key={event.id} className="relative">
                <EventCard
                  event={event}
                  registrationCount={registrationCounts[event.id] ?? 0}
                />
                <div className="absolute top-3 right-3 flex gap-1.5">
                  {/* View registrations */}
                  <Link href={`/ngo/events/${event.id}/registrations`}>
                    <button
                      className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-card/90 hover:bg-card border border-border/40 backdrop-blur-sm transition-colors text-xs text-muted-foreground hover:text-foreground"
                      title="View registrations"
                    >
                      <Users className="w-3.5 h-3.5" />
                      {registrationCounts[event.id] ?? 0}
                    </button>
                  </Link>
                  {/* Edit */}
                  <Link href={`/ngo/events/${event.id}/edit`}>
                    <button className="p-1.5 rounded-lg bg-card/90 hover:bg-card border border-border/40 backdrop-blur-sm transition-colors">
                      <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                  </Link>
                  {/* Delete */}
                  <button
                    onClick={() => handleDelete(event.id)}
                    disabled={deletingId === event.id}
                    className="p-1.5 rounded-lg bg-card/90 hover:bg-destructive/10 border border-border/40 backdrop-blur-sm transition-colors"
                  >
                    {deletingId === event.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5 text-destructive" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
