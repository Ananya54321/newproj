import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PetAvatar } from '@/components/pets/pet-avatar'
import { DeletePetDialog } from '@/components/pets/delete-pet-dialog'
import { getServerUser, createServerSupabaseClient } from '@/lib/supabase/server'
import { getPetById, formatPetAge } from '@/lib/pets/service'

export const metadata = { title: 'Pet Profile — Furever' }

interface Props {
  params: Promise<{ id: string }>
}

export default async function PetDetailPage({ params }: Props) {
  const { id } = await params
  const user = await getServerUser()
  if (!user) redirect('/login')

  const client = await createServerSupabaseClient()
  const pet = await getPetById(id, client)
  if (!pet || pet.owner_id !== user.id) notFound()

  const age = pet.birth_date ? formatPetAge(pet.birth_date) : null

  const details = [
    { label: 'Species', value: pet.species },
    { label: 'Breed', value: pet.breed },
    { label: 'Age', value: age },
    { label: 'Weight', value: pet.weight_kg ? `${pet.weight_kg} kg` : null },
    { label: 'Date of Birth', value: pet.birth_date ? new Date(pet.birth_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : null },
  ].filter((d) => d.value)

  return (
    <div className="max-w-xl mx-auto py-8 px-4 sm:px-6 space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href="/pets" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
        </Button>
      </div>

      {/* Header */}
      <div className="flex items-center gap-5">
        <PetAvatar
          avatarUrl={pet.avatar_url}
          species={pet.species}
          name={pet.name}
          size="xl"
        />
        <div>
          <h1 className="font-serif text-2xl font-semibold text-foreground">{pet.name}</h1>
          <p className="text-muted-foreground capitalize">{pet.species}</p>
        </div>
      </div>

      {/* Details */}
      {details.length > 0 && (
        <div className="grid grid-cols-2 gap-3 p-5 rounded-xl border border-border/60 bg-card">
          {details.map(({ label, value }) => (
            <div key={label}>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
              <p className="text-sm font-medium text-foreground capitalize mt-0.5">{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Medical notes */}
      {pet.medical_notes && (
        <div className="p-5 rounded-xl border border-border/60 bg-card">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Medical Notes</p>
          <p className="text-sm text-foreground whitespace-pre-wrap">{pet.medical_notes}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 flex-wrap">
        <Button asChild variant="outline">
          <Link href={`/pets/${pet.id}/edit`} className="gap-2">
            <Pencil className="w-4 h-4" />
            Edit
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href={`/appointments/new?pet_id=${pet.id}`}>
            Book Appointment
          </Link>
        </Button>
        <DeletePetDialog petId={pet.id} petName={pet.name} />
      </div>
    </div>
  )
}
