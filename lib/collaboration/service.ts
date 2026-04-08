import { supabaseClient } from '@/lib/supabase/client'
import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  NgoProductCollaboration,
  NgoProductCollaborationWithRelations,
  NgoCollaborationStatus,
  ProductWithCollaboration,
} from '@/lib/auth/types'

// ─── Select fragments ─────────────────────────────────────────────────────────

const COLLAB_SELECT = `
  *,
  product:products!ngo_product_collaborations_product_id_fkey(
    id, name, images, price, category
  ),
  store:stores!ngo_product_collaborations_store_id_fkey(
    id, name, slug, logo_url
  ),
  ngo:profiles!ngo_product_collaborations_ngo_id_fkey(
    id, full_name, avatar_url,
    ngo_profile:ngos!ngos_id_fkey(organization_name, mission_statement)
  )
`

function normalizeCollab(raw: unknown): NgoProductCollaborationWithRelations {
  const r = raw as Record<string, unknown>
  const product = Array.isArray(r.product) ? r.product[0] : r.product
  const store = Array.isArray(r.store) ? r.store[0] : r.store
  const ngoRaw = Array.isArray(r.ngo) ? r.ngo[0] : r.ngo
  let ngo = ngoRaw
  if (ngo && typeof ngo === 'object') {
    const n = ngo as Record<string, unknown>
    const ngo_profile = Array.isArray(n.ngo_profile) ? n.ngo_profile[0] : n.ngo_profile
    ngo = { ...n, ngo_profile }
  }
  return { ...r, product, store, ngo } as NgoProductCollaborationWithRelations
}

// ─── Store owner: request a collaboration ────────────────────────────────────

export interface CollaborationRequestData {
  product_id: string
  store_id: string
  ngo_id: string
  ngo_proceeds_percent: number
  store_message?: string | null
}

export async function requestCollaboration(
  data: CollaborationRequestData
): Promise<{ collaboration: NgoProductCollaboration | null; error: string | null }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: collab, error } = await (supabaseClient as any)
    .from('ngo_product_collaborations')
    .insert({
      product_id: data.product_id,
      store_id: data.store_id,
      ngo_id: data.ngo_id,
      ngo_proceeds_percent: data.ngo_proceeds_percent,
      store_message: data.store_message ?? null,
      status: 'pending',
    })
    .select()
    .single()
  if (error) return { collaboration: null, error: error.message }
  return { collaboration: collab as NgoProductCollaboration, error: null }
}

// ─── Store owner: cancel a pending collaboration ──────────────────────────────

export async function cancelCollaboration(
  collaborationId: string
): Promise<{ error: string | null }> {
  const { error } = await supabaseClient
    .from('ngo_product_collaborations')
    .delete()
    .eq('id', collaborationId)
  return { error: error?.message ?? null }
}

// ─── Store owner: view their collaborations ───────────────────────────────────

export async function getStoreCollaborations(
  storeId: string,
  client: SupabaseClient = supabaseClient
): Promise<NgoProductCollaborationWithRelations[]> {
  const { data, error } = await client
    .from('ngo_product_collaborations')
    .select(COLLAB_SELECT)
    .eq('store_id', storeId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map(normalizeCollab)
}

// ─── NGO: view collaboration requests directed to them ────────────────────────

export async function getNgoCollaborationRequests(
  ngoId: string,
  status?: NgoCollaborationStatus,
  client: SupabaseClient = supabaseClient
): Promise<NgoProductCollaborationWithRelations[]> {
  let query = client
    .from('ngo_product_collaborations')
    .select(COLLAB_SELECT)
    .eq('ngo_id', ngoId)
    .order('created_at', { ascending: false })
  if (status) query = query.eq('status', status)
  const { data, error } = await query
  if (error) throw error
  return (data ?? []).map(normalizeCollab)
}

// ─── NGO: respond to a collaboration request ──────────────────────────────────

export async function respondToCollaboration(
  collaborationId: string,
  accept: boolean,
  ngoResponseMessage?: string | null
): Promise<{ error: string | null }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabaseClient as any)
    .from('ngo_product_collaborations')
    .update({
      status: accept ? 'accepted' : 'rejected',
      ngo_response_message: ngoResponseMessage ?? null,
    })
    .eq('id', collaborationId)
  return { error: error?.message ?? null }
}

// ─── Marketplace: get featured products (accepted collaborations) ─────────────

const FEATURED_SELECT = `
  *,
  store:stores!products_store_id_fkey(id, name, slug, logo_url),
  collaboration:ngo_product_collaborations!ngo_product_collaborations_product_id_fkey(
    id, ngo_proceeds_percent, status,
    ngo:profiles!ngo_product_collaborations_ngo_id_fkey(
      id, full_name, avatar_url,
      ngo_profile:ngos!ngos_id_fkey(organization_name, mission_statement)
    )
  )
`

export async function getFeaturedProducts(
  client: SupabaseClient = supabaseClient
): Promise<ProductWithCollaboration[]> {
  const { data, error } = await client
    .from('products')
    .select(FEATURED_SELECT)
    .eq('is_active', true)
    .eq('is_archived', false)
    .order('created_at', { ascending: false })
  if (error) throw error

  const results: ProductWithCollaboration[] = []
  for (const raw of data ?? []) {
    const r = raw as Record<string, unknown>
    const store = Array.isArray(r.store) ? r.store[0] : r.store
    const collabRaw = Array.isArray(r.collaboration) ? r.collaboration[0] : r.collaboration
    if (!collabRaw) continue
    const c = collabRaw as Record<string, unknown>
    if (c.status !== 'accepted') continue
    const ngoRaw = Array.isArray(c.ngo) ? c.ngo[0] : c.ngo
    let ngo = ngoRaw
    if (ngo && typeof ngo === 'object') {
      const n = ngo as Record<string, unknown>
      const ngo_profile = Array.isArray(n.ngo_profile) ? n.ngo_profile[0] : n.ngo_profile
      ngo = { ...n, ngo_profile }
    }
    const collaboration = { ...c, ngo } as NgoProductCollaborationWithRelations
    results.push({ ...r, store, collaboration } as ProductWithCollaboration)
  }
  return results
}

// ─── Get single product's accepted collaboration ──────────────────────────────

export async function getProductCollaboration(
  productId: string,
  client: SupabaseClient = supabaseClient
): Promise<NgoProductCollaborationWithRelations | null> {
  const { data, error } = await client
    .from('ngo_product_collaborations')
    .select(COLLAB_SELECT)
    .eq('product_id', productId)
    .eq('status', 'accepted')
    .maybeSingle()
  if (error || !data) return null
  return normalizeCollab(data)
}

// ─── Get collaboration for a specific product (any status, for store owner) ───

export async function getProductCollaborationAny(
  productId: string,
  client: SupabaseClient = supabaseClient
): Promise<NgoProductCollaborationWithRelations | null> {
  const { data, error } = await client
    .from('ngo_product_collaborations')
    .select(COLLAB_SELECT)
    .eq('product_id', productId)
    .maybeSingle()
  if (error || !data) return null
  return normalizeCollab(data)
}
