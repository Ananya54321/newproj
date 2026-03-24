import { supabaseClient } from '@/lib/supabase/client'
import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  Store,
  Product,
  ProductWithStore,
  Order,
  OrderWithItems,
  OrderStatus,
  ProductCategory,
  ProductReview,
  ProductReviewWithUser,
} from '@/lib/auth/types'

// ─── Form data ────────────────────────────────────────────────────────────────

export interface StoreFormData {
  name: string
  slug: string
  description?: string | null
  address?: string | null
}

export interface ProductFormData {
  name: string
  description?: string | null
  price: number
  stock: number
  category?: ProductCategory | null
  images?: string[] | null
  is_active?: boolean
}

export interface CheckoutItem {
  id: string
  name: string
  price: number
  quantity: number
  image: string
  storeId: string
}

// ─── Store queries ────────────────────────────────────────────────────────────

export async function getActiveStores(client: SupabaseClient = supabaseClient): Promise<Store[]> {
  const { data, error } = await client
    .from('stores')
    .select('*')
    .eq('is_active', true)
    .order('name')
  if (error) throw error
  return data ?? []
}

export async function getStoreBySlug(slug: string, client: SupabaseClient = supabaseClient): Promise<Store | null> {
  const { data, error } = await client
    .from('stores')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()
  if (error || !data) return null
  return data
}

export async function getOwnerStore(ownerId: string, client: SupabaseClient = supabaseClient): Promise<Store | null> {
  const { data, error } = await client
    .from('stores')
    .select('*')
    .eq('owner_id', ownerId)
    .maybeSingle()
  if (error || !data) return null
  return data
}

// ─── Product queries ──────────────────────────────────────────────────────────

const PRODUCT_SELECT = `*, store:stores!products_store_id_fkey(id, name, slug, logo_url)`

function normalizeProduct(raw: unknown): ProductWithStore {
  const r = raw as Record<string, unknown>
  const store = Array.isArray(r.store) ? r.store[0] : r.store
  return { ...r, store } as ProductWithStore
}

export async function getProducts(
  filters: { storeId?: string; category?: ProductCategory | 'all'; search?: string } = {},
  client: SupabaseClient = supabaseClient
): Promise<ProductWithStore[]> {
  let query = client
    .from('products')
    .select(PRODUCT_SELECT)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (filters.storeId) query = query.eq('store_id', filters.storeId)
  if (filters.category && filters.category !== 'all') query = query.eq('category', filters.category)
  if (filters.search) query = query.ilike('name', `%${filters.search}%`)

  const { data, error } = await query
  if (error) throw error
  return (data ?? []).map(normalizeProduct)
}

export async function getProductById(id: string, client: SupabaseClient = supabaseClient): Promise<ProductWithStore | null> {
  const { data, error } = await client
    .from('products')
    .select(PRODUCT_SELECT)
    .eq('id', id)
    .single()
  if (error || !data) return null
  return normalizeProduct(data)
}

export type StoreWithProducts = Store & { products: Product[] }

export async function getOwnerStoreWithProducts(
  ownerId: string,
  client: SupabaseClient = supabaseClient
): Promise<StoreWithProducts | null> {
  const { data, error } = await client
    .from('stores')
    .select('*, products(*)')
    .eq('owner_id', ownerId)
    .maybeSingle()
  if (error || !data) return null
  const raw = data as Store & { products?: Product[] }
  const products = (raw.products ?? []).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )
  return { ...raw, products }
}

export async function getStoreProducts(storeId: string, client: SupabaseClient = supabaseClient): Promise<Product[]> {
  const { data, error } = await client
    .from('products')
    .select('*')
    .eq('store_id', storeId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

// ─── Store mutations ──────────────────────────────────────────────────────────

export async function createStore(
  data: StoreFormData,
  ownerId: string
): Promise<{ store: Store | null; error: string | null }> {
  const { data: store, error } = await supabaseClient
    .from('stores')
    .insert({ ...data, owner_id: ownerId })
    .select()
    .single()
  if (error) return { store: null, error: error.message }
  return { store, error: null }
}

export async function updateStore(
  storeId: string,
  data: Partial<StoreFormData>
): Promise<{ error: string | null }> {
  const { error } = await supabaseClient
    .from('stores')
    .update(data)
    .eq('id', storeId)
  return { error: error?.message ?? null }
}

// ─── Product mutations ────────────────────────────────────────────────────────

export async function createProduct(
  data: ProductFormData,
  storeId: string
): Promise<{ product: Product | null; error: string | null }> {
  const { data: product, error } = await supabaseClient
    .from('products')
    .insert({ ...data, store_id: storeId })
    .select()
    .single()
  if (error) return { product: null, error: error.message }
  return { product, error: null }
}

export async function updateProduct(
  productId: string,
  data: Partial<ProductFormData>
): Promise<{ error: string | null }> {
  const { error } = await supabaseClient
    .from('products')
    .update(data)
    .eq('id', productId)
  return { error: error?.message ?? null }
}

export async function deleteProduct(productId: string): Promise<{ error: string | null }> {
  const { error } = await supabaseClient
    .from('products')
    .delete()
    .eq('id', productId)
  return { error: error?.message ?? null }
}

export async function uploadProductImage(
  file: File,
  productId: string
): Promise<{ url: string | null; error: string | null }> {
  const { uploadToCloudinary } = await import('@/lib/cloudinary/upload')
  const { url, error } = await uploadToCloudinary(file, `products/${productId}`)
  return { url, error }
}

// ─── Order queries ────────────────────────────────────────────────────────────

const ORDER_SELECT = `
  *,
  store:stores!orders_store_id_fkey(id, name, slug, logo_url),
  user:profiles!orders_user_id_fkey(id, full_name, email),
  items:order_items(
    *,
    product:products!order_items_product_id_fkey(id, name, images)
  )
`

function normalizeOrder(raw: unknown): OrderWithItems {
  const r = raw as Record<string, unknown>
  const store = Array.isArray(r.store) ? r.store[0] : r.store
  const user = Array.isArray(r.user) ? r.user[0] : r.user
  const items = ((r.items as unknown[]) ?? []).map((item) => {
    const i = item as Record<string, unknown>
    const product = Array.isArray(i.product) ? i.product[0] : i.product
    return { ...i, product }
  })
  return { ...r, store, user, items } as OrderWithItems
}

export async function getUserOrders(
  userId: string,
  client: SupabaseClient = supabaseClient
): Promise<OrderWithItems[]> {
  const { data, error } = await client
    .from('orders')
    .select(ORDER_SELECT)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map(normalizeOrder)
}

export async function getStoreOrders(
  storeId: string,
  client: SupabaseClient = supabaseClient
): Promise<OrderWithItems[]> {
  const { data, error } = await client
    .from('orders')
    .select(ORDER_SELECT)
    .eq('store_id', storeId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map(normalizeOrder)
}

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus
): Promise<{ error: string | null }> {
  const { error } = await supabaseClient
    .from('orders')
    .update({ status })
    .eq('id', orderId)
  return { error: error?.message ?? null }
}

// ─── Checkout ─────────────────────────────────────────────────────────────────

/** Creates one order per store. Returns all created order IDs. */
export async function checkout(
  items: CheckoutItem[],
  userId: string,
  shippingAddress: string
): Promise<{ orderIds: string[]; error: string | null }> {
  const byStore = new Map<string, CheckoutItem[]>()
  for (const item of items) {
    if (!byStore.has(item.storeId)) byStore.set(item.storeId, [])
    byStore.get(item.storeId)!.push(item)
  }

  const orderIds: string[] = []

  for (const [storeId, storeItems] of byStore) {
    const totalAmount = storeItems.reduce((sum, i) => sum + i.price * i.quantity, 0)

    const { data: order, error: orderError } = await supabaseClient
      .from('orders')
      .insert({
        user_id: userId,
        store_id: storeId,
        total_amount: totalAmount,
        shipping_address: shippingAddress,
        status: 'pending',
      })
      .select('id')
      .single()

    if (orderError || !order) {
      return { orderIds, error: orderError?.message ?? 'Failed to create order' }
    }

    const orderItemsData = storeItems.map((item) => ({
      order_id: order.id,
      product_id: item.id,
      quantity: item.quantity,
      unit_price: item.price,
    }))

    const { error: itemsError } = await supabaseClient
      .from('order_items')
      .insert(orderItemsData)

    if (itemsError) return { orderIds, error: itemsError.message }

    orderIds.push(order.id)
  }

  return { orderIds, error: null }
}

// ─── Dispatch ────────────────────────────────────────────────────────────────

export async function dispatchOrder(
  orderId: string,
  data: { dispatch_note?: string | null; tracking_number?: string | null }
): Promise<{ error: string | null }> {
  const { error } = await supabaseClient
    .from('orders')
    .update({ status: 'shipped', ...data })
    .eq('id', orderId)
  return { error: error?.message ?? null }
}

export async function markOrderDelivered(orderId: string): Promise<{ error: string | null }> {
  const { error } = await supabaseClient
    .from('orders')
    .update({ status: 'delivered' })
    .eq('id', orderId)
  return { error: error?.message ?? null }
}

// ─── Reviews ──────────────────────────────────────────────────────────────────

export interface ReviewFormData {
  product_id: string
  order_id?: string | null
  rating: number
  comment?: string | null
}

export async function createReview(
  data: ReviewFormData,
  userId: string
): Promise<{ review: ProductReview | null; error: string | null }> {
  const { data: review, error } = await supabaseClient
    .from('product_reviews')
    .insert({ ...data, user_id: userId })
    .select()
    .single()
  if (error) return { review: null, error: error.message }
  return { review: review as ProductReview, error: null }
}

export async function getProductReviews(
  productId: string,
  client: SupabaseClient = supabaseClient
): Promise<ProductReviewWithUser[]> {
  const { data, error } = await client
    .from('product_reviews')
    .select(`
      *,
      user:profiles!product_reviews_user_id_fkey(id, full_name, avatar_url)
    `)
    .eq('product_id', productId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return ((data ?? []) as unknown[]).map((raw) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r = raw as any
    return { ...r, user: Array.isArray(r.user) ? r.user[0] : r.user }
  }) as ProductReviewWithUser[]
}

export async function getAverageRating(
  productId: string,
  client: SupabaseClient = supabaseClient
): Promise<{ average: number; count: number }> {
  const { data, error } = await client
    .from('product_reviews')
    .select('rating')
    .eq('product_id', productId)
  if (error || !data?.length) return { average: 0, count: 0 }
  const sum = data.reduce((acc, r) => acc + (r.rating as number), 0)
  return { average: sum / data.length, count: data.length }
}

export async function getUserReviewForProduct(
  productId: string,
  userId: string,
  client: SupabaseClient = supabaseClient
): Promise<ProductReview | null> {
  const { data } = await client
    .from('product_reviews')
    .select('*')
    .eq('product_id', productId)
    .eq('user_id', userId)
    .maybeSingle()
  return (data as ProductReview | null) ?? null
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(price)
}

// Suppress unused import warnings
void (undefined as unknown as Order)
