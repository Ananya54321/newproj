'use client'

import Image from 'next/image'
import { PawPrint } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SPECIES_OPTIONS } from '@/lib/auth/types'

interface PetAvatarProps {
  avatarUrl?: string | null
  species?: string
  name?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const SIZE = {
  sm:  { container: 'w-8 h-8',   icon: 'w-4 h-4',   text: 'text-base' },
  md:  { container: 'w-12 h-12', icon: 'w-5 h-5',   text: 'text-xl' },
  lg:  { container: 'w-16 h-16', icon: 'w-7 h-7',   text: 'text-2xl' },
  xl:  { container: 'w-24 h-24', icon: 'w-10 h-10',  text: 'text-4xl' },
}

export function PetAvatar({ avatarUrl, species, name, size = 'md', className }: PetAvatarProps) {
  const s = SIZE[size]
  const emoji = SPECIES_OPTIONS.find((o) => o.value === species)?.emoji

  return (
    <div
      className={cn(
        s.container,
        'rounded-full overflow-hidden bg-muted flex items-center justify-center shrink-0',
        className
      )}
    >
      {avatarUrl ? (
        <Image
          src={avatarUrl}
          alt={name ?? 'Pet'}
          width={96}
          height={96}
          className="w-full h-full object-cover"
        />
      ) : emoji ? (
        <span className={s.text}>{emoji}</span>
      ) : (
        <PawPrint className={cn(s.icon, 'text-muted-foreground')} />
      )}
    </div>
  )
}
