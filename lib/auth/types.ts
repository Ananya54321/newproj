import { User, Session, AuthError as SupabaseAuthError } from '@supabase/supabase-js'

// ─── Enums ────────────────────────────────────────────────────────────────────

export type UserRole = 'user' | 'veterinarian' | 'ngo' | 'store_owner' | 'admin'

export type VerificationStatus = 'pending' | 'approved' | 'rejected'

// Phase 2–4 types
export type PetSpecies = 'dog' | 'cat' | 'bird' | 'rabbit' | 'fish' | 'reptile' | 'other'

// Phase 5 types
export type ProductCategory = 'food' | 'treats' | 'toys' | 'accessories' | 'grooming' | 'health' | 'bedding' | 'other'
export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
export type ReturnReasonType = 'damaged' | 'wrong_item' | 'changed_mind'
export type ReturnStatus = 'pending' | 'collecting' | 'collected' | 'approved' | 'rejected' | 'refunded'
export type CommunityEventType = 'meetup' | 'social' | 'training' | 'other'

// Phase 6 types
export type PostType = 'text' | 'image' | 'link'
export type NotificationType = 'new_post' | 'comment_reply' | 'post_vote' | 'comment_vote'

// Phase 7 types
export type DonationStatus = 'pending' | 'completed' | 'failed' | 'refunded'

export type AppointmentStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled'

export type ConsultationType = 'in_person' | 'video' | 'phone'

export type EmergencyStatus = 'open' | 'in_progress' | 'resolved' | 'closed'

export type EmergencyCategory = 'injured' | 'lost' | 'abandoned' | 'sick' | 'other'

// ─── Database types ───────────────────────────────────────────────────────────

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'created_at' | 'updated_at'>
        Update: Partial<Omit<Profile, 'id' | 'created_at'>>
      }
      pets: {
        Row: Pet
        Insert: Omit<Pet, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Pet, 'id' | 'owner_id' | 'created_at'>>
      }
      veterinarians: {
        Row: VeterinarianProfile
        Insert: Omit<VeterinarianProfile, 'verified_at'>
        Update: Partial<VeterinarianProfile>
      }
      ngos: {
        Row: NgoProfile
        Insert: Omit<NgoProfile, 'verified_at'>
        Update: Partial<NgoProfile>
      }
      stores: {
        Row: Store
        Insert: Omit<Store, 'id' | 'created_at' | 'updated_at' | 'verified_at'>
        Update: Partial<Omit<Store, 'id' | 'owner_id' | 'created_at'>>
      }
      products: {
        Row: Product
        Insert: Omit<Product, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Product, 'id' | 'store_id' | 'created_at'>>
      }
      orders: {
        Row: Order
        Insert: Omit<Order, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Order, 'id' | 'user_id' | 'store_id' | 'created_at'>>
      }
      order_items: {
        Row: OrderItem
        Insert: Omit<OrderItem, 'id' | 'created_at'>
        Update: Partial<Omit<OrderItem, 'id' | 'order_id' | 'created_at'>>
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      user_role: UserRole
      verification_status: VerificationStatus
    }
  }
}

// ─── Domain models ────────────────────────────────────────────────────────────

export interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  role: UserRole
  verification_status: VerificationStatus | null
  phone: string | null
  bio: string | null
  slug: string | null
  address: string | null
  latitude: number | null
  longitude: number | null
  created_at: string
  updated_at: string
}

export interface Pet {
  id: string
  owner_id: string
  name: string
  species: string
  breed: string | null
  birth_date: string | null
  weight_kg: number | null
  avatar_url: string | null
  medical_notes: string | null
  created_at: string
  updated_at: string
}

export interface VeterinarianProfile {
  id: string // references profiles.id
  license_number: string | null
  license_document_url: string | null
  resume_url: string | null
  specialty: string[] | null
  years_experience: number | null
  clinic_name: string | null
  clinic_address: string | null
  consultation_fee: number | null
  available_hours: Record<string, unknown> | null
  bio: string | null
  social_links: Record<string, string> | null
  extra_document_urls: string[] | null
  verified_at: string | null
  verified_by: string | null
  rejection_reason: string | null
}

export interface NgoProfile {
  id: string // references profiles.id
  organization_name: string
  registration_number: string | null
  registration_document_url: string | null
  mission_statement: string | null
  website_url: string | null
  address: string | null
  accepts_donations: boolean
  social_links: Record<string, string> | null
  extra_document_urls: string[] | null
  verified_at: string | null
  verified_by: string | null
  rejection_reason: string | null
}

export interface Store {
  id: string
  owner_id: string
  name: string
  slug: string | null
  description: string | null
  logo_url: string | null
  banner_url: string | null
  address: string | null
  store_images: string[] | null
  social_links: Record<string, string> | null
  is_active: boolean
  created_at: string
  updated_at: string
  verified_at: string | null
  rejection_reason: string | null
}

// ─── Phase 5 domain models ────────────────────────────────────────────────────

export interface Product {
  id: string
  store_id: string
  name: string
  description: string | null
  price: number
  stock: number
  images: string[] | null
  category: ProductCategory | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ProductWithStore extends Product {
  store: Pick<Store, 'id' | 'name' | 'slug' | 'logo_url'>
}

export interface Order {
  id: string
  user_id: string
  store_id: string
  status: OrderStatus
  total_amount: number
  shipping_address: string | null
  notes: string | null
  dispatch_note: string | null
  tracking_number: string | null
  created_at: string
  updated_at: string
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  quantity: number
  unit_price: number
  created_at: string
}

export interface OrderWithItems extends Order {
  items: (OrderItem & { product: Pick<Product, 'id' | 'name' | 'images'> | null })[]
  store: Pick<Store, 'id' | 'name' | 'slug' | 'logo_url'>
  user: Pick<Profile, 'id' | 'full_name' | 'email'>
}

export interface ReturnRequest {
  id: string
  order_id: string
  user_id: string
  reason_type: ReturnReasonType
  reason_note: string | null
  image_urls: string[]
  status: ReturnStatus
  refund_type: 'full' | 'product_only' | null
  refund_amount: number | null
  admin_notes: string | null
  created_at: string
  updated_at: string
}

export interface ReturnRequestWithOrder extends ReturnRequest {
  order: Pick<Order, 'id' | 'total_amount' | 'created_at'> & {
    store: Pick<Store, 'id' | 'name'>
    items: (OrderItem & { product: Pick<Product, 'id' | 'name' | 'images'> | null })[]
  }
  user: Pick<Profile, 'id' | 'full_name' | 'email' | 'avatar_url'>
}

export const RETURN_STATUS_CONFIG: Record<ReturnStatus, { label: string; color: string }> = {
  pending:    { label: 'Return Requested', color: 'bg-amber-100 text-amber-800' },
  collecting: { label: 'Awaiting Pickup',  color: 'bg-blue-100 text-blue-800' },
  collected:  { label: 'Item Collected',   color: 'bg-purple-100 text-purple-800' },
  approved:   { label: 'Refund Approved',  color: 'bg-emerald-100 text-emerald-800' },
  rejected:   { label: 'Return Rejected',  color: 'bg-destructive/10 text-destructive' },
  refunded:   { label: 'Refunded',         color: 'bg-emerald-200 text-emerald-900' },
}

export interface CommunityEvent {
  id: string
  community_id: string
  creator_id: string
  title: string
  description: string | null
  type: CommunityEventType
  location: string | null
  event_date: string
  image_url: string | null
  registration_url: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CommunityEventWithCreator extends CommunityEvent {
  creator: Pick<Profile, 'id' | 'full_name' | 'avatar_url'>
}

// ─── Phase 6 domain models ────────────────────────────────────────────────────

export interface Community {
  id: string
  name: string
  slug: string
  description: string | null
  icon_url: string | null
  banner_url: string | null
  created_by: string | null
  is_public: boolean
  member_count: number
  post_count: number
  created_at: string
  updated_at: string
}

export interface CommunityWithMembership extends Community {
  is_member: boolean
  member_role: 'member' | 'moderator' | null
}

export interface Post {
  id: string
  community_id: string
  author_id: string
  title: string
  content: string | null
  type: PostType
  image_urls: string[]
  link_url: string | null
  vote_score: number
  comment_count: number
  is_pinned: boolean
  created_at: string
  updated_at: string
}

export interface PostWithMeta extends Post {
  community: Pick<Community, 'id' | 'name' | 'slug' | 'icon_url'>
  author: Pick<Profile, 'id' | 'full_name' | 'avatar_url'>
  user_vote: 1 | -1 | null
}

export interface Comment {
  id: string
  post_id: string
  parent_id: string | null
  author_id: string
  content: string
  vote_score: number
  is_deleted: boolean
  created_at: string
  updated_at: string
}

export interface CommentWithMeta extends Comment {
  author: Pick<Profile, 'id' | 'full_name' | 'avatar_url'>
  user_vote: 1 | -1 | null
  replies: CommentWithMeta[]
}

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  body: string | null
  link: string | null
  is_read: boolean
  data: Record<string, unknown> | null
  created_at: string
}

// ─── Phase 7 domain models ────────────────────────────────────────────────────

export interface NgoUpdate {
  id: string
  ngo_id: string
  title: string
  content: string
  image_url: string | null
  created_at: string
  updated_at: string
}

export interface NgoUpdateWithNgo extends NgoUpdate {
  ngo: Pick<Profile, 'id' | 'full_name' | 'avatar_url'> & {
    ngo_profile: Pick<NgoProfile, 'organization_name'>
  }
}

export interface Donation {
  id: string
  donor_id: string
  ngo_id: string
  amount: number
  currency: string
  status: DonationStatus
  stripe_payment_intent_id: string | null
  message: string | null
  is_anonymous: boolean
  created_at: string
}

export interface DonationWithRelations extends Donation {
  donor: Pick<Profile, 'id' | 'full_name' | 'avatar_url'>
  ngo?: Pick<Profile, 'id' | 'full_name'> | null
}

// ─── Phase 2-4 domain models ─────────────────────────────────────────────────

export interface Appointment {
  id: string
  user_id: string
  vet_id: string
  pet_id: string | null
  scheduled_at: string
  status: AppointmentStatus
  consultation_type: ConsultationType
  duration_minutes: number
  notes: string | null
  created_at: string
  updated_at: string
}

export interface AppointmentWithRelations extends Appointment {
  pet: Pick<Pet, 'id' | 'name' | 'species' | 'avatar_url'> | null
  vet_profile: Pick<Profile, 'id' | 'full_name' | 'avatar_url'>
  vet_details: Pick<VeterinarianProfile, 'clinic_name' | 'specialty' | 'consultation_fee'>
  user_profile: Pick<Profile, 'id' | 'full_name' | 'avatar_url'>
}

export interface EmergencyReport {
  id: string
  reporter_id: string
  title: string
  description: string | null
  location: string
  lat: number | null
  lng: number | null
  image_urls: string[] | null
  status: EmergencyStatus
  category: EmergencyCategory
  created_at: string
  updated_at: string
}

export interface EmergencyReportWithReporter extends EmergencyReport {
  reporter: Pick<Profile, 'id' | 'full_name' | 'avatar_url'>
}

/** Vet profile + owning profile row joined */
export interface VetWithProfile {
  id: string
  profile: Profile
  license_number: string | null
  specialty: string[] | null
  years_experience: number | null
  clinic_name: string | null
  clinic_address: string | null
  consultation_fee: number | null
  available_hours: Record<string, [string, string] | undefined> | null
  bio: string | null
  social_links: Record<string, string> | null
  verified_at: string | null
  /** Distance in km from user's location — populated client-side */
  distance?: number
}

// ─── Label/constant maps ──────────────────────────────────────────────────────

export const ORDER_STATUS_CONFIG: Record<OrderStatus, { label: string; color: string }> = {
  pending:    { label: 'Pending',    color: 'bg-amber-100 text-amber-800' },
  confirmed:  { label: 'Confirmed',  color: 'bg-blue-100 text-blue-800' },
  processing: { label: 'Processing', color: 'bg-purple-100 text-purple-800' },
  shipped:    { label: 'Shipped',    color: 'bg-cyan-100 text-cyan-800' },
  delivered:  { label: 'Delivered',  color: 'bg-emerald-100 text-emerald-800' },
  cancelled:  { label: 'Cancelled',  color: 'bg-destructive/10 text-destructive' },
}

export const PRODUCT_CATEGORIES: { value: ProductCategory; label: string }[] = [
  { value: 'food',        label: 'Food & Nutrition' },
  { value: 'treats',      label: 'Treats & Snacks' },
  { value: 'toys',        label: 'Toys & Play' },
  { value: 'accessories', label: 'Accessories' },
  { value: 'grooming',    label: 'Grooming' },
  { value: 'health',      label: 'Health & Wellness' },
  { value: 'bedding',     label: 'Beds & Bedding' },
  { value: 'other',       label: 'Other' },
]

export const SPECIES_OPTIONS: { value: PetSpecies; label: string; emoji: string }[] = [
  { value: 'dog', label: 'Dog', emoji: '🐶' },
  { value: 'cat', label: 'Cat', emoji: '🐱' },
  { value: 'bird', label: 'Bird', emoji: '🐦' },
  { value: 'rabbit', label: 'Rabbit', emoji: '🐰' },
  { value: 'fish', label: 'Fish', emoji: '🐠' },
  { value: 'reptile', label: 'Reptile', emoji: '🦎' },
  { value: 'other', label: 'Other', emoji: '🐾' },
]

export const APPOINTMENT_STATUS_CONFIG: Record<
  AppointmentStatus,
  { label: string; color: string }
> = {
  pending:   { label: 'Pending',   color: 'bg-amber-100 text-amber-800' },
  confirmed: { label: 'Confirmed', color: 'bg-emerald-100 text-emerald-800' },
  completed: { label: 'Completed', color: 'bg-secondary text-secondary-foreground' },
  cancelled: { label: 'Cancelled', color: 'bg-destructive/10 text-destructive' },
}

export const CONSULTATION_TYPE_CONFIG: Record<
  ConsultationType,
  { label: string; icon: string }
> = {
  in_person: { label: 'In Person', icon: '🏥' },
  video:     { label: 'Video Call', icon: '🎥' },
  phone:     { label: 'Phone',      icon: '📞' },
}

export const EMERGENCY_STATUS_CONFIG: Record<
  EmergencyStatus,
  { label: string; color: string }
> = {
  open:        { label: 'Open',        color: 'bg-destructive/10 text-destructive' },
  in_progress: { label: 'In Progress', color: 'bg-amber-100 text-amber-800' },
  resolved:    { label: 'Resolved',    color: 'bg-emerald-100 text-emerald-800' },
  closed:      { label: 'Closed',      color: 'bg-secondary text-secondary-foreground' },
}

export const EMERGENCY_CATEGORY_CONFIG: Record<
  EmergencyCategory,
  { label: string; color: string }
> = {
  injured:   { label: 'Injured Animal', color: 'bg-destructive/10 text-destructive' },
  lost:      { label: 'Lost Pet',       color: 'bg-blue-100 text-blue-800' },
  abandoned: { label: 'Abandoned',      color: 'bg-amber-100 text-amber-800' },
  sick:      { label: 'Sick Animal',    color: 'bg-purple-100 text-purple-800' },
  other:     { label: 'Other',          color: 'bg-secondary text-secondary-foreground' },
}

// ─── Phase 10 domain models ───────────────────────────────────────────────────

export type NgoEventType = 'meetup' | 'fundraiser'

export interface NgoEvent {
  id: string
  ngo_id: string
  title: string
  description: string | null
  type: NgoEventType
  location: string | null
  event_date: string
  image_url: string | null
  registration_url: string | null
  goal_amount: number | null
  raised_amount: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface NgoEventWithNgo extends NgoEvent {
  ngo: Pick<Profile, 'id' | 'full_name' | 'avatar_url'> & {
    ngo_profile: Pick<NgoProfile, 'organization_name'>
  }
}

export interface ProductReview {
  id: string
  product_id: string
  user_id: string
  order_id: string | null
  rating: number
  comment: string | null
  created_at: string
}

export interface ProductReviewWithUser extends ProductReview {
  user: Pick<Profile, 'id' | 'full_name' | 'avatar_url'>
}

export interface StripeConnection {
  id: string
  user_id: string
  stripe_account_id: string
  charges_enabled: boolean
  details_submitted: boolean
  created_at: string
}

// ─── Auth types ───────────────────────────────────────────────────────────────

export type AuthUser = User
export type AuthSession = Session

export interface AuthError {
  message: string
  code?: string
  status?: number
}

export interface AuthResponse<T = AuthUser> {
  data: T | null
  error: AuthError | null
}

export interface SessionResponse {
  session: AuthSession | null
  error: AuthError | null
}

// ─── Form data types ──────────────────────────────────────────────────────────

export interface LoginFormData {
  email: string
  password: string
}

export interface SignupFormData {
  email: string
  password: string
  confirmPassword: string
  full_name: string
  role: UserRole
  // Vet-specific
  license_number?: string
  specialty?: string[]
  clinic_name?: string
  clinic_address?: string
  license_document_url?: string
  extra_document_urls?: string[]
  // NGO-specific
  organization_name?: string
  registration_number?: string
  mission_statement?: string
  address?: string
  registration_document_url?: string
  // Store-specific
  store_name?: string
  store_images?: string[]
  // Shared professional
  social_links?: Record<string, string>
}

export interface ResetPasswordFormData {
  email: string
}

// ─── Auth state (for context) ─────────────────────────────────────────────────

export interface AuthState {
  user: AuthUser | null
  profile: Profile | null
  session: AuthSession | null
  loading: boolean
  error: AuthError | null
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Convert any Supabase/native error to a user-friendly AuthError. */
export function toAuthError(error: SupabaseAuthError | Error | null): AuthError | null {
  if (!error) return null

  const code = 'code' in error ? (error as SupabaseAuthError).code : undefined
  const status = 'status' in error ? (error as SupabaseAuthError).status : undefined
  let message = error.message

  if (
    code === 'user_already_exists' ||
    message.toLowerCase().includes('user already registered')
  ) {
    message = 'An account with this email already exists. Please log in instead.'
  } else if (code === 'invalid_credentials') {
    message = 'Invalid email or password. Please try again.'
  } else if (code === 'email_not_confirmed') {
    message = 'Please verify your email address before signing in.'
  } else if (message.toLowerCase().includes('email rate limit')) {
    message = 'Too many requests. Please wait a moment before trying again.'
  } else if (code === 'weak_password' || message.toLowerCase().includes('weak')) {
    message =
      'This password is too common. Please choose a stronger password with a mix of characters.'
  }

  return { message, code, status }
}

/** Returns true when a role requires admin verification before full access. */
export function requiresVerification(role: UserRole): boolean {
  return role === 'veterinarian' || role === 'ngo' || role === 'store_owner'
}

/** Human-readable role labels. */
export const ROLE_LABELS: Record<UserRole, string> = {
  user: 'Pet Owner',
  veterinarian: 'Veterinarian',
  ngo: 'NGO / Rescue',
  store_owner: 'Pet Store Owner',
  admin: 'Admin',
}
