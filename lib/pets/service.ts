import { supabaseClient } from '@/lib/supabase/client'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Pet } from '@/lib/auth/types'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PetFormData {
  name: string
  species: string
  breed?: string | null
  birth_date?: string | null
  weight_kg?: number | null
  medical_notes?: string | null
  avatar_url?: string | null
}

// ─── Read ─────────────────────────────────────────────────────────────────────

export async function getUserPets(
  userId: string,
  client: SupabaseClient = supabaseClient
): Promise<Pet[]> {
  const { data, error } = await client
    .from('pets')
    .select('*')
    .eq('owner_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []) as Pet[]
}

export async function getPetById(
  petId: string,
  client: SupabaseClient = supabaseClient
): Promise<Pet | null> {
  const { data, error } = await client
    .from('pets')
    .select('*')
    .eq('id', petId)
    .single()

  if (error) return null
  return data as Pet
}

// ─── Write ────────────────────────────────────────────────────────────────────

export async function createPet(
  data: PetFormData,
  ownerId: string
): Promise<{ pet: Pet | null; error: string | null }> {
  const { data: created, error } = await supabaseClient
    .from('pets')
    .insert({
      owner_id: ownerId,
      name: data.name.trim(),
      species: data.species,
      breed: data.breed?.trim() || null,
      birth_date: data.birth_date || null,
      weight_kg: data.weight_kg ?? null,
      medical_notes: data.medical_notes?.trim() || null,
      avatar_url: data.avatar_url ?? null,
    })
    .select()
    .single()

  if (error) return { pet: null, error: error.message }
  return { pet: created as Pet, error: null }
}

export async function updatePet(
  petId: string,
  data: Partial<PetFormData>
): Promise<{ error: string | null }> {
  const { error } = await supabaseClient
    .from('pets')
    .update({
      ...(data.name !== undefined && { name: data.name.trim() }),
      ...(data.species !== undefined && { species: data.species }),
      ...(data.breed !== undefined && { breed: data.breed?.trim() || null }),
      ...(data.birth_date !== undefined && { birth_date: data.birth_date || null }),
      ...(data.weight_kg !== undefined && { weight_kg: data.weight_kg ?? null }),
      ...(data.medical_notes !== undefined && { medical_notes: data.medical_notes?.trim() || null }),
      ...(data.avatar_url !== undefined && { avatar_url: data.avatar_url }),
    })
    .eq('id', petId)

  return { error: error?.message ?? null }
}

export async function deletePet(petId: string): Promise<{ error: string | null }> {
  const { error } = await supabaseClient.from('pets').delete().eq('id', petId)
  return { error: error?.message ?? null }
}

// ─── Avatar upload ────────────────────────────────────────────────────────────

/** Upload a pet avatar via Cloudinary. */
export async function uploadPetAvatar(
  file: File,
  petId: string
): Promise<{ url: string | null; error: string | null }> {
  const { uploadToCloudinary } = await import('@/lib/cloudinary/upload')
  const { url, error: uploadError } = await uploadToCloudinary(file, `pets/${petId}`)
  if (uploadError || !url) return { url: null, error: uploadError ?? 'Upload failed' }

  const { error: updateError } = await supabaseClient
    .from('pets')
    .update({ avatar_url: url })
    .eq('id', petId)

  if (updateError) return { url: null, error: updateError.message }
  return { url, error: null }
}

// ─── Utilities ────────────────────────────────────────────────────────────────

export function formatPetAge(birthDate: string | null): string {
  if (!birthDate) return 'Unknown age'

  const birth = new Date(birthDate)
  const now = new Date()

  const months =
    (now.getFullYear() - birth.getFullYear()) * 12 +
    (now.getMonth() - birth.getMonth())

  if (months < 1) return 'Less than 1 month'
  if (months < 12) return `${months} month${months !== 1 ? 's' : ''}`

  const years = Math.floor(months / 12)
  const rem = months % 12

  return rem > 0
    ? `${years} yr${years !== 1 ? 's' : ''} ${rem} mo`
    : `${years} year${years !== 1 ? 's' : ''}`
}
