'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { getNGOEvents, updateNGOEvent } from '@/lib/ngo/service'
import { EventForm } from '@/components/ngo/event-form'
import type { NgoEventFormData } from '@/lib/ngo/service'
import type { NgoEvent } from '@/lib/auth/types'
import { useAuth } from '@/hooks/use-auth'
import { toast } from 'sonner'
import { ArrowLeft, Calendar, Loader2 } from 'lucide-react'

export default function EditNgoEventPage() {
  const { user } = useAuth()
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const [event, setEvent] = useState<NgoEvent | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchEvent = useCallback(async () => {
    if (!user?.id) return
    setLoading(true)
    const events = await getNGOEvents(user.id)
    const found = events.find((e) => e.id === params.id) ?? null
    setEvent(found)
    setLoading(false)
  }, [user?.id, params.id])

  useEffect(() => { fetchEvent() }, [fetchEvent])

  const handleSubmit = async (data: NgoEventFormData) => {
    if (!params.id) return
    const { error } = await updateNGOEvent(params.id, data)
    if (error) {
      toast.error(error)
    } else {
      toast.success('Event updated')
      router.push('/ngo/events')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 gap-2 text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin" /> Loading event…
      </div>
    )
  }

  if (!event) {
    return (
      <div className="text-center py-20 text-muted-foreground">Event not found.</div>
    )
  }

  return (
    <div className="min-h-screen">
      <div className="bg-card border-b border-border/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex items-center gap-3">
            <Link href="/ngo/events" className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="font-serif text-3xl font-bold text-foreground">Edit Event</h1>
              <p className="text-sm text-muted-foreground">{event.title}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        <div className="max-w-xl bg-card rounded-2xl p-6 boty-shadow">
          <EventForm
            initial={{
              title: event.title,
              description: event.description,
              type: event.type,
              location: event.location,
              event_date: event.event_date,
              image_url: event.image_url,
              registration_url: event.registration_url,
              goal_amount: event.goal_amount,
            }}
            onSubmit={handleSubmit}
            submitLabel="Save Changes"
          />
        </div>
      </div>
    </div>
  )
}
