'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { PetForm } from '@/components/pets/pet-form'
import { getPetById, updatePet, type PetFormData } from '@/lib/pets/service'
import type { Pet } from '@/lib/auth/types'
import { Loader2 } from 'lucide-react'

export default function EditPetPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const [pet, setPet] = useState<Pet | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    getPetById(id)
      .then(setPet)
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground gap-2">
        <Loader2 className="w-5 h-5 animate-spin" />
        Loading pet...
      </div>
    )
  }

  if (!pet || pet.owner_id !== user?.id) {
    return (
      <div className="py-20 text-center text-muted-foreground">Pet not found.</div>
    )
  }

  const handleSubmit = async (data: PetFormData) => updatePet(id, data)

  return (
    <div className="max-w-xl mx-auto pt-16 pb-8 sm:py-8 px-4 sm:px-6">
      <h1 className="font-serif text-2xl font-semibold text-foreground mb-6">
        Edit {pet.name}
      </h1>
      <PetForm initial={pet} onSubmit={handleSubmit} submitLabel="Save Changes" />
    </div>
  )
}
