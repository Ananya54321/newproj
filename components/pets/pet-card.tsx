'use client'

import Link from 'next/link'
import { PetAvatar } from './pet-avatar'
import { formatPetAge } from '@/lib/pets/service'
import type { Pet } from '@/lib/auth/types'
import { cn } from '@/lib/utils'

interface PetCardProps {
  pet: Pet
  className?: string
}

export function PetCard({ pet, className }: PetCardProps) {
  const age = pet.birth_date ? formatPetAge(pet.birth_date) : null

  return (
    <Link
      href={`/pets/${pet.id}`}
      className={cn(
        'group flex items-center gap-4 p-4 rounded-xl border border-border/60 bg-card',
        'hover:border-primary/40 hover:shadow-sm boty-transition',
        className
      )}
    >
      <PetAvatar avatarUrl={pet.avatar_url} species={pet.species} name={pet.name} size="lg" />

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-foreground truncate group-hover:text-primary boty-transition">
          {pet.name}
        </p>
        <p className="text-sm text-muted-foreground capitalize">{pet.species}</p>
        {(pet.breed || age) && (
          <p className="text-xs text-muted-foreground mt-0.5 truncate">
            {[pet.breed, age].filter(Boolean).join(' · ')}
          </p>
        )}
      </div>
    </Link>
  )
}
