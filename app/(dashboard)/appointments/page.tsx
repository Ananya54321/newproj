'use client'

import Link from 'next/link'
import { Plus, CalendarDays } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AppointmentCard } from '@/components/vets/appointment-card'
import { useAppointments } from '@/hooks/use-appointments'
import { useAuth } from '@/hooks/use-auth'
import type { AppointmentStatus } from '@/lib/auth/types'

export default function AppointmentsPage() {
  const { profile } = useAuth()
  const { upcoming, past, loading, error, changeStatus } = useAppointments()
  const isVet = profile?.role === 'veterinarian'

  const handleStatusChange = async (id: string, status: AppointmentStatus) => {
    await changeStatus(id, status)
  }

  if (loading) {
    return (
      <div className="min-h-screen">
        <div className="bg-card border-b border-border/50">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-16 pb-8 sm:py-8 animate-pulse">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-muted shrink-0" />
              <div className="space-y-2">
                <div className="h-7 bg-muted rounded w-48" />
                <div className="h-4 bg-muted rounded w-64" />
              </div>
            </div>
          </div>
        </div>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-3 animate-pulse">
          <div className="h-10 bg-card rounded-xl w-48" />
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-card rounded-2xl p-5 boty-shadow space-y-3">
              <div className="h-4 bg-muted rounded w-1/3" />
              <div className="h-5 bg-muted rounded w-1/2" />
              <div className="h-4 bg-muted rounded w-1/4" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="bg-card border-b border-border/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-16 pb-8 sm:py-8">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <CalendarDays className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="font-serif text-3xl font-bold text-foreground mb-1.5">Appointments</h1>
                <p className="text-muted-foreground text-sm max-w-lg">
                  {upcoming.length} upcoming appointment{upcoming.length !== 1 ? 's' : ''}. {isVet ? 'Manage your consultations.' : 'Book and manage your vet consultations.'}
                </p>
              </div>
            </div>
            {!isVet && (
              <Button asChild>
                <Link href="/appointments/new" className="gap-2">
                  <Plus className="w-4 h-4" />
                  Book
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        {error && <p className="text-sm text-destructive mb-4">{error}</p>}

        <Tabs defaultValue="upcoming">
          <TabsList>
            <TabsTrigger value="upcoming">Upcoming ({upcoming.length})</TabsTrigger>
            <TabsTrigger value="past">Past ({past.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="mt-4 space-y-3">
            {upcoming.length === 0 ? (
              <div className="py-20 text-center bg-card rounded-2xl boty-shadow">
                <CalendarDays className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="font-semibold text-foreground">No upcoming appointments</p>
                {!isVet && (
                  <>
                    <p className="text-sm text-muted-foreground mt-1 mb-4">
                      Browse available vets and book a consultation.
                    </p>
                    <Button asChild>
                      <Link href="/vets">Find a Vet</Link>
                    </Button>
                  </>
                )}
              </div>
            ) : (
              upcoming.map((appt) => (
                <AppointmentCard
                  key={appt.id}
                  appointment={appt}
                  viewAs={isVet ? 'vet' : 'user'}
                  onStatusChange={isVet ? handleStatusChange : undefined}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="past" className="mt-4 space-y-3">
            {past.length === 0 ? (
              <div className="py-16 text-center text-muted-foreground">
                No past appointments.
              </div>
            ) : (
              past.map((appt) => (
                <AppointmentCard
                  key={appt.id}
                  appointment={appt}
                  viewAs={isVet ? 'vet' : 'user'}
                />
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
