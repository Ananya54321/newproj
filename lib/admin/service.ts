import type { SupabaseClient } from '@supabase/supabase-js'

// ─── Admin types ──────────────────────────────────────────────────────────────

export interface AdminStats {
  totalUsers: number
  pendingVets: number
  pendingNGOs: number
  pendingStores: number
  totalEmergencies: number
  activeEmergencies: number
  totalCommunities: number
  totalPosts: number
  totalDonations: number
}

export interface AdminUser {
  id: string
  full_name: string | null
  email: string
  role: string
  verification_status: string | null
  created_at: string
  avatar_url: string | null
}

export interface PendingVet {
  id: string
  full_name: string | null
  email: string
  created_at: string
  avatar_url: string | null
  license_number: string | null
  clinic_name: string | null
  specialty: string[] | null
  years_experience: number | null
}

export interface PendingNGO {
  id: string
  full_name: string | null
  email: string
  created_at: string
  avatar_url: string | null
  organization_name: string | null
  registration_number: string | null
  mission_statement: string | null
}

export interface PendingStore {
  id: string
  name: string
  slug: string | null
  owner_id: string
  owner_name: string | null
  owner_email: string | null
  created_at: string
  description: string | null
}

// ─── Stats ────────────────────────────────────────────────────────────────────

export async function getAdminStats(client: SupabaseClient): Promise<AdminStats> {
  const [
    { count: totalUsers },
    { count: pendingVets },
    { count: pendingNGOs },
    { count: pendingStores },
    { count: totalEmergencies },
    { count: activeEmergencies },
    { count: totalCommunities },
    { count: totalPosts },
    { count: totalDonations },
  ] = await Promise.all([
    client.from('profiles').select('*', { count: 'exact', head: true }),
    client.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'veterinarian').eq('verification_status', 'pending'),
    client.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'ngo').eq('verification_status', 'pending'),
    client.from('stores').select('*', { count: 'exact', head: true }).eq('is_active', false).is('verified_at', null),
    client.from('emergency_reports').select('*', { count: 'exact', head: true }),
    client.from('emergency_reports').select('*', { count: 'exact', head: true }).in('status', ['open', 'in_progress']),
    client.from('communities').select('*', { count: 'exact', head: true }),
    client.from('posts').select('*', { count: 'exact', head: true }),
    client.from('donations').select('*', { count: 'exact', head: true }),
  ])

  return {
    totalUsers: totalUsers ?? 0,
    pendingVets: pendingVets ?? 0,
    pendingNGOs: pendingNGOs ?? 0,
    pendingStores: pendingStores ?? 0,
    totalEmergencies: totalEmergencies ?? 0,
    activeEmergencies: activeEmergencies ?? 0,
    totalCommunities: totalCommunities ?? 0,
    totalPosts: totalPosts ?? 0,
    totalDonations: totalDonations ?? 0,
  }
}

// ─── Users ────────────────────────────────────────────────────────────────────

export async function getUsers(client: SupabaseClient): Promise<AdminUser[]> {
  const { data, error } = await client
    .from('profiles')
    .select('id, full_name, email, role, verification_status, created_at, avatar_url')
    .order('created_at', { ascending: false })

  if (error) return []
  return (data ?? []) as AdminUser[]
}

// ─── Pending verifications ────────────────────────────────────────────────────

export async function getPendingVets(client: SupabaseClient): Promise<PendingVet[]> {
  const { data, error } = await client
    .from('profiles')
    .select(`
      id,
      full_name,
      email,
      created_at,
      avatar_url,
      veterinarians (
        license_number,
        clinic_name,
        specialty,
        years_experience
      )
    `)
    .eq('role', 'veterinarian')
    .eq('verification_status', 'pending')
    .order('created_at', { ascending: true })

  if (error) return []

  return ((data ?? []) as Array<{
    id: string
    full_name: string | null
    email: string
    created_at: string
    avatar_url: string | null
    veterinarians: {
      license_number: string | null
      clinic_name: string | null
      specialty: string[] | null
      years_experience: number | null
    } | null
  }>).map((row) => ({
    id: row.id,
    full_name: row.full_name,
    email: row.email,
    created_at: row.created_at,
    avatar_url: row.avatar_url,
    license_number: row.veterinarians?.license_number ?? null,
    clinic_name: row.veterinarians?.clinic_name ?? null,
    specialty: row.veterinarians?.specialty ?? null,
    years_experience: row.veterinarians?.years_experience ?? null,
  }))
}

export async function getPendingNGOs(client: SupabaseClient): Promise<PendingNGO[]> {
  const { data, error } = await client
    .from('profiles')
    .select(`
      id,
      full_name,
      email,
      created_at,
      avatar_url,
      ngos (
        organization_name,
        registration_number,
        mission_statement
      )
    `)
    .eq('role', 'ngo')
    .eq('verification_status', 'pending')
    .order('created_at', { ascending: true })

  if (error) return []

  return ((data ?? []) as Array<{
    id: string
    full_name: string | null
    email: string
    created_at: string
    avatar_url: string | null
    ngos: {
      organization_name: string
      registration_number: string | null
      mission_statement: string | null
    } | null
  }>).map((row) => ({
    id: row.id,
    full_name: row.full_name,
    email: row.email,
    created_at: row.created_at,
    avatar_url: row.avatar_url,
    organization_name: row.ngos?.organization_name ?? null,
    registration_number: row.ngos?.registration_number ?? null,
    mission_statement: row.ngos?.mission_statement ?? null,
  }))
}

export async function getPendingStores(client: SupabaseClient): Promise<PendingStore[]> {
  const { data, error } = await client
    .from('stores')
    .select(`
      id,
      name,
      slug,
      owner_id,
      created_at,
      description,
      profiles!stores_owner_id_fkey (
        full_name,
        email
      )
    `)
    .eq('is_active', false)
    .is('verified_at', null)
    .order('created_at', { ascending: true })

  if (error) return []

  return ((data ?? []) as Array<{
    id: string
    name: string
    slug: string | null
    owner_id: string
    created_at: string
    description: string | null
    profiles: {
      full_name: string | null
      email: string
    } | null
  }>).map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    owner_id: row.owner_id,
    owner_name: row.profiles?.full_name ?? null,
    owner_email: row.profiles?.email ?? null,
    created_at: row.created_at,
    description: row.description,
  }))
}

// ─── Approval actions ─────────────────────────────────────────────────────────

export async function approveVet(
  vetId: string,
  adminId: string,
  client: SupabaseClient
): Promise<{ error: string | null }> {
  const now = new Date().toISOString()

  const [vetUpdate, profileUpdate] = await Promise.all([
    client
      .from('veterinarians')
      .update({ verified_at: now, verified_by: adminId })
      .eq('id', vetId),
    client
      .from('profiles')
      .update({ verification_status: 'approved' })
      .eq('id', vetId),
  ])

  if (vetUpdate.error) return { error: vetUpdate.error.message }
  if (profileUpdate.error) return { error: profileUpdate.error.message }
  return { error: null }
}

export async function rejectVet(
  vetId: string,
  reason: string,
  adminId: string,
  client: SupabaseClient
): Promise<{ error: string | null }> {
  const [vetUpdate, profileUpdate] = await Promise.all([
    client
      .from('veterinarians')
      .update({ rejection_reason: reason, verified_by: adminId })
      .eq('id', vetId),
    client
      .from('profiles')
      .update({ verification_status: 'rejected' })
      .eq('id', vetId),
  ])

  if (vetUpdate.error) return { error: vetUpdate.error.message }
  if (profileUpdate.error) return { error: profileUpdate.error.message }
  return { error: null }
}

export async function approveNGO(
  ngoId: string,
  adminId: string,
  client: SupabaseClient
): Promise<{ error: string | null }> {
  const now = new Date().toISOString()

  const [ngoUpdate, profileUpdate] = await Promise.all([
    client
      .from('ngos')
      .update({ verified_at: now, verified_by: adminId })
      .eq('id', ngoId),
    client
      .from('profiles')
      .update({ verification_status: 'approved' })
      .eq('id', ngoId),
  ])

  if (ngoUpdate.error) return { error: ngoUpdate.error.message }
  if (profileUpdate.error) return { error: profileUpdate.error.message }
  return { error: null }
}

export async function rejectNGO(
  ngoId: string,
  reason: string,
  adminId: string,
  client: SupabaseClient
): Promise<{ error: string | null }> {
  const [ngoUpdate, profileUpdate] = await Promise.all([
    client
      .from('ngos')
      .update({ rejection_reason: reason, verified_by: adminId })
      .eq('id', ngoId),
    client
      .from('profiles')
      .update({ verification_status: 'rejected' })
      .eq('id', ngoId),
  ])

  if (ngoUpdate.error) return { error: ngoUpdate.error.message }
  if (profileUpdate.error) return { error: profileUpdate.error.message }
  return { error: null }
}

export async function approveStore(
  storeId: string,
  adminId: string,
  client: SupabaseClient
): Promise<{ error: string | null }> {
  const now = new Date().toISOString()

  const { error } = await client
    .from('stores')
    .update({ is_active: true, verified_at: now })
    .eq('id', storeId)

  if (error) return { error: error.message }

  // Also update the owner's verification_status
  const { data: store } = await client
    .from('stores')
    .select('owner_id')
    .eq('id', storeId)
    .single()

  if (store?.owner_id) {
    await client
      .from('profiles')
      .update({ verification_status: 'approved' })
      .eq('id', store.owner_id)
  }

  void adminId
  return { error: null }
}

export async function rejectStore(
  storeId: string,
  reason: string,
  client: SupabaseClient
): Promise<{ error: string | null }> {
  const { error } = await client
    .from('stores')
    .update({ rejection_reason: reason })
    .eq('id', storeId)

  if (error) return { error: error.message }

  // Also update the owner's verification_status
  const { data: store } = await client
    .from('stores')
    .select('owner_id')
    .eq('id', storeId)
    .single()

  if (store?.owner_id) {
    await client
      .from('profiles')
      .update({ verification_status: 'rejected' })
      .eq('id', store.owner_id)
  }

  return { error: null }
}

// ─── Community management ─────────────────────────────────────────────────────

export async function getAdminCommunities(client: SupabaseClient) {
  const { data, error } = await client
    .from('communities')
    .select('id, name, slug, description, icon_url, member_count, post_count, created_at, created_by')
    .order('created_at', { ascending: false })

  if (error) return []
  return data ?? []
}

export async function adminDeleteCommunity(
  communityId: string,
  client: SupabaseClient
): Promise<{ error: string | null }> {
  const { error } = await client
    .from('communities')
    .delete()
    .eq('id', communityId)

  return { error: error?.message ?? null }
}

export async function adminDeletePost(
  postId: string,
  client: SupabaseClient
): Promise<{ error: string | null }> {
  const { error } = await client
    .from('posts')
    .delete()
    .eq('id', postId)

  return { error: error?.message ?? null }
}

// ─── Emergency management ─────────────────────────────────────────────────────

export async function getAllEmergencyReports(client: SupabaseClient) {
  const { data, error } = await client
    .from('emergency_reports')
    .select(`
      id,
      title,
      description,
      location,
      status,
      category,
      image_urls,
      created_at,
      reporter_id,
      profiles!emergency_reports_reporter_id_fkey (
        full_name,
        email,
        avatar_url
      )
    `)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) return []
  return data ?? []
}

export async function updateEmergencyStatus(
  id: string,
  status: string,
  client: SupabaseClient
): Promise<{ error: string | null }> {
  const { error } = await client
    .from('emergency_reports')
    .update({ status })
    .eq('id', id)

  return { error: error?.message ?? null }
}
