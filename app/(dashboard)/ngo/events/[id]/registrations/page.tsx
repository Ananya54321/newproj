'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Users, Loader2, Calendar } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { getNgoEventRegistrations } from '@/lib/ngo/service'
import { supabaseClient } from '@/lib/supabase/client'
import type { NgoEvent, NgoEventRegistrationWithUser } from '@/lib/auth/types'
import { format } from 'date-fns'
import { toast } from 'sonner'

export default function NgoEventRegistrationsPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const [event, setEvent] = useState<NgoEvent | null>(null)
  const [registrations, setRegistrations] = useState<NgoEventRegistrationWithUser[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.id) return
    ;(async () => {
      try {
        const [{ data: ev }, regs] = await Promise.all([
          supabaseClient
            .from('ngo_events')
            .select('*')
            .eq('id', id)
            .eq('ngo_id', user.id)
            .single(),
          getNgoEventRegistrations(id),
        ])
        if (!ev) {
          toast.error('Event not found or access denied')
          return
        }
        setEvent(ev as NgoEvent)
        setRegistrations(regs)
      } catch {
        toast.error('Failed to load registrations')
      } finally {
        setLoading(false)
      }
    })()
  }, [id, user?.id])

  return (
    <div className="min-h-screen">
      <div className="bg-card border-b border-border/50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-16 pb-8 sm:py-8">
          <Link
            href="/ngo/events"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Events
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="font-serif text-2xl font-bold text-foreground">
                {event ? event.title : 'Registrations'}
              </h1>
              {event && (
                <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
                  <Calendar className="w-3.5 h-3.5" />
                  {format(new Date(event.event_date), 'EEE, dd MMM yyyy · h:mm a')}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin" /> Loading…
          </div>
        ) : registrations.length === 0 ? (
          <div className="text-center py-20 bg-card rounded-2xl boty-shadow">
            <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-30" />
            <h3 className="text-lg font-semibold text-foreground mb-1">No registrations yet</h3>
            <p className="text-sm text-muted-foreground">
              Share this event to get people to register.
            </p>
          </div>
        ) : (
          <div className="bg-card rounded-2xl boty-shadow overflow-hidden">
            <div className="px-5 py-4 border-b border-border/50 flex items-center justify-between">
              <h2 className="font-semibold text-foreground">
                {registrations.length} {registrations.length === 1 ? 'Registration' : 'Registrations'}
              </h2>
            </div>
            <ul className="divide-y divide-border/50">
              {registrations.map((reg, i) => (
                <li key={reg.id} className="flex items-center gap-4 px-5 py-4">
                  <span className="text-sm text-muted-foreground w-6 shrink-0">{i + 1}</span>
                  {reg.user?.avatar_url ? (
                    <Image
                      src={reg.user.avatar_url}
                      alt={reg.user.full_name ?? ''}
                      width={36}
                      height={36}
                      className="rounded-full shrink-0"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-muted shrink-0 flex items-center justify-center text-xs font-bold text-muted-foreground">
                      {reg.user?.full_name?.[0]?.toUpperCase() ?? '?'}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground text-sm truncate">
                      {reg.user?.full_name ?? 'Unknown User'}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{reg.user?.email}</p>
                  </div>
                  <p className="text-xs text-muted-foreground shrink-0">
                    {format(new Date(reg.created_at), 'dd MMM yyyy')}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
