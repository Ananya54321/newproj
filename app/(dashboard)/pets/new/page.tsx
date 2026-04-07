'use client'

import { PetForm } from '@/components/pets/pet-form'
import { usePets } from '@/hooks/use-pets'
import type { PetFormData } from '@/lib/pets/service'

export default function NewPetPage() {
  const { addPet } = usePets()

  const handleSubmit = async (data: PetFormData) => {
    return addPet(data)
  }

  return (
    <div className="max-w-xl mx-auto pt-16 pb-8 sm:py-8 px-4 sm:px-6">
      <h1 className="font-serif text-2xl font-semibold text-foreground mb-6">Add a New Pet</h1>
      <PetForm onSubmit={handleSubmit} submitLabel="Add Pet" />
    </div>
  )
}
