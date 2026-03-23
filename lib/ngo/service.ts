import { supabaseClient } from '@/lib/supabase/client'
import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  Profile,
  NgoProfile,
  NgoUpdate,
  NgoUpdateWithNgo,
  Donation,
  DonationWithRelations,
  NgoEvent,
  NgoEventWithNgo,
} from '@/lib/auth/types'

// ─── Form data ────────────────────────────────────────────────────────────────

export interface NgoUpdateFormData {
  title: string
  content: string
  image_url?: string | null
}

export interface DonationFormData {
  ngo_id: string
  amount: number
  message?: string | null
  is_anonymous?: boolean
}

// ─── NGO profile queries ──────────────────────────────────────────────────────

export interface NgoWithProfile {
  id: string
  profile: Profile
  ngo_profile: NgoProfile
}

const NGO_PROFILE_SELECT = `
  id,
  full_name,
  avatar_url,
  bio,
  created_at,
  ngo_profile:ngos!ngos_id_fkey(
    organization_name,
    mission_statement,
    website_url,
    address,
    accepts_donations,
    verified_at
  )
`

export async function getApprovedNGOs(
  client: SupabaseClient = supabaseClient
): Promise<(Profile & { ngo_profile: NgoProfile })[]> {
  const { data, error } = await client
    .from('profiles')
    .select(NGO_PROFILE_SELECT)
    .eq('role', 'ngo')
    .eq('verification_status', 'approved')
    .order('full_name')
  if (error) throw error
  return (data ?? []).map(normalizeNgoProfile)
}

export async function getNGOById(
  userId: string,
  client: SupabaseClient = supabaseClient
): Promise<(Profile & { ngo_profile: NgoProfile }) | null> {
  const { data, error } = await client
    .from('profiles')
    .select(NGO_PROFILE_SELECT)
    .eq('id', userId)
    .eq('role', 'ngo')
    .single()
  if (error || !data) return null
  return normalizeNgoProfile(data)
}

// ─── NGO Update queries ───────────────────────────────────────────────────────

export async function getNGOUpdates(
  ngoId: string,
  client: SupabaseClient = supabaseClient
): Promise<NgoUpdate[]> {
  const { data, error } = await client
    .from('ngo_updates')
    .select('*')
    .eq('ngo_id', ngoId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function getAllNGOUpdates(
  client: SupabaseClient = supabaseClient
): Promise<NgoUpdateWithNgo[]> {
  const { data, error } = await client
    .from('ngo_updates')
    .select(`
      *,
      ngo:profiles!ngo_updates_ngo_id_fkey(
        id, full_name, avatar_url,
        ngo_profile:ngos!ngos_id_fkey(organization_name)
      )
    `)
    .order('created_at', { ascending: false })
    .limit(50)
  if (error) throw error
  return (data ?? []).map(normalizeNgoUpdate)
}

// ─── NGO Update mutations ─────────────────────────────────────────────────────

export async function createNGOUpdate(
  data: NgoUpdateFormData,
  ngoId: string
): Promise<{ update: NgoUpdate | null; error: string | null }> {
  const { data: update, error } = await supabaseClient
    .from('ngo_updates')
    .insert({ ...data, ngo_id: ngoId })
    .select()
    .single()
  if (error) return { update: null, error: error.message }
  return { update, error: null }
}

export async function updateNGOUpdate(
  updateId: string,
  data: Partial<NgoUpdateFormData>
): Promise<{ error: string | null }> {
  const { error } = await supabaseClient
    .from('ngo_updates')
    .update(data)
    .eq('id', updateId)
  return { error: error?.message ?? null }
}

export async function deleteNGOUpdate(updateId: string): Promise<{ error: string | null }> {
  const { error } = await supabaseClient.from('ngo_updates').delete().eq('id', updateId)
  return { error: error?.message ?? null }
}

// ─── Donation queries ─────────────────────────────────────────────────────────

export async function getNGODonations(
  ngoId: string,
  client: SupabaseClient = supabaseClient
): Promise<DonationWithRelations[]> {
  const { data, error } = await client
    .from('donations')
    .select(`
      *,
      donor:profiles!donations_donor_id_fkey(id, full_name, avatar_url),
      ngo:profiles!donations_ngo_id_fkey(id, full_name)
    `)
    .eq('ngo_id', ngoId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map(normalizeDonation)
}

export async function getUserDonations(
  userId: string,
  client: SupabaseClient = supabaseClient
): Promise<DonationWithRelations[]> {
  const { data, error } = await client
    .from('donations')
    .select(`
      *,
      donor:profiles!donations_donor_id_fkey(id, full_name, avatar_url),
      ngo:profiles!donations_ngo_id_fkey(id, full_name)
    `)
    .eq('donor_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map(normalizeDonation)
}

// ─── Donation mutations ───────────────────────────────────────────────────────

/** Creates a donation record (pending). Stripe integration to be wired separately. */
export async function createDonation(
  data: DonationFormData,
  donorId: string
): Promise<{ donation: Donation | null; error: string | null }> {
  const { data: donation, error } = await supabaseClient
    .from('donations')
    .insert({
      donor_id: donorId,
      ngo_id: data.ngo_id,
      amount: data.amount,
      message: data.message ?? null,
      is_anonymous: data.is_anonymous ?? false,
      status: 'pending',
    })
    .select()
    .single()
  if (error) return { donation: null, error: error.message }
  return { donation, error: null }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeNgoProfile(raw: any): Profile & { ngo_profile: NgoProfile } {
  const ngo_profile = Array.isArray(raw.ngo_profile) ? raw.ngo_profile[0] : raw.ngo_profile
  return { ...raw, ngo_profile } as Profile & { ngo_profile: NgoProfile }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeNgoUpdate(raw: any): NgoUpdateWithNgo {
  const ngo = Array.isArray(raw.ngo) ? raw.ngo[0] : raw.ngo
  if (ngo) {
    const ngo_profile = Array.isArray(ngo.ngo_profile) ? ngo.ngo_profile[0] : ngo.ngo_profile
    return { ...raw, ngo: { ...ngo, ngo_profile } } as NgoUpdateWithNgo
  }
  return raw as NgoUpdateWithNgo
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeDonation(raw: any): DonationWithRelations {
  const donor = Array.isArray(raw.donor) ? raw.donor[0] : raw.donor
  const ngo = Array.isArray(raw.ngo) ? raw.ngo[0] : raw.ngo
  return { ...raw, donor, ngo } as DonationWithRelations
}

export function formatDonationAmount(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount)
}

// ─── NGO Events ───────────────────────────────────────────────────────────────

export interface NgoEventFormData {
  title: string
  description?: string | null
  type: 'meetup' | 'fundraiser'
  location?: string | null
  event_date: string
  image_url?: string | null
  registration_url?: string | null
  goal_amount?: number | null
}

export async function getNGOEvents(
  ngoId: string,
  client: SupabaseClient = supabaseClient
): Promise<NgoEvent[]> {
  const { data, error } = await client
    .from('ngo_events')
    .select('*')
    .eq('ngo_id', ngoId)
    .eq('is_active', true)
    .order('event_date', { ascending: true })
  if (error) throw error
  return (data ?? []) as NgoEvent[]
}

export async function getUpcomingEvents(
  limit = 20,
  client: SupabaseClient = supabaseClient
): Promise<NgoEventWithNgo[]> {
  const { data, error } = await client
    .from('ngo_events')
    .select(`
      *,
      ngo:profiles!ngo_events_ngo_id_fkey(
        id, full_name, avatar_url,
        ngo_profile:ngos!ngos_id_fkey(organization_name)
      )
    `)
    .eq('is_active', true)
    .gte('event_date', new Date().toISOString())
    .order('event_date', { ascending: true })
    .limit(limit)
  if (error) throw error
  return ((data ?? []) as unknown[]).map((raw) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r = raw as any
    const ngo = Array.isArray(r.ngo) ? r.ngo[0] : r.ngo
    if (ngo) {
      const ngo_profile = Array.isArray(ngo.ngo_profile) ? ngo.ngo_profile[0] : ngo.ngo_profile
      return { ...r, ngo: { ...ngo, ngo_profile } }
    }
    return r
  }) as NgoEventWithNgo[]
}

export async function createNGOEvent(
  data: NgoEventFormData,
  ngoId: string
): Promise<{ event: NgoEvent | null; error: string | null }> {
  const { data: event, error } = await supabaseClient
    .from('ngo_events')
    .insert({ ...data, ngo_id: ngoId })
    .select()
    .single()
  if (error) return { event: null, error: error.message }
  return { event: event as NgoEvent, error: null }
}

export async function updateNGOEvent(
  eventId: string,
  data: Partial<NgoEventFormData>
): Promise<{ error: string | null }> {
  const { error } = await supabaseClient
    .from('ngo_events')
    .update(data)
    .eq('id', eventId)
  return { error: error?.message ?? null }
}

export async function deleteNGOEvent(eventId: string): Promise<{ error: string | null }> {
  const { error } = await supabaseClient
    .from('ngo_events')
    .update({ is_active: false })
    .eq('id', eventId)
  return { error: error?.message ?? null }
}
