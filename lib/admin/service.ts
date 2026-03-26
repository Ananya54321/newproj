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
    client.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'store_owner').eq('verification_status', 'pending'),
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
      veterinarians!veterinarians_id_fkey (
        license_number,
        clinic_name,
        specialty,
        years_experience
      )
    `)
    .eq('role', 'veterinarian')
    .eq('verification_status', 'pending')
    .order('created_at', { ascending: true })

  if (error) { console.error('getPendingVets error:', error); return [] }

  return ((data ?? []) as Array<{
    id: string
    full_name: string | null
    email: string
    created_at: string
    avatar_url: string | null
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any
  }>).map((row) => {
    const vet = row['veterinarians!veterinarians_id_fkey'] ?? row['veterinarians'] ?? null
    return {
      id: row.id,
      full_name: row.full_name,
      email: row.email,
      created_at: row.created_at,
      avatar_url: row.avatar_url,
      license_number: vet?.license_number ?? null,
      clinic_name: vet?.clinic_name ?? null,
      specialty: vet?.specialty ?? null,
      years_experience: vet?.years_experience ?? null,
    }
  })
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
      ngos!ngos_id_fkey (
        organization_name,
        registration_number,
        mission_statement
      )
    `)
    .eq('role', 'ngo')
    .eq('verification_status', 'pending')
    .order('created_at', { ascending: true })

  if (error) { console.error('getPendingNGOs error:', error); return [] }

  return ((data ?? []) as Array<{
    id: string
    full_name: string | null
    email: string
    created_at: string
    avatar_url: string | null
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any
  }>).map((row) => {
    const ngo = row['ngos!ngos_id_fkey'] ?? row['ngos'] ?? null
    return {
      id: row.id,
      full_name: row.full_name,
      email: row.email,
      created_at: row.created_at,
      avatar_url: row.avatar_url,
      organization_name: ngo?.organization_name ?? null,
      registration_number: ngo?.registration_number ?? null,
      mission_statement: ngo?.mission_statement ?? null,
    }
  })
}

export async function getPendingStores(client: SupabaseClient): Promise<PendingStore[]> {
  // Query from profiles (like vets/NGOs) so we catch store_owner accounts
  // even if their store row hasn't been created yet.
  const { data, error } = await client
    .from('profiles')
    .select(`
      id,
      full_name,
      email,
      created_at,
      avatar_url,
      stores (
        id,
        name,
        slug,
        description
      )
    `)
    .eq('role', 'store_owner')
    .eq('verification_status', 'pending')
    .order('created_at', { ascending: true })

  if (error) { console.error('getPendingStores error:', error); return [] }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ((data ?? []) as any[]).map((row) => {
    // stores is an array (one-to-many), take the first
    const store = Array.isArray(row.stores) ? row.stores[0] ?? null : (row.stores ?? null)
    return {
      id: row.id,          // profile/owner ID - used for approve/reject actions
      name: store?.name ?? 'No store name yet',
      slug: store?.slug ?? null,
      owner_id: row.id,
      owner_name: row.full_name,
      owner_email: row.email,
      created_at: row.created_at,
      description: store?.description ?? null,
    } satisfies PendingStore
  })
}

// ─── Approval actions ─────────────────────────────────────────────────────────

export async function approveVet(
  vetId: string,
  adminId: string,
  client: SupabaseClient
): Promise<{ error: string | null }> {
  const now = new Date().toISOString()

  // Upsert so we create the row if it was never inserted during signup
  const [vetUpdate, profileUpdate] = await Promise.all([
    client
      .from('veterinarians')
      .upsert({ id: vetId, verified_at: now, verified_by: adminId }, { onConflict: 'id' }),
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
  ownerId: string,
  adminId: string,
  client: SupabaseClient
): Promise<{ error: string | null }> {
  const now = new Date().toISOString()
  void adminId

  // Update profile first (always present)
  const { error: profileError } = await client
    .from('profiles')
    .update({ verification_status: 'approved' })
    .eq('id', ownerId)

  if (profileError) return { error: profileError.message }

  // Activate store if one exists
  await client
    .from('stores')
    .update({ is_active: true, verified_at: now })
    .eq('owner_id', ownerId)

  return { error: null }
}

export async function rejectStore(
  ownerId: string,
  reason: string,
  client: SupabaseClient
): Promise<{ error: string | null }> {
  // Update profile (always present)
  const { error: profileError } = await client
    .from('profiles')
    .update({ verification_status: 'rejected' })
    .eq('id', ownerId)

  if (profileError) return { error: profileError.message }

  // Update store rejection reason if store exists
  await client
    .from('stores')
    .update({ rejection_reason: reason })
    .eq('owner_id', ownerId)

  return { error: null }
}

// ─── User detail (for admin review) ──────────────────────────────────────────

export interface AdminUserDetail {
  id: string
  full_name: string | null
  email: string
  role: string
  verification_status: string | null
  created_at: string
  avatar_url: string | null
  bio: string | null
  phone: string | null
  slug: string | null
  vet: {
    license_number: string | null
    license_document_url: string | null
    resume_url: string | null
    specialty: string[] | null
    years_experience: number | null
    clinic_name: string | null
    clinic_address: string | null
    consultation_fee: number | null
    bio: string | null
    rejection_reason: string | null
  } | null
  ngo: {
    organization_name: string | null
    registration_number: string | null
    registration_document_url: string | null
    mission_statement: string | null
    website_url: string | null
    address: string | null
    accepts_donations: boolean
    rejection_reason: string | null
  } | null
  store: {
    id: string
    name: string
    slug: string | null
    description: string | null
    logo_url: string | null
    address: string | null
    rejection_reason: string | null
  } | null
}

export async function getAdminUserDetail(
  userId: string,
  client: SupabaseClient
): Promise<AdminUserDetail | null> {
  const { data, error } = await client
    .from('profiles')
    .select(`
      id, full_name, email, role, verification_status, created_at,
      avatar_url, bio, phone, slug,
      veterinarians!veterinarians_id_fkey (
        license_number, license_document_url, resume_url,
        specialty, years_experience, clinic_name, clinic_address,
        consultation_fee, bio, rejection_reason
      ),
      ngos!ngos_id_fkey (
        organization_name, registration_number, registration_document_url,
        mission_statement, website_url, address, accepts_donations, rejection_reason
      ),
      stores (
        id, name, slug, description, logo_url, address, rejection_reason
      )
    `)
    .eq('id', userId)
    .single()

  if (error || !data) return null

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const r = data as any
  const vetRaw = r['veterinarians!veterinarians_id_fkey'] ?? r.veterinarians ?? null
  const vet = Array.isArray(vetRaw) ? vetRaw[0] ?? null : vetRaw
  const ngoRaw = r['ngos!ngos_id_fkey'] ?? r.ngos ?? null
  const ngo = Array.isArray(ngoRaw) ? ngoRaw[0] ?? null : ngoRaw
  const storeArr = Array.isArray(r.stores) ? r.stores : (r.stores ? [r.stores] : [])
  const store = storeArr[0] ?? null

  return {
    id: r.id,
    full_name: r.full_name,
    email: r.email,
    role: r.role,
    verification_status: r.verification_status,
    created_at: r.created_at,
    avatar_url: r.avatar_url,
    bio: r.bio,
    phone: r.phone,
    slug: r.slug,
    vet: vet ?? null,
    ngo: ngo ?? null,
    store: store ?? null,
  }
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

// ─── Return request management ───────────────────────────────────────────────

export async function getAdminReturnRequests(client: SupabaseClient) {
  const { data, error } = await client
    .from('return_requests')
    .select(`
      *,
      order:orders!return_requests_order_id_fkey(
        id, total_amount, created_at,
        store:stores!orders_store_id_fkey(id, name)
      ),
      user:profiles!return_requests_user_id_fkey(id, full_name, email, avatar_url)
    `)
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) return []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ((data ?? []) as any[]).map((r) => ({
    ...r,
    order: Array.isArray(r.order) ? r.order[0] : r.order,
    user: Array.isArray(r.user) ? r.user[0] : r.user,
  }))
}

export async function adminApproveReturn(
  returnId: string,
  refundAmount: number,
  client: SupabaseClient
): Promise<{ error: string | null }> {
  const { error } = await client
    .from('return_requests')
    .update({ status: 'approved', refund_amount: refundAmount })
    .eq('id', returnId)
  return { error: error?.message ?? null }
}

export async function adminRejectReturn(
  returnId: string,
  adminNotes: string,
  client: SupabaseClient
): Promise<{ error: string | null }> {
  const { error } = await client
    .from('return_requests')
    .update({ status: 'rejected', admin_notes: adminNotes })
    .eq('id', returnId)
  return { error: error?.message ?? null }
}

export async function adminMarkReturnCollecting(
  returnId: string,
  client: SupabaseClient
): Promise<{ error: string | null }> {
  const { error } = await client
    .from('return_requests')
    .update({ status: 'collecting' })
    .eq('id', returnId)
  return { error: error?.message ?? null }
}

export async function adminMarkReturnRefunded(
  returnId: string,
  client: SupabaseClient
): Promise<{ error: string | null }> {
  const { error } = await client
    .from('return_requests')
    .update({ status: 'refunded' })
    .eq('id', returnId)
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
