import Link from 'next/link'
import { Plus, PawPrint } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getServerUser, createServerSupabaseClient } from '@/lib/supabase/server'
import { getUserPets } from '@/lib/pets/service'
import { PetCard } from '@/components/pets/pet-card'
import { redirect } from 'next/navigation'

export const metadata = { title: 'My Pets — Furever' }

export default async function PetsPage() {
  const user = await getServerUser()
  if (!user) redirect('/login')

  const client = await createServerSupabaseClient()
  const pets = await getUserPets(user.id, client)

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="bg-card border-b border-border/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <PawPrint className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="font-serif text-3xl font-bold text-foreground mb-1.5">My Pets</h1>
                <p className="text-muted-foreground text-sm max-w-lg">
                  {pets.length} pet{pets.length !== 1 ? 's' : ''} registered. Manage health records and book vet appointments.
                </p>
              </div>
            </div>
            <Button asChild>
              <Link href="/pets/new" className="gap-2">
                <Plus className="w-4 h-4" />
                Add Pet
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        {pets.length === 0 ? (
          <div className="py-20 text-center bg-card rounded-2xl boty-shadow">
            <PawPrint className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
            <p className="font-semibold text-foreground">No pets yet</p>
            <p className="text-sm text-muted-foreground mt-1 mb-5">
              Add your first pet to start tracking health records and booking appointments.
            </p>
            <Button asChild>
              <Link href="/pets/new">Add Your First Pet</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {pets.map((pet) => (
              <PetCard key={pet.id} pet={pet} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
