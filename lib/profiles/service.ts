import { supabaseClient } from '@/lib/supabase/client'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Profile, VeterinarianProfile, NgoProfile, Store } from '@/lib/auth/types'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PublicProfileData {
  profile: Profile
  vet?: VeterinarianProfile | null
  ngo?: NgoProfile | null
  store?: Store | null
}

// ─── Queries ─────────────────────────────────────────────────────────────────

export async function getProfileBySlug(
  slug: string,
  client: SupabaseClient = supabaseClient
): Promise<PublicProfileData | null> {
  const { data, error } = await client
    .from('profiles')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error || !data) return null
  const profile = data as Profile

  const result: PublicProfileData = { profile }

  if (profile.role === 'veterinarian') {
    const { data: vet } = await client
      .from('veterinarians')
      .select('*')
      .eq('id', profile.id)
      .single()
    result.vet = (vet as VeterinarianProfile | null) ?? null
  } else if (profile.role === 'ngo') {
    const { data: ngo } = await client
      .from('ngos')
      .select('*')
      .eq('id', profile.id)
      .single()
    result.ngo = (ngo as NgoProfile | null) ?? null
  } else if (profile.role === 'store_owner') {
    const { data: store } = await client
      .from('stores')
      .select('*')
      .eq('owner_id', profile.id)
      .eq('is_active', true)
      .maybeSingle()
    result.store = (store as Store | null) ?? null
  }

  return result
}

export async function updateProfileSlug(
  userId: string,
  slug: string
): Promise<{ error: string | null }> {
  const clean = slug
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '')

  if (!clean) return { error: 'Slug must only contain letters, numbers, hyphens, and underscores.' }
  if (clean.length < 3) return { error: 'Slug must be at least 3 characters.' }
  if (clean.length > 50) return { error: 'Slug must be 50 characters or fewer.' }

  // Check availability
  const { data: existing } = await supabaseClient
    .from('profiles')
    .select('id')
    .eq('slug', clean)
    .neq('id', userId)
    .maybeSingle()

  if (existing) return { error: 'This username is already taken. Please choose another.' }

  const { error } = await supabaseClient
    .from('profiles')
    .update({ slug: clean })
    .eq('id', userId)

  return { error: error?.message ?? null }
}
