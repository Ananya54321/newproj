import { supabaseClient } from '@/lib/supabase/client'
import type {
  Appointment,
  AppointmentStatus,
  AppointmentWithRelations,
  ConsultationType,
  VetWithProfile,
  VeterinarianProfile,
} from '@/lib/auth/types'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AppointmentFormData {
  vet_id: string
  pet_id: string | null
  scheduled_at: string // ISO string
  consultation_type: ConsultationType
  duration_minutes: number
  notes?: string
}

export interface VetUpdateData {
  clinic_name?: string | null
  clinic_address?: string | null
  consultation_fee?: number | null
  available_hours?: Record<string, [string, string] | null> | null
  bio?: string | null
  specialty?: string[] | null
  years_experience?: number | null
  social_links?: Record<string, string> | null
}

// ─── Vets ─────────────────────────────────────────────────────────────────────

const VET_SELECT = `
  id,
  license_number,
  specialty,
  years_experience,
  clinic_name,
  clinic_address,
  consultation_fee,
  available_hours,
  bio,
  social_links,
  verified_at,
  profile:profiles!veterinarians_id_fkey (
    id, full_name, avatar_url, email,
    role, verification_status,
    address, latitude, longitude
  )
`

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeVet(row: any): VetWithProfile {
  return {
    id: row.id,
    license_number: row.license_number,
    specialty: row.specialty,
    years_experience: row.years_experience,
    clinic_name: row.clinic_name,
    clinic_address: row.clinic_address,
    consultation_fee: row.consultation_fee,
    available_hours: row.available_hours as VetWithProfile['available_hours'],
    bio: row.bio,
    social_links: row.social_links ?? null,
    verified_at: row.verified_at,
    profile: Array.isArray(row.profile) ? row.profile[0] : row.profile,
  } as VetWithProfile
}

/**
 * Returns all approved vets with their profile joined.
 * Designed for use in server components via createServerSupabaseClient().
 * Can also be called from the browser client.
 */
export async function getApprovedVets(
  client = supabaseClient
): Promise<VetWithProfile[]> {
  const { data, error } = await client
    .from('veterinarians')
    .select(VET_SELECT)
    .not('verified_at', 'is', null)
    .order('verified_at', { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []).map(normalizeVet)
}

export async function getVetById(
  vetId: string,
  client = supabaseClient
): Promise<VetWithProfile | null> {
  const { data, error } = await client
    .from('veterinarians')
    .select(VET_SELECT)
    .eq('id', vetId)
    .single()

  if (error || !data) return null
  return normalizeVet(data)
}

/** Returns the vet profile for the current logged-in vet (may or may not be verified). */
export async function getMyVetProfile(
  vetId: string,
  client = supabaseClient
): Promise<VeterinarianProfile | null> {
  const { data, error } = await client
    .from('veterinarians')
    .select('*')
    .eq('id', vetId)
    .maybeSingle()
  if (error || !data) return null
  return data as VeterinarianProfile
}

/** Updates vet-specific profile data. */
export async function updateVetProfile(
  vetId: string,
  updates: VetUpdateData
): Promise<{ error: string | null }> {
  const { error } = await supabaseClient
    .from('veterinarians')
    .update(updates)
    .eq('id', vetId)
  return { error: error?.message ?? null }
}

// ─── Availability ─────────────────────────────────────────────────────────────

const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const

/** Returns available 30-minute slot strings ("HH:MM") for a vet on a given date. */
export async function getAvailableSlots(
  vetId: string,
  date: Date,
  client = supabaseClient
): Promise<string[]> {
  const dayKey = DAY_KEYS[date.getDay()]

  // Fetch vet's available_hours
  const { data: vetData } = await client
    .from('veterinarians')
    .select('available_hours')
    .eq('id', vetId)
    .single()

  const hours = vetData?.available_hours as Record<string, [string, string]> | null
  const range: [string, string] = hours?.[dayKey] ?? ['09:00', '17:00']

  const [startH, startM] = range[0].split(':').map(Number)
  const [endH, endM] = range[1].split(':').map(Number)
  const startMinutes = startH * 60 + startM
  const endMinutes = endH * 60 + endM

  // All possible 30-minute slots
  const allSlots: string[] = []
  for (let m = startMinutes; m < endMinutes; m += 30) {
    const h = Math.floor(m / 60)
    const min = m % 60
    allSlots.push(`${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`)
  }

  // Fetch booked slots for that date
  const dateStart = new Date(date)
  dateStart.setHours(0, 0, 0, 0)
  const dateEnd = new Date(date)
  dateEnd.setHours(23, 59, 59, 999)

  const { data: booked } = await client
    .from('appointments')
    .select('scheduled_at')
    .eq('vet_id', vetId)
    .gte('scheduled_at', dateStart.toISOString())
    .lte('scheduled_at', dateEnd.toISOString())
    .not('status', 'eq', 'cancelled')

  const bookedTimes = new Set(
    (booked ?? []).map((a) => {
      const d = new Date(a.scheduled_at)
      return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
    })
  )

  return allSlots.filter((slot) => !bookedTimes.has(slot))
}

// ─── Appointments ─────────────────────────────────────────────────────────────

export async function createAppointment(
  data: AppointmentFormData,
  userId: string
): Promise<{ id: string | null; error: string | null }> {
  const { data: created, error } = await supabaseClient
    .from('appointments')
    .insert({
      user_id: userId,
      vet_id: data.vet_id,
      pet_id: data.pet_id,
      scheduled_at: data.scheduled_at,
      consultation_type: data.consultation_type,
      duration_minutes: data.duration_minutes,
      notes: data.notes?.trim() || null,
      status: 'pending',
    })
    .select('id')
    .single()

  if (error) return { id: null, error: error.message }
  return { id: created.id, error: null }
}

// appointments.vet_id → veterinarians.id → profiles.id (two hops, must nest)
const APPOINTMENT_SELECT = `
  id, user_id, vet_id, pet_id, scheduled_at,
  status, consultation_type, duration_minutes, notes,
  created_at, updated_at,
  pet:pets(id, name, species, avatar_url),
  vet:veterinarians!appointments_vet_id_fkey(
    id, clinic_name, specialty, consultation_fee,
    profile:profiles!veterinarians_id_fkey(id, full_name, avatar_url)
  ),
  user_profile:profiles!appointments_user_id_fkey(id, full_name, avatar_url)
`

export async function getUserAppointments(
  userId: string,
  client = supabaseClient
): Promise<AppointmentWithRelations[]> {
  const { data, error } = await client
    .from('appointments')
    .select(APPOINTMENT_SELECT)
    .eq('user_id', userId)
    .order('scheduled_at', { ascending: true })

  if (error) throw new Error(error.message)
  return normalizeAppointments(data ?? [])
}

export async function getVetAppointments(
  vetId: string,
  client = supabaseClient
): Promise<AppointmentWithRelations[]> {
  const { data, error } = await client
    .from('appointments')
    .select(APPOINTMENT_SELECT)
    .eq('vet_id', vetId)
    .order('scheduled_at', { ascending: true })

  if (error) throw new Error(error.message)
  return normalizeAppointments(data ?? [])
}

export async function updateAppointmentStatus(
  appointmentId: string,
  status: AppointmentStatus
): Promise<{ error: string | null }> {
  const { error } = await supabaseClient
    .from('appointments')
    .update({ status })
    .eq('id', appointmentId)

  return { error: error?.message ?? null }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeAppointments(rows: any[]): AppointmentWithRelations[] {
  return rows.map((row) => {
    const vet = Array.isArray(row.vet) ? row.vet[0] ?? null : row.vet ?? null
    const vetProfile = vet
      ? (Array.isArray(vet.profile) ? vet.profile[0] ?? null : vet.profile ?? null)
      : null
    return {
      ...row,
      pet: Array.isArray(row.pet) ? row.pet[0] ?? null : row.pet ?? null,
      vet_profile: vetProfile,
      vet_details: {
        clinic_name: vet?.clinic_name ?? null,
        specialty: vet?.specialty ?? null,
        consultation_fee: vet?.consultation_fee ?? null,
      },
      user_profile: Array.isArray(row.user_profile)
        ? row.user_profile[0] ?? null
        : row.user_profile ?? null,
    }
  }) as AppointmentWithRelations[]
}

/** Splits appointments into upcoming (future) and past (in the past). */
export function splitAppointments(appointments: AppointmentWithRelations[]) {
  const now = new Date()
  const upcoming = appointments.filter(
    (a) =>
      new Date(a.scheduled_at) >= now &&
      (a.status === 'pending' || a.status === 'confirmed')
  )
  const past = appointments.filter(
    (a) =>
      new Date(a.scheduled_at) < now ||
      a.status === 'completed' ||
      a.status === 'cancelled'
  )
  return { upcoming, past }
}

/** Format scheduled_at as a readable date+time string. */
export function formatAppointmentDateTime(isoString: string): string {
  const d = new Date(isoString)
  return d.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

// Suppress unused import warning
void (undefined as unknown as Appointment)
