import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { VetCard } from '@/components/vets/vet-card'
import { getServerUser, createServerSupabaseClient } from '@/lib/supabase/server'
import { getApprovedVets } from '@/lib/vets/service'

export const metadata = { title: 'Book Appointment - Furever' }

export default async function NewAppointmentPage() {
  const user = await getServerUser()
  if (!user) redirect('/login')

  const client = await createServerSupabaseClient()
  const vets = await getApprovedVets(client)

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6 space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href="/appointments" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
        </Button>
      </div>

      <div>
        <h1 className="font-serif text-2xl font-semibold text-foreground">Book an Appointment</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Choose a vet to view their availability and book a slot.
        </p>
      </div>

      {vets.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">
          No approved vets available at the moment. Please check back later.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {vets.map((vet) => (
            <VetCard key={vet.id} vet={vet} />
          ))}
        </div>
      )}
    </div>
  )
}
