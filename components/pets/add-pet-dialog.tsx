'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { PetForm } from './pet-form'
import { usePets } from '@/hooks/use-pets'
import { useRouter } from 'next/navigation'
import type { PetFormData } from '@/lib/pets/service'

interface AddPetDialogProps {
  children?: React.ReactNode
}

export function AddPetDialog({ children }: AddPetDialogProps) {
  const [open, setOpen] = useState(false)
  const { addPet } = usePets()
  const router = useRouter()

  const handleSubmit = async (data: PetFormData) => {
    return addPet(data)
  }

  const handleSuccess = () => {
    setOpen(false)
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children ?? (
          <Button className="gap-2">
            <Plus className="w-4 h-4" /> Add Pet
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">Add a New Pet</DialogTitle>
        </DialogHeader>
        <div className="mt-2">
          <PetForm onSubmit={handleSubmit} submitLabel="Add Pet" onSuccess={handleSuccess} />
        </div>
      </DialogContent>
    </Dialog>
  )
}
