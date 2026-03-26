import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, MapPin, Clock, Stethoscope } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AppointmentBookingForm } from '@/components/vets/appointment-booking-form'
import { getVetById } from '@/lib/vets/service'
import { getUserPets } from '@/lib/pets/service'
import { getServerUser, createServerSupabaseClient } from '@/lib/supabase/server'

export const metadata = { title: 'Vet Profile - Furever' }

interface Props {
  params: Promise<{ id: string }>
}

export default async function VetProfilePage({ params }: Props) {
  const { id } = await params

  const [client, user] = await Promise.all([
    createServerSupabaseClient(),
    getServerUser(),
  ])

  const vet = await getVetById(id, client)
  if (!vet) notFound()

  const pets = user ? await getUserPets(user.id, client) : []

  const name = vet.profile?.full_name ?? 'Dr. Unknown'
  const avatar = vet.profile?.avatar_url

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6 space-y-8">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href="/vets" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            All Vets
          </Link>
        </Button>

        {/* Profile header */}
        <div className="flex items-start gap-5 p-6 rounded-xl border border-border/60 bg-card">
          <div className="w-20 h-20 rounded-full overflow-hidden bg-muted shrink-0">
            {avatar ? (
              <Image src={avatar} alt={name} width={80} height={80} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Stethoscope className="w-8 h-8 text-muted-foreground" />
              </div>
            )}
          </div>

          <div className="flex-1 space-y-2">
            <div>
              <h1 className="font-serif text-2xl font-semibold text-foreground">{name}</h1>
              {vet.clinic_name && (
                <p className="text-muted-foreground">{vet.clinic_name}</p>
              )}
            </div>

            <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
              {vet.years_experience != null && (
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  {vet.years_experience} years experience
                </span>
              )}
              {vet.clinic_address && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  {vet.clinic_address}
                </span>
              )}
            </div>

            {vet.specialty && vet.specialty.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {vet.specialty.map((s) => (
                  <Badge key={s} variant="secondary">{s}</Badge>
                ))}
              </div>
            )}

            {vet.consultation_fee != null && (
              <p className="text-primary font-semibold">
                ${vet.consultation_fee} per consultation
              </p>
            )}
          </div>
        </div>

        {/* Bio */}
        {vet.bio && (
          <div className="p-5 rounded-xl border border-border/60 bg-card">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">About</p>
            <p className="text-sm text-foreground leading-relaxed">{vet.bio}</p>
          </div>
        )}

        {/* Booking */}
        <div className="p-6 rounded-xl border border-border/60 bg-card">
          <h2 className="font-serif text-lg font-semibold text-foreground mb-5">
            Book an Appointment
          </h2>
          {user ? (
            <AppointmentBookingForm vet={vet} pets={pets} />
          ) : (
            <div className="text-center py-6">
              <p className="text-muted-foreground mb-4">
                You need to be logged in to book an appointment.
              </p>
              <Button asChild>
                <Link href={`/login?redirectTo=/vets/${id}`}>Sign In to Book</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
