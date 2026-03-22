'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { getUserPets, createPet, updatePet, deletePet, type PetFormData } from '@/lib/pets/service'
import { supabaseClient } from '@/lib/supabase/client'
import type { Pet } from '@/lib/auth/types'

export function usePets() {
  const { user } = useAuth()
  const [pets, setPets] = useState<Pet[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!user?.id) return
    setLoading(true)
    setError(null)
    try {
      const data = await getUserPets(user.id, supabaseClient)
      setPets(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load pets')
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    load()
  }, [load])

  const addPet = useCallback(async (data: PetFormData) => {
    if (!user?.id) return { error: 'Not authenticated' }
    const result = await createPet(data, user.id)
    if (!result.error) await load()
    return result
  }, [user?.id, load])

  const editPet = useCallback(async (petId: string, data: Partial<PetFormData>) => {
    const result = await updatePet(petId, data)
    if (!result.error) await load()
    return result
  }, [load])

  const removePet = useCallback(async (petId: string) => {
    const result = await deletePet(petId)
    if (!result.error) await load()
    return result
  }, [load])

  return { pets, loading, error, reload: load, addPet, editPet, removePet }
}
