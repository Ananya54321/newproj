'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/use-auth'
import { createNGOEvent } from '@/lib/ngo/service'
import { EventForm } from '@/components/ngo/event-form'
import type { NgoEventFormData } from '@/lib/ngo/service'
import { toast } from 'sonner'
import { ArrowLeft, Calendar } from 'lucide-react'

export default function NewNgoEventPage() {
  const { user } = useAuth()
  const router = useRouter()

  const handleSubmit = async (data: NgoEventFormData) => {
    if (!user?.id) return
    const { error } = await createNGOEvent(data, user.id)
    if (error) {
      toast.error(error)
    } else {
      toast.success('Event created')
      router.push('/ngo/events')
    }
  }

  return (
    <div className="min-h-screen">
      <div className="bg-card border-b border-border/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-16 pb-8 sm:py-8">
          <div className="flex items-center gap-3">
            <Link href="/ngo/events" className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="font-serif text-3xl font-bold text-foreground">New Event</h1>
              <p className="text-sm text-muted-foreground">Create a meetup or fundraiser</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-16 pb-8 sm:py-8">
        <div className="bg-card rounded-2xl p-6 boty-shadow">
          <EventForm onSubmit={handleSubmit} submitLabel="Create Event" />
        </div>
      </div>
    </div>
  )
}
