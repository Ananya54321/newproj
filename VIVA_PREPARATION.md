# PawHaven - Major Project Viva Questions & Answers

## 1. TECHNICAL ARCHITECTURE

### Q1: Why did you choose Next.js 16 with the App Router over other frameworks?

**Answer:**
I chose Next.js 16 with the App Router for several key reasons:

1. **Server Components by Default**: The App Router uses React Server Components, which reduces JavaScript sent to the client and improves initial page load performance. This is crucial for a marketplace application where SEO and performance matter.

2. **Built-in API Routes**: Next.js provides API routes that integrate seamlessly with our frontend, allowing us to create backend endpoints for payment processing (Stripe/Razorpay), CometChat authentication, and other server-side operations.

3. **File-based Routing**: The App Router's file-system based routing makes it intuitive to organize features. For example, `app/(dashboard)/appointments/` automatically creates the `/appointments` route.

4. **Middleware Support**: Next.js middleware allows us to implement authentication checks before pages load, protecting routes like `/dashboard`, `/store`, and `/admin` without client-side redirects.

5. **TypeScript Support**: First-class TypeScript support ensures type safety across our entire application, reducing runtime errors.

6. **Deployment**: Easy deployment to Vercel with automatic optimizations, edge functions, and CDN distribution.

### Q2: Explain your database schema design - why did you use PostgreSQL with Supabase?

**Answer:**
I used PostgreSQL with Supabase for these reasons:

**PostgreSQL Benefits:**
- **Relational Data Model**: Our application has complex relationships (users → pets, vets → appointments, stores → products → orders). PostgreSQL handles these relationships efficiently with foreign keys and joins.
- **ACID Compliance**: Ensures data integrity for critical operations like order processing and payment transactions.
- **Advanced Features**: Support for JSONB (for storing flexible data like `available_hours`), arrays (for `specialty`, `images`), and full-text search with `pg_trgm` extension.

**Supabase Benefits:**
- **Row Level Security (RLS)**: Built-in security at the database level. For example, users can only see their own pets, vets can only see appointments assigned to them.
- **Real-time Subscriptions**: Can listen to database changes for features like live order updates.
- **Authentication Integration**: Supabase Auth integrates directly with the database through the `auth.users` table.
- **Storage**: Built-in file storage for avatars, product images, and documents.
- **Auto-generated APIs**: Supabase generates REST and GraphQL APIs automatically from our schema.

**Schema Design Decisions:**
- **Enums for Status Fields**: Using PostgreSQL enums (`user_role`, `verification_status`, `order_status`) ensures data consistency and prevents invalid values.
- **Separate Profile Tables**: Extended `auth.users` with `profiles` table for public data, and role-specific tables (`veterinarians`, `ngos`, `stores`) for specialized data.
- **Triggers**: Automated profile creation using `handle_new_user()` trigger when users sign up.

### Q3: How does Row Level Security (RLS) work in your application? Walk through a specific policy.

**Answer:**
Row Level Security is a PostgreSQL feature that restricts which rows users can access based on policies. Every query automatically applies these policies.

**Example: Products Table Policy**

```sql
create policy "products: active public read"
  on public.products for select
  using (
    is_active = true
    or exists (
      select 1 from public.stores
      where id = public.products.store_id
        and owner_id = auth.uid()
    )
    or public.is_admin()
  );
```

**How it works:**
1. **Public Access**: Anyone can see products where `is_active = true`
2. **Store Owner Access**: Store owners can see ALL their products (even inactive ones) through the EXISTS subquery that checks if the current user (`auth.uid()`) owns the store
3. **Admin Access**: Admins can see everything via the `is_admin()` helper function

**Another Example: Appointments**

```sql
create policy "appointments: participant read"
  on public.appointments for select
  using (
    auth.uid() = user_id
    or auth.uid() = vet_id
    or public.is_admin()
  );
```

Users can only see appointments where they are either the patient (`user_id`) or the veterinarian (`vet_id`). This prevents users from seeing other people's appointments.

**Benefits:**
- Security enforced at database level, not application level
- No way to bypass it from the frontend
- Applies to all queries automatically
- Reduces code complexity



### Q4: Explain the middleware authentication flow and how you handle protected routes.

**Answer:**
Our authentication middleware (`middleware.ts`) runs on every request before the page loads.

**Flow:**

1. **Request Interception**: Middleware intercepts all requests except static assets (images, CSS, JS)

```typescript
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
```

2. **Session Check**: Creates a Supabase client and checks if user is authenticated:

```typescript
const supabase = createMiddlewareSupabaseClient(request, response)
const { data: { user } } = await supabase.auth.getUser()
```

3. **Route Protection Logic**:
   - **Protected Routes** (`/dashboard`, `/appointments`, `/store`, etc.): Require authentication
   - **Auth Pages** (`/login`, `/signup`): Redirect authenticated users to dashboard
   - **Public Routes** (`/`, `/marketplace`, `/vets`): Accessible to everyone

4. **Redirect Logic**:

```typescript
// Protected route without auth → redirect to login
if (isProtected && !user) {
  const loginUrl = new URL('/login', request.url)
  loginUrl.searchParams.set('redirectTo', pathname)
  return NextResponse.redirect(loginUrl)
}

// Auth page with auth → redirect to dashboard
if (isAuthPage && user) {
  return NextResponse.redirect(new URL('/dashboard', request.url))
}
```

5. **Session Sync**: The middleware also updates session cookies, ensuring the session stays fresh across requests.

**Client-Side Protection:**
We also have `AuthProvider` that wraps the app and provides auth context:

```typescript
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
```

Components can check `user` and `profile` to conditionally render UI or redirect.

### Q5: Why did you integrate both Stripe and Razorpay for payments?

**Answer:**

**Razorpay:**
- **Primary for Indian Market**: Razorpay is optimized for Indian payments with support for UPI, Paytm, PhonePe, and local payment methods
- **Lower Fees**: More competitive pricing for Indian transactions
- **INR Native**: Handles Indian Rupees natively without currency conversion
- **Regulatory Compliance**: Fully compliant with RBI regulations

**Stripe:**
- **International Payments**: For users outside India or international credit cards
- **Better Developer Experience**: Excellent documentation and testing tools
- **Advanced Features**: Supports subscriptions, Connect (for marketplace payouts), and more sophisticated payment flows
- **Future Scalability**: If we expand globally, Stripe is already integrated

**Implementation:**
- Users can choose payment method at checkout
- Both integrate via API routes (`/api/razorpay/` and `/api/stripe/`)
- Payment intents are created server-side for security
- Webhooks handle payment confirmation and order status updates

### Q6: How does the real-time chat feature work with CometChat integration?

**Answer:**
CometChat provides real-time messaging between users and veterinarians.

**Architecture:**

1. **CometChat SDK Integration**:
```typescript
import { CometChat } from '@cometchat/chat-sdk-javascript'
import { CometChatUIKit } from '@cometchat/chat-uikit-react'
```

2. **Initialization** (`initCometChat.ts`):
   - Initialize CometChat with App ID and Region
   - Happens once when the app loads

3. **User Authentication**:
   - When a user logs into PawHaven, we create/login their CometChat account
   - Uses Auth Token generated from CometChat API
   - Stored in `lib/cometchatAuth.ts`

4. **Chat Components**:
   - `CometChatMessages`: Main chat interface
   - `CometChatConversations`: List of conversations
   - Pre-built UI components from CometChat UIKit

5. **Use Cases**:
   - **User ↔ Vet**: Pet owners can message vets for consultations
   - **User ↔ Store**: Customers can ask questions about products
   - **User ↔ NGO**: Coordinate rescue operations

6. **Features**:
   - Real-time messaging
   - Read receipts
   - Typing indicators
   - File/image sharing
   - Voice/video calls (using CometChat Calls SDK)

**Benefits:**
- No need to build chat infrastructure from scratch
- Scalable and reliable
- Built-in moderation tools
- Cross-platform support

---

## 2. FEATURE-SPECIFIC QUESTIONS

### Q7: Explain the multi-role system and how verification works.

**Answer:**
Our platform supports 5 user roles with different capabilities:

**Roles:**
1. **User (Pet Owner)**: Default role, no verification needed
   - Can adopt pets, book appointments, shop, report emergencies
   
2. **Veterinarian**: Requires admin verification
   - Must provide license number, license document, specialty
   - Can manage appointments, provide consultations
   
3. **NGO**: Requires admin verification
   - Must provide registration number, registration document
   - Can post updates, accept donations, organize events
   
4. **Store Owner**: Requires admin verification
   - Must provide store details and images
   - Can list products, manage orders
   
5. **Admin**: Manually assigned
   - Can verify/reject other users
   - Full access to all features

**Verification Flow:**

1. **Signup**: User selects role and provides required documents
```typescript
const { data, error } = await supabaseClient.auth.signUp({
  email: formData.email,
  password: formData.password,
  options: {
    data: {
      role: formData.role,
      license_number: formData.license_number, // for vets
      // ... other role-specific data
    }
  }
})
```

2. **Profile Creation**: Trigger automatically creates profile with `verification_status: 'pending'`

3. **Admin Review**: Admin views pending verifications in `/admin` dashboard
   - Reviews submitted documents
   - Can approve or reject with reason

4. **Status Update**:
```typescript
// Admin approves
UPDATE profiles 
SET verification_status = 'approved' 
WHERE id = user_id;

UPDATE veterinarians 
SET verified_at = NOW(), verified_by = admin_id 
WHERE id = user_id;
```

5. **Access Control**: RLS policies check verification status:
```sql
-- Only approved vets are publicly visible
create policy "vets: approved public read"
  on public.veterinarians for select
  using (
    exists (
      select 1 from public.profiles
      where id = public.veterinarians.id
        and verification_status = 'approved'
    )
  );
```

**Pending Users:**
- Can log in but have limited access
- See "Verification Pending" message
- Cannot perform role-specific actions until approved



### Q8: How does the appointment booking system work between pet owners and veterinarians?

**Answer:**
The appointment system connects pet owners with veterinarians for consultations.

**Database Schema:**
```sql
create table public.appointments (
  id          uuid primary key,
  user_id     uuid references profiles(id),
  vet_id      uuid references veterinarians(id),
  pet_id      uuid references pets(id),
  scheduled_at timestamptz not null,
  status      appointment_status, -- pending, confirmed, completed, cancelled
  consultation_type consultation_type, -- in_person, video, phone
  duration_minutes integer,
  notes       text,
  created_at  timestamptz,
  updated_at  timestamptz
);
```

**Booking Flow:**

1. **Browse Vets**: User visits `/vets` page
   - Lists all approved veterinarians
   - Shows specialty, experience, consultation fee
   - Can filter by specialty or location

2. **Select Vet**: User clicks on a vet to view profile
   - Shows available hours (stored as JSONB)
   - Displays clinic address, bio, reviews

3. **Book Appointment**: User fills booking form
   - Selects pet from their registered pets
   - Chooses date/time from available slots
   - Selects consultation type (in-person/video/phone)
   - Adds notes about the issue

4. **Create Appointment**:
```typescript
const { data, error } = await supabaseClient
  .from('appointments')
  .insert({
    user_id: userId,
    vet_id: vetId,
    pet_id: petId,
    scheduled_at: selectedDateTime,
    consultation_type: type,
    status: 'pending',
    notes: userNotes
  })
```

5. **Vet Notification**: Vet receives notification of new appointment request

6. **Vet Confirmation**: Vet reviews and confirms/rejects
```typescript
await supabaseClient
  .from('appointments')
  .update({ status: 'confirmed' })
  .eq('id', appointmentId)
```

7. **Consultation**: On appointment day
   - In-person: User visits clinic
   - Video/Phone: CometChat integration for call

8. **Completion**: After consultation, vet marks as completed
   - Can add medical notes
   - User can leave review

**Features:**
- **Conflict Prevention**: Check vet availability before booking
- **Reminders**: Email/SMS reminders before appointment
- **Rescheduling**: Users can request reschedule
- **Cancellation**: Both parties can cancel with reason
- **History**: View past appointments and medical records

### Q9: Walk through the emergency reporting feature - how do you handle location data?

**Answer:**
The emergency reporting system allows users to report injured, lost, or abandoned animals.

**Database Schema:**
```sql
create table public.emergency_reports (
  id          uuid primary key,
  reporter_id uuid references profiles(id),
  title       text not null,
  description text,
  location    text not null,
  lat         double precision,
  lng         double precision,
  image_urls  text[],
  status      emergency_status, -- open, in_progress, resolved, closed
  category    emergency_category, -- injured, lost, abandoned, sick, other
  created_at  timestamptz,
  updated_at  timestamptz
);
```

**Reporting Flow:**

1. **Access**: User clicks "Report Emergency" button (prominent on dashboard)

2. **Form Submission**:
```typescript
interface EmergencyFormData {
  title: string
  description?: string
  location: string
  lat?: number | null
  lng?: number | null
  category: EmergencyCategory
  image_urls?: string[]
}
```

3. **Location Handling**:
   - **Manual Entry**: User types address in text field
   - **Geolocation API**: Browser's geolocation API gets coordinates
   ```typescript
   navigator.geolocation.getCurrentPosition((position) => {
     setLat(position.coords.latitude)
     setLng(position.coords.longitude)
   })
   ```
   - **Reverse Geocoding**: Convert coordinates to readable address
   - Both text address and coordinates are stored

4. **Image Upload**:
   - User can upload multiple images
   - Images uploaded to Cloudinary
   - URLs stored in `image_urls` array

5. **Create Report**:
```typescript
export async function createEmergencyReport(
  formData: EmergencyFormData,
  userId: string
) {
  const { data, error } = await supabaseClient
    .from('emergency_reports')
    .insert({
      reporter_id: userId,
      title: formData.title,
      location: formData.location,
      lat: formData.lat,
      lng: formData.lng,
      category: formData.category,
      image_urls: formData.image_urls,
      status: 'open'
    })
}
```

6. **Visibility**: Report appears on `/emergency` page
   - All authenticated users can view
   - Shows on map if coordinates available
   - NGOs and vets can respond

7. **Response Flow**:
   - NGOs/Vets can update status to "in_progress"
   - Can add comments/updates
   - Mark as "resolved" when animal is rescued
   - Reporter can close the report

**Location Features:**
- **Map View**: Display all emergencies on interactive map
- **Distance Calculation**: Show distance from user's location
- **Nearby Alerts**: Notify nearby NGOs/vets of new emergencies
- **Geofencing**: Priority alerts for emergencies in specific areas

**Privacy:**
- Exact coordinates only visible to responders
- Public view shows approximate location
- Reporter identity protected if requested

### Q10: Explain the marketplace functionality - how do orders flow from creation to delivery?

**Answer:**
The marketplace allows pet stores to sell products to pet owners.

**Complete Order Flow:**

**1. Product Listing (Store Owner)**
```typescript
await createProduct({
  name: "Premium Dog Food",
  description: "Nutritious food for adult dogs",
  price: 1500,
  stock: 100,
  category: 'food',
  images: ['url1', 'url2'],
  is_active: true
}, storeId)
```

**2. Browsing (Customer)**
- Visit `/marketplace`
- Filter by category, search by name
- View product details, reviews, ratings

**3. Add to Cart (Client-Side)**
```typescript
// Cart stored in React Context + localStorage
const { addToCart } = useCart()
addToCart({
  id: product.id,
  name: product.name,
  price: product.price,
  quantity: 1,
  image: product.images[0],
  storeId: product.store_id
})
```

**4. Checkout**
- User reviews cart items
- Enters shipping address
- Selects payment method (Razorpay/Stripe)

**5. Order Creation**
```typescript
export async function checkout(
  items: CheckoutItem[],
  userId: string,
  shippingAddress: string
) {
  // Group items by store (one order per store)
  const byStore = new Map<string, CheckoutItem[]>()
  
  for (const [storeId, storeItems] of byStore) {
    // Create order
    const { data: order } = await supabaseClient
      .from('orders')
      .insert({
        user_id: userId,
        store_id: storeId,
        total_amount: calculateTotal(storeItems),
        shipping_address: shippingAddress,
        status: 'pending'
      })
    
    // Create order items
    await supabaseClient
      .from('order_items')
      .insert(storeItems.map(item => ({
        order_id: order.id,
        product_id: item.id,
        quantity: item.quantity,
        unit_price: item.price
      })))
  }
}
```

**6. Payment Processing**
- Payment intent created via Razorpay/Stripe API
- User completes payment
- Webhook confirms payment success
- Order status remains 'pending' until store confirms

**7. Store Owner Confirmation**
- Store owner views order in `/store/orders`
- Reviews order details
- Confirms order (status → 'confirmed')
- **Stock Deduction**: Automatically deducts stock when confirmed
```typescript
await supabaseClient.rpc('decrement_product_stock', {
  p_product_id: productId,
  p_qty: quantity
})
```

**8. Order Processing**
- Store owner prepares order (status → 'processing')
- Packs items

**9. Dispatch**
- Store owner marks as shipped (status → 'shipped')
- Adds tracking number and dispatch note
```typescript
await dispatchOrder(orderId, {
  tracking_number: 'TRACK123',
  dispatch_note: 'Shipped via BlueDart'
})
```

**10. Delivery**
- Customer receives order
- Marks as delivered (status → 'delivered')
- Can leave product review

**11. Returns (if needed)**
- Customer can request return within 7 days
- Store owner reviews return request
- If approved, refund processed

**Order Status Flow:**
```
pending → confirmed → processing → shipped → delivered
                ↓
            cancelled (by user/store)
```

**Key Features:**
- **Multi-Store Orders**: One checkout creates separate orders per store
- **Stock Management**: Real-time stock updates
- **Order Tracking**: Customers track order status
- **Email Notifications**: Updates at each status change
- **Return Policy**: Category-based return eligibility



### Q11: How does the NGO product collaboration feature work? What's the revenue sharing model?

**Answer:**
This feature allows NGOs to collaborate with pet stores on products, where a percentage of sales goes to the NGO.

**Database Schema:**
```sql
create table public.ngo_product_collaborations (
  id                      uuid primary key,
  product_id              uuid references products(id),
  store_id                uuid references stores(id),
  ngo_id                  uuid references ngos(id),
  status                  ngo_collaboration_status, -- pending, accepted, rejected
  ngo_proceeds_percent    numeric(5,2), -- e.g., 15.00 for 15%
  store_message           text,
  ngo_response_message    text,
  created_at              timestamptz,
  updated_at              timestamptz
);
```

**Collaboration Flow:**

**1. Store Owner Initiates**
- Store owner selects a product
- Clicks "Add NGO Collaboration"
- Selects NGO from approved NGOs list
- Sets proceeds percentage (e.g., 15%)
- Adds message explaining the collaboration

```typescript
await supabaseClient
  .from('ngo_product_collaborations')
  .insert({
    product_id: productId,
    store_id: storeId,
    ngo_id: selectedNgoId,
    ngo_proceeds_percent: 15,
    store_message: "We'd like to donate 15% of sales to support your cause",
    status: 'pending'
  })
```

**2. NGO Reviews**
- NGO receives notification
- Views collaboration request in dashboard
- Reviews product details and percentage
- Can accept or reject

```typescript
await supabaseClient
  .from('ngo_product_collaborations')
  .update({
    status: 'accepted',
    ngo_response_message: "Thank you! We're excited to collaborate"
  })
  .eq('id', collaborationId)
```

**3. Product Display**
- Accepted collaborations show badge on product
- "15% proceeds go to [NGO Name]"
- Increases customer trust and sales

**4. Revenue Sharing (On Order)**
When a customer buys a collaboration product:

```typescript
// Calculate split
const productPrice = 1000
const ngoPercent = 15
const ngoAmount = (productPrice * ngoPercent) / 100 // 150
const storeAmount = productPrice - ngoAmount // 850

// Record in order_items with metadata
await supabaseClient
  .from('order_items')
  .insert({
    order_id: orderId,
    product_id: productId,
    quantity: 1,
    unit_price: productPrice,
    ngo_collaboration_id: collaborationId,
    ngo_proceeds: ngoAmount
  })
```

**5. Payout**
- Store receives their portion (85%)
- NGO portion (15%) held in platform
- Monthly payout to NGO's registered account
- Detailed transaction reports for both parties

**Benefits:**

**For NGOs:**
- Passive fundraising without active campaigns
- Increased visibility
- Sustainable revenue stream
- No upfront costs

**For Stores:**
- Social responsibility
- Increased sales (customers prefer ethical brands)
- Marketing benefit
- Tax deductions

**For Customers:**
- Support causes while shopping
- Transparency in contributions
- Feel-good factor

**Tracking & Reporting:**
- Dashboard shows total raised per collaboration
- Monthly reports with breakdown
- NGOs can showcase impact to donors

### Q12: Describe the community features - posts, comments, voting system.

**Answer:**
The community feature allows pet owners to connect, share experiences, and help each other.

**Database Schema:**
```sql
create table public.communities (
  id          uuid primary key,
  name        text not null,
  slug        text unique,
  description text,
  icon_url    text,
  banner_url  text,
  created_by  uuid references profiles(id),
  is_public   boolean default true,
  member_count integer default 0,
  post_count  integer default 0
);

create table public.posts (
  id            uuid primary key,
  community_id  uuid references communities(id),
  author_id     uuid references profiles(id),
  title         text not null,
  content       text,
  type          post_type, -- text, image, link
  image_urls    text[],
  link_url      text,
  vote_score    integer default 0,
  comment_count integer default 0,
  is_pinned     boolean default false
);

create table public.comments (
  id          uuid primary key,
  post_id     uuid references posts(id),
  parent_id   uuid references comments(id), -- for nested replies
  author_id   uuid references profiles(id),
  content     text not null,
  vote_score  integer default 0,
  is_deleted  boolean default false
);

create table public.post_votes (
  user_id uuid references profiles(id),
  post_id uuid references posts(id),
  vote    integer, -- 1 for upvote, -1 for downvote
  primary key (user_id, post_id)
);
```

**Features:**

**1. Communities**
- Pre-created communities: "Dog Lovers", "Cat Care", "Bird Enthusiasts", etc.
- Users can join/leave communities
- Each community has moderators

**2. Creating Posts**
```typescript
await supabaseClient
  .from('posts')
  .insert({
    community_id: communityId,
    author_id: userId,
    title: "Tips for training puppies",
    content: "Here are 5 effective techniques...",
    type: 'text'
  })
```

**Post Types:**
- **Text**: Discussion posts
- **Image**: Share pet photos with captions
- **Link**: Share articles, videos

**3. Voting System**
```typescript
// Upvote a post
async function votePost(postId: string, vote: 1 | -1) {
  // Insert or update vote
  await supabaseClient
    .from('post_votes')
    .upsert({
      user_id: userId,
      post_id: postId,
      vote: vote
    })
  
  // Update post score (via trigger or manual calculation)
  const { data: votes } = await supabaseClient
    .from('post_votes')
    .select('vote')
    .eq('post_id', postId)
  
  const score = votes.reduce((sum, v) => sum + v.vote, 0)
  
  await supabaseClient
    .from('posts')
    .update({ vote_score: score })
    .eq('id', postId)
}
```

**4. Comments & Replies**
```typescript
// Top-level comment
await supabaseClient
  .from('comments')
  .insert({
    post_id: postId,
    author_id: userId,
    content: "Great tips! I'll try these with my puppy.",
    parent_id: null
  })

// Reply to comment
await supabaseClient
  .from('comments')
  .insert({
    post_id: postId,
    author_id: userId,
    content: "Thanks! Let me know how it goes.",
    parent_id: parentCommentId // Creates nested thread
  })
```

**5. Feed Algorithm**
- **Hot**: High vote score + recent
- **New**: Sorted by creation time
- **Top**: Highest vote score (all time, this week, this month)

**6. Moderation**
- Moderators can pin important posts
- Delete inappropriate content
- Ban users from community

**7. Notifications**
- User gets notified when:
  - Someone replies to their post/comment
  - Their post gets upvoted (threshold: 10+ votes)
  - Mentioned in a comment (@username)

**User Engagement:**
- Karma points based on post/comment votes
- User flair in communities
- Achievement badges

---

## 3. SECURITY & DATA MANAGEMENT

### Q13: How do you handle file uploads (avatars, documents, product images)?

**Answer:**
We use Cloudinary for file storage and management.

**Why Cloudinary over Supabase Storage:**
- **Image Transformations**: Automatic resizing, cropping, format conversion
- **CDN**: Global content delivery for fast loading
- **Optimization**: Automatic compression and format selection (WebP for supported browsers)
- **URL-based Transformations**: Can modify images via URL parameters

**Upload Flow:**

**1. Client-Side File Selection**
```typescript
<input 
  type="file" 
  accept="image/*" 
  onChange={handleFileChange}
/>
```

**2. Upload to Cloudinary** (`lib/cloudinary/upload.ts`)
```typescript
export async function uploadToCloudinary(
  file: File,
  folder: string
): Promise<{ url: string | null; error: string | null }> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_PRESET!)
  formData.append('folder', folder)
  
  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
    {
      method: 'POST',
      body: formData
    }
  )
  
  const data = await response.json()
  return { url: data.secure_url, error: null }
}
```

**3. Store URL in Database**
```typescript
// Avatar upload
const { url } = await uploadToCloudinary(file, 'avatars')
await supabaseClient
  .from('profiles')
  .update({ avatar_url: url })
  .eq('id', userId)

// Product images (multiple)
const imageUrls = await Promise.all(
  files.map(file => uploadToCloudinary(file, `products/${productId}`))
)
await supabaseClient
  .from('products')
  .update({ images: imageUrls.map(r => r.url) })
  .eq('id', productId)
```

**File Type Handling:**

**Images** (avatars, product images, emergency photos):
- Folder: `avatars/`, `products/`, `emergency/`
- Transformations: Resize to max 1200px width
- Format: Auto (WebP for modern browsers)

**Documents** (vet licenses, NGO registrations):
- Uploaded to Cloudinary with `resource_type: 'raw'`
- Folder: `documents/vet/`, `documents/ngo/`
- Access control: Only admins and document owner can view

**Security Measures:**
- **File Size Limits**: Max 5MB for images, 10MB for documents
- **File Type Validation**: Check MIME type on client and server
- **Virus Scanning**: Cloudinary has built-in malware detection
- **Signed URLs**: For private documents, generate temporary signed URLs

**Optimization:**
```typescript
// Responsive images with Cloudinary transformations
const avatarUrl = `${baseUrl}/w_150,h_150,c_fill,g_face/${publicId}`
const thumbnailUrl = `${baseUrl}/w_300,h_300,c_fit/${publicId}`
const fullUrl = `${baseUrl}/w_1200,q_auto,f_auto/${publicId}`
```



### Q14: Explain your authentication strategy - how do you manage sessions across server and client?

**Answer:**
We use Supabase Auth with a hybrid approach for session management.

**Architecture:**

**1. Supabase Auth**
- Handles user registration, login, password reset
- Stores sessions in HTTP-only cookies (secure, not accessible via JavaScript)
- Automatic token refresh

**2. Three Types of Supabase Clients:**

**a) Client-Side (`lib/supabase/client.ts`)**
```typescript
export const supabaseClient = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
```
- Used in React components
- Reads session from cookies automatically
- Respects RLS policies

**b) Server-Side (`lib/supabase/server.ts`)**
```typescript
export async function createServerSupabaseClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        }
      }
    }
  )
}
```
- Used in Server Components and API routes
- Reads/writes session cookies
- Respects RLS policies

**c) Admin Client**
```typescript
export function createServerSupabaseAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!, // Service role key
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}
```
- Bypasses ALL RLS policies
- Used only for admin operations (user verification, etc.)
- NEVER exposed to client

**3. Session Sync Flow:**

**Initial Load:**
```
1. User visits site
2. Middleware checks session cookie
3. If valid, user is authenticated
4. Server Components can access user data
```

**Client-Side Auth State:**
```typescript
// AuthProvider wraps the app
export function AuthProvider({ children }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    session: null,
    loading: true
  })
  
  useEffect(() => {
    // Listen to auth changes
    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange(
      async (event, session) => {
        if (session) {
          const profile = await fetchProfile(session.user.id)
          setState({
            user: session.user,
            profile,
            session,
            loading: false
          })
        }
      }
    )
    
    return () => subscription.unsubscribe()
  }, [])
  
  return (
    <AuthContext.Provider value={state}>
      {children}
    </AuthContext.Provider>
  )
}
```

**4. Session Refresh:**
- Supabase automatically refreshes tokens before expiry
- Middleware updates cookies on each request
- No manual refresh needed

**5. Cross-Tab Synchronization:**
```typescript
// SessionSync component
export function SessionSync() {
  useEffect(() => {
    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          // Sync session to server cookies
          await fetch('/api/auth/session', {
            method: 'POST',
            body: JSON.stringify({
              access_token: session.access_token,
              refresh_token: session.refresh_token
            })
          })
        }
      }
    )
    return () => subscription.unsubscribe()
  }, [])
  
  return null
}
```

**Benefits:**
- **Secure**: HTTP-only cookies prevent XSS attacks
- **Seamless**: Works across server and client
- **Automatic**: Token refresh handled by Supabase
- **Consistent**: Same user state everywhere

### Q15: What measures did you take to prevent unauthorized access to sensitive data?

**Answer:**

**1. Row Level Security (RLS)**
- Database-level security
- Every table has policies
- Example: Users can only see their own orders
```sql
create policy "orders: own read"
  on public.orders for select
  using (auth.uid() = user_id);
```

**2. Role-Based Access Control (RBAC)**
```typescript
// Check user role before allowing action
if (profile.role !== 'admin') {
  throw new Error('Unauthorized')
}

// In RLS policy
create policy "profiles: admin all"
  on public.profiles for all
  using (public.is_admin());
```

**3. Middleware Protection**
- Checks authentication before page loads
- Redirects unauthenticated users
- Prevents direct URL access to protected routes

**4. API Route Protection**
```typescript
// /api/admin/verify-user/route.ts
export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  // Check if admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  
  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  
  // Proceed with admin action
}
```

**5. Input Validation**
```typescript
import { z } from 'zod'

const productSchema = z.object({
  name: z.string().min(3).max(100),
  price: z.number().positive(),
  stock: z.number().int().nonnegative(),
  category: z.enum(['food', 'toys', 'health', ...])
})

// Validate before database insert
const validated = productSchema.parse(formData)
```

**6. SQL Injection Prevention**
- Using Supabase client (parameterized queries)
- Never concatenating user input into SQL

**7. XSS Prevention**
- React automatically escapes output
- Sanitize user-generated HTML content
- Content Security Policy headers

**8. CSRF Protection**
- Supabase handles CSRF tokens
- SameSite cookie attribute

**9. Rate Limiting**
```typescript
// Prevent brute force attacks
const rateLimit = new Map()

export async function checkRateLimit(userId: string) {
  const now = Date.now()
  const userAttempts = rateLimit.get(userId) || []
  
  // Remove attempts older than 1 hour
  const recentAttempts = userAttempts.filter(
    time => now - time < 3600000
  )
  
  if (recentAttempts.length >= 10) {
    throw new Error('Too many requests')
  }
  
  recentAttempts.push(now)
  rateLimit.set(userId, recentAttempts)
}
```

**10. Environment Variables**
- Sensitive keys in `.env.local`
- Never committed to Git
- Different keys for dev/prod

**11. HTTPS Only**
- All traffic encrypted
- Secure cookies
- HSTS headers

**12. File Upload Security**
- File type validation
- Size limits
- Virus scanning (Cloudinary)
- Separate storage for public/private files

### Q16: How do you validate user roles before allowing certain actions?

**Answer:**

**1. Database Level (RLS Policies)**
```sql
-- Helper function
create or replace function public.is_admin()
returns boolean language sql stable security definer as $
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$;

-- Use in policy
create policy "stores: admin all"
  on public.stores for all
  using (public.is_admin());
```

**2. Middleware Level**
```typescript
// middleware.ts
export async function middleware(request: NextRequest) {
  const supabase = createMiddlewareSupabaseClient(request, response)
  const { data: { user } } = await supabase.auth.getUser()
  
  // Check if accessing admin routes
  if (pathname.startsWith('/admin')) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    
    // Fetch profile to check role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    
    if (profile?.role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }
  
  return response
}
```

**3. Component Level**
```typescript
// useAuth hook provides role
const { profile } = useAuth()

// Conditional rendering
{profile?.role === 'admin' && (
  <Button onClick={handleVerifyUser}>
    Verify User
  </Button>
)}

// Redirect if not authorized
useEffect(() => {
  if (profile && profile.role !== 'store_owner') {
    router.push('/dashboard')
  }
}, [profile])
```

**4. API Route Level**
```typescript
export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  // Fetch profile with role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, verification_status')
    .eq('id', user.id)
    .single()
  
  // Check role
  if (profile?.role !== 'veterinarian') {
    return NextResponse.json(
      { error: 'Only veterinarians can perform this action' },
      { status: 403 }
    )
  }
  
  // Check verification status
  if (profile.verification_status !== 'approved') {
    return NextResponse.json(
      { error: 'Your account is pending verification' },
      { status: 403 }
    )
  }
  
  // Proceed with action
}
```

**5. Service Function Level**
```typescript
export async function createProduct(
  data: ProductFormData,
  storeId: string
) {
  // RLS policy automatically checks if current user owns the store
  // If not, insert will fail with permission error
  const { data: product, error } = await supabaseClient
    .from('products')
    .insert({ ...data, store_id: storeId })
  
  if (error) {
    // Handle permission denied
    if (error.code === '42501') {
      return { product: null, error: 'You do not own this store' }
    }
    return { product: null, error: error.message }
  }
  
  return { product, error: null }
}
```

**Role Hierarchy:**
```
admin > store_owner, veterinarian, ngo > user
```

**Verification Status Check:**
```typescript
function canPerformAction(profile: Profile): boolean {
  // Users don't need verification
  if (profile.role === 'user') return true
  
  // Admins always allowed
  if (profile.role === 'admin') return true
  
  // Professional roles need approval
  return profile.verification_status === 'approved'
}
```

---

## 4. IMPLEMENTATION CHALLENGES

### Q17: What was the most challenging feature to implement and why?

**Answer:**
The most challenging feature was the **multi-store marketplace with order management and return system**.

**Challenges:**

**1. Multi-Store Order Splitting**
- Problem: User's cart can have items from multiple stores
- Solution: Split cart into separate orders per store during checkout
```typescript
// Group items by store
const byStore = new Map<string, CheckoutItem[]>()
for (const item of items) {
  if (!byStore.has(item.storeId)) byStore.set(item.storeId, [])
  byStore.get(item.storeId)!.push(item)
}

// Create one order per store
for (const [storeId, storeItems] of byStore) {
  await createOrder(storeId, storeItems, userId)
}
```

**2. Stock Management**
- Problem: Prevent overselling when multiple users buy simultaneously
- Solution: Database-level stock decrement with transaction
```sql
-- RPC function for atomic stock decrement
create or replace function decrement_product_stock(
  p_product_id uuid,
  p_qty integer
) returns void language plpgsql as $
begin
  update products
  set stock = stock - p_qty
  where id = p_product_id and stock >= p_qty;
  
  if not found then
    raise exception 'Insufficient stock';
  end if;
end;
$;
```

**3. Return Policy Logic**
- Problem: Different return policies for different product categories
- Challenge: Food/treats only returnable if unopened, medicines non-returnable
- Solution: Category-based eligibility check
```typescript
export const RETURN_POLICY: Record<string, ReturnEligibility> = {
  toys: 'eligible',
  food: 'conditional',
  health: 'ineligible'
}

function getReturnEligibility(category, deliveredAt) {
  // Check 7-day window
  const daysSince = (Date.now() - new Date(deliveredAt).getTime()) / 86_400_000
  if (daysSince > 7) return { eligible: false, reason: '7-day window passed' }
  
  // Check category policy
  const policy = RETURN_POLICY[category]
  if (policy === 'ineligible') return { eligible: false, reason: 'Non-returnable category' }
  
  return { eligible: true }
}
```

**4. Order Status Workflow**
- Problem: Complex state machine with multiple actors (customer, store, admin)
- Solution: Clear status transitions with validation
```typescript
const VALID_TRANSITIONS = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [] // terminal state
}

function canTransition(currentStatus, newStatus) {
  return VALID_TRANSITIONS[currentStatus]?.includes(newStatus)
}
```

**5. Payment Integration**
- Problem: Handle payment failures, refunds, partial refunds
- Solution: Webhook handlers for payment events
```typescript
// Razorpay webhook
export async function POST(request: Request) {
  const signature = request.headers.get('x-razorpay-signature')
  const body = await request.text()
  
  // Verify webhook signature
  const isValid = verifyWebhookSignature(body, signature)
  if (!isValid) return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  
  const event = JSON.parse(body)
  
  if (event.event === 'payment.captured') {
    // Update order status
    await updateOrderStatus(event.payload.order_id, 'confirmed')
  } else if (event.event === 'refund.processed') {
    // Update return request
    await updateReturnStatus(event.payload.refund_id, 'refunded')
  }
}
```

**Lessons Learned:**
- Start with simple flow, add complexity incrementally
- Use database constraints to enforce business rules
- Test edge cases (concurrent purchases, payment failures)
- Clear documentation of state transitions



### Q18: How did you handle the onboarding flow for different user types?

**Answer:**
Different user roles require different onboarding steps and data collection.

**Onboarding Architecture:**

**1. Signup Page** (`/signup`)
- User selects role first
- Form dynamically changes based on role
```typescript
const [selectedRole, setSelectedRole] = useState<UserRole>('user')

// Conditional form fields
{selectedRole === 'veterinarian' && (
  <>
    <Input name="license_number" label="License Number" required />
    <FileUpload name="license_document" label="Upload License" />
    <MultiSelect name="specialty" options={SPECIALTIES} />
  </>
)}

{selectedRole === 'ngo' && (
  <>
    <Input name="organization_name" label="Organization Name" required />
    <Input name="registration_number" label="Registration Number" />
    <FileUpload name="registration_document" label="Registration Certificate" />
  </>
)}
```

**2. Account Creation**
```typescript
export async function signUpWithEmail(formData: SignupFormData) {
  const { data, error } = await supabaseClient.auth.signUp({
    email: formData.email,
    password: formData.password,
    options: {
      data: {
        full_name: formData.full_name,
        role: formData.role,
        // Role-specific metadata
        ...(formData.role === 'veterinarian' && {
          license_number: formData.license_number,
          specialty: formData.specialty,
          license_document_url: formData.license_document_url
        })
      }
    }
  })
}
```

**3. Database Trigger Creates Profile**
```sql
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $
begin
  -- Create profile
  insert into public.profiles (id, email, full_name, role, verification_status)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    (new.raw_user_meta_data->>'role')::user_role,
    case 
      when (new.raw_user_meta_data->>'role')::user_role in ('veterinarian', 'ngo', 'store_owner')
      then 'pending'
      else null
    end
  );
  
  -- Create role-specific profile
  if (new.raw_user_meta_data->>'role') = 'veterinarian' then
    insert into public.veterinarians (id, license_number, specialty, license_document_url)
    values (
      new.id,
      new.raw_user_meta_data->>'license_number',
      (new.raw_user_meta_data->>'specialty')::text[],
      new.raw_user_meta_data->>'license_document_url'
    );
  end if;
  
  return new;
end;
$;
```

**4. Post-Signup Redirect**
```typescript
// After successful signup
if (requiresVerification(formData.role)) {
  // Redirect to onboarding page
  router.push('/onboarding')
} else {
  // Regular users go straight to dashboard
  router.push('/dashboard')
}
```

**5. Onboarding Page** (`/onboarding`)
Shows different content based on role:

**For Veterinarians:**
```typescript
<OnboardingLayout>
  <h1>Welcome, Dr. {profile.full_name}!</h1>
  <p>Your account is pending verification.</p>
  
  <Steps>
    <Step completed>
      ✓ Account Created
    </Step>
    <Step current>
      ⏳ Admin Review (1-2 business days)
    </Step>
    <Step>
      Complete Profile
    </Step>
  </Steps>
  
  <InfoCard>
    <h3>What happens next?</h3>
    <ul>
      <li>Our team will verify your license</li>
      <li>You'll receive an email once approved</li>
      <li>Then you can start accepting appointments</li>
    </ul>
  </InfoCard>
  
  <Button onClick={() => router.push('/profile')}>
    Complete Your Profile
  </Button>
</OnboardingLayout>
```

**For NGOs:**
```typescript
<OnboardingLayout>
  <h1>Welcome, {ngoProfile.organization_name}!</h1>
  <p>Your NGO registration is under review.</p>
  
  <Checklist>
    <ChecklistItem completed>Registration submitted</ChecklistItem>
    <ChecklistItem>Verification pending</ChecklistItem>
    <ChecklistItem>Set up donation page</ChecklistItem>
    <ChecklistItem>Create first update</ChecklistItem>
  </Checklist>
</OnboardingLayout>
```

**For Store Owners:**
```typescript
<OnboardingLayout>
  <h1>Set Up Your Store</h1>
  
  <SetupWizard>
    <WizardStep title="Store Details">
      <StoreDetailsForm />
    </WizardStep>
    
    <WizardStep title="Add Products">
      <ProductForm />
    </WizardStep>
    
    <WizardStep title="Payment Setup">
      <StripeConnectButton />
    </WizardStep>
  </SetupWizard>
</OnboardingLayout>
```

**6. Verification Status Check**
Throughout the app, we check verification status:
```typescript
function DashboardContent() {
  const { profile } = useAuth()
  
  if (profile?.verification_status === 'pending') {
    return <PendingVerificationBanner />
  }
  
  if (profile?.verification_status === 'rejected') {
    return (
      <RejectedBanner reason={profile.rejection_reason}>
        <Button onClick={handleReapply}>Reapply</Button>
      </RejectedBanner>
    )
  }
  
  // Approved or no verification needed
  return <FullDashboard />
}
```

**7. Admin Verification**
Admin reviews pending users:
```typescript
// /admin/verifications page
function VerificationQueue() {
  const pendingUsers = usePendingVerifications()
  
  return (
    <Table>
      {pendingUsers.map(user => (
        <Row key={user.id}>
          <Cell>{user.full_name}</Cell>
          <Cell>{user.role}</Cell>
          <Cell>
            <Button onClick={() => viewDocuments(user)}>
              View Documents
            </Button>
          </Cell>
          <Cell>
            <Button onClick={() => approve(user.id)}>Approve</Button>
            <Button onClick={() => reject(user.id)}>Reject</Button>
          </Cell>
        </Row>
      ))}
    </Table>
  )
}
```

**Benefits:**
- Smooth user experience
- Clear expectations
- Prevents incomplete profiles
- Guides users through setup

### Q19: Explain how you manage state across the application (cart, auth, etc.).

**Answer:**
We use a combination of React Context, localStorage, and server state.

**1. Authentication State (React Context)**
```typescript
// components/auth/auth-provider.tsx
interface AuthState {
  user: User | null
  profile: Profile | null
  session: Session | null
  loading: boolean
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    session: null,
    loading: true
  })
  
  useEffect(() => {
    // Subscribe to auth changes
    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange(
      async (event, session) => {
        if (session) {
          const profile = await fetchProfile(session.user.id)
          setState({
            user: session.user,
            profile,
            session,
            loading: false
          })
        } else {
          setState({
            user: null,
            profile: null,
            session: null,
            loading: false
          })
        }
      }
    )
    
    return () => subscription.unsubscribe()
  }, [])
  
  return (
    <AuthContext.Provider value={state}>
      {children}
    </AuthContext.Provider>
  )
}

// Usage in components
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
```

**2. Shopping Cart State (Context + localStorage)**
```typescript
// components/boty/cart-context.tsx
interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  image: string
  storeId: string
}

interface CartState {
  items: CartItem[]
  addToCart: (item: CartItem) => void
  removeFromCart: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  clearCart: () => void
  total: number
}

export function CartProvider({ children }) {
  // Initialize from localStorage
  const [items, setItems] = useState<CartItem[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('cart')
      return saved ? JSON.parse(saved) : []
    }
    return []
  })
  
  // Persist to localStorage on change
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(items))
  }, [items])
  
  const addToCart = useCallback((item: CartItem) => {
    setItems(prev => {
      const existing = prev.find(i => i.id === item.id)
      if (existing) {
        return prev.map(i =>
          i.id === item.id
            ? { ...i, quantity: i.quantity + item.quantity }
            : i
        )
      }
      return [...prev, item]
    })
  }, [])
  
  const removeFromCart = useCallback((id: string) => {
    setItems(prev => prev.filter(i => i.id !== id))
  }, [])
  
  const updateQuantity = useCallback((id: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id)
      return
    }
    setItems(prev =>
      prev.map(i => (i.id === id ? { ...i, quantity } : i))
    )
  }, [removeFromCart])
  
  const clearCart = useCallback(() => {
    setItems([])
  }, [])
  
  const total = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items]
  )
  
  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        total
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

// Usage
export function useCart() {
  const context = useContext(CartContext)
  if (!context) throw new Error('useCart must be used within CartProvider')
  return context
}
```

**3. Server State (React Query / SWR)**
For data fetching, we could use React Query:
```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

// Fetch products
export function useProducts(filters: ProductFilters) {
  return useQuery({
    queryKey: ['products', filters],
    queryFn: () => getProducts(filters)
  })
}

// Create product with optimistic update
export function useCreateProduct() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: ProductFormData) => createProduct(data, storeId),
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['products'] })
    }
  })
}

// Usage in component
function ProductList() {
  const { data: products, isLoading } = useProducts({ category: 'food' })
  const createMutation = useCreateProduct()
  
  if (isLoading) return <Spinner />
  
  return (
    <>
      {products.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
      <Button onClick={() => createMutation.mutate(newProduct)}>
        Add Product
      </Button>
    </>
  )
}
```

**4. Form State (React Hook Form)**
```typescript
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const productSchema = z.object({
  name: z.string().min(3),
  price: z.number().positive(),
  stock: z.number().int().nonnegative()
})

function ProductForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(productSchema)
  })
  
  const onSubmit = async (data) => {
    await createProduct(data)
  }
  
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('name')} />
      {errors.name && <span>{errors.name.message}</span>}
      
      <input type="number" {...register('price', { valueAsNumber: true })} />
      {errors.price && <span>{errors.price.message}</span>}
      
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Creating...' : 'Create Product'}
      </button>
    </form>
  )
}
```

**5. URL State (Next.js Router)**
```typescript
import { useRouter, useSearchParams } from 'next/navigation'

function ProductList() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const category = searchParams.get('category') || 'all'
  const search = searchParams.get('search') || ''
  
  const updateFilters = (newCategory: string) => {
    const params = new URLSearchParams(searchParams)
    params.set('category', newCategory)
    router.push(`/marketplace?${params.toString()}`)
  }
  
  return (
    <>
      <CategoryFilter value={category} onChange={updateFilters} />
      <ProductGrid category={category} search={search} />
    </>
  )
}
```

**State Management Strategy:**
- **Global App State**: React Context (auth, cart)
- **Server State**: React Query / SWR (products, orders)
- **Form State**: React Hook Form
- **URL State**: Next.js router (filters, pagination)
- **Local Component State**: useState (UI toggles, modals)

**Benefits:**
- Each state type uses appropriate tool
- No single bloated state management library
- Easy to understand and maintain
- Good performance



### Q20: What optimization techniques did you use for performance?

**Answer:**

**1. Next.js Server Components**
- Default to Server Components for static content
- Reduces JavaScript sent to client
- Faster initial page load
```typescript
// Server Component (default in App Router)
export default async function ProductPage({ params }) {
  const product = await getProductById(params.id) // Fetches on server
  
  return <ProductDetails product={product} />
}
```

**2. Image Optimization**
- Next.js Image component with automatic optimization
- Lazy loading by default
- Responsive images
```typescript
import Image from 'next/image'

<Image
  src={product.images[0]}
  alt={product.name}
  width={400}
  height={400}
  loading="lazy"
  placeholder="blur"
  blurDataURL={product.thumbnail}
/>
```

**3. Code Splitting**
- Dynamic imports for heavy components
```typescript
import dynamic from 'next/dynamic'

const CometChatMessages = dynamic(
  () => import('@/CometChat/components/CometChatMessages'),
  { 
    loading: () => <ChatSkeleton />,
    ssr: false // Don't render on server
  }
)
```

**4. Database Query Optimization**
- Select only needed columns
- Use indexes on frequently queried columns
```sql
-- Indexes for performance
create index idx_products_store on products(store_id);
create index idx_products_category on products(category);
create index idx_orders_user on orders(user_id);
create index idx_orders_store on orders(store_id);
```

```typescript
// Select specific columns
const { data } = await supabase
  .from('products')
  .select('id, name, price, images') // Not SELECT *
  .eq('store_id', storeId)
```

**5. Caching**
- Next.js automatic caching for Server Components
- Revalidation strategies
```typescript
// Revalidate every hour
export const revalidate = 3600

// Or on-demand revalidation
import { revalidatePath } from 'next/cache'

export async function createProduct(data) {
  await supabaseClient.from('products').insert(data)
  revalidatePath('/marketplace') // Refresh marketplace page
}
```

**6. Pagination**
- Load data in chunks
```typescript
const PAGE_SIZE = 20

export async function getProducts(page: number = 1) {
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1
  
  const { data, count } = await supabase
    .from('products')
    .select('*', { count: 'exact' })
    .range(from, to)
  
  return {
    products: data,
    totalPages: Math.ceil(count / PAGE_SIZE)
  }
}
```

**7. Debouncing Search**
```typescript
import { useDebouncedCallback } from 'use-debounce'

function SearchBar() {
  const [search, setSearch] = useState('')
  
  const debouncedSearch = useDebouncedCallback(
    (value) => {
      // Trigger search API call
      searchProducts(value)
    },
    500 // Wait 500ms after user stops typing
  )
  
  return (
    <input
      value={search}
      onChange={(e) => {
        setSearch(e.target.value)
        debouncedSearch(e.target.value)
      }}
    />
  )
}
```

**8. Memoization**
```typescript
import { useMemo, useCallback } from 'react'

function ProductList({ products }) {
  // Expensive calculation
  const sortedProducts = useMemo(() => {
    return products.sort((a, b) => b.rating - a.rating)
  }, [products])
  
  // Prevent function recreation
  const handleAddToCart = useCallback((product) => {
    addToCart(product)
  }, [addToCart])
  
  return sortedProducts.map(product => (
    <ProductCard
      key={product.id}
      product={product}
      onAddToCart={handleAddToCart}
    />
  ))
}
```

**9. Bundle Size Optimization**
- Tree shaking (automatic with Next.js)
- Analyze bundle with `@next/bundle-analyzer`
```bash
npm run build
# Shows bundle sizes
```

**10. CDN for Static Assets**
- Cloudinary CDN for images
- Vercel Edge Network for pages
- Automatic global distribution

**11. Prefetching**
```typescript
import Link from 'next/link'

// Next.js automatically prefetches linked pages
<Link href="/product/123" prefetch>
  View Product
</Link>
```

**12. Streaming**
```typescript
import { Suspense } from 'react'

export default function Page() {
  return (
    <>
      <Header /> {/* Renders immediately */}
      
      <Suspense fallback={<ProductsSkeleton />}>
        <Products /> {/* Streams in when ready */}
      </Suspense>
    </>
  )
}
```

**Performance Metrics:**
- Lighthouse score: 90+ on all metrics
- First Contentful Paint: < 1.5s
- Time to Interactive: < 3s
- Bundle size: < 200KB initial load

---

## 5. DATABASE & BACKEND

### Q21: Explain the trigger functions in your database (e.g., `handle_new_user`).

**Answer:**
Database triggers automatically execute functions when certain events occur.

**1. Auto-Create Profile on Signup**
```sql
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $
declare
  _role user_role;
  _verification verification_status;
begin
  -- Extract role from signup metadata
  _role := coalesce(
    (new.raw_user_meta_data->>'role')::user_role,
    'user' -- default
  );

  -- Set verification status for professional roles
  if _role in ('veterinarian', 'ngo', 'store_owner') then
    _verification := 'pending';
  else
    _verification := null;
  end if;

  -- Create profile row
  insert into public.profiles (id, email, full_name, role, verification_status, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    _role,
    _verification,
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing; -- Prevent duplicate inserts

  return new;
end;
$;

-- Attach trigger to auth.users table
create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

**Why this is useful:**
- Automatically creates profile when user signs up
- No need to manually insert profile in application code
- Ensures every user has a profile
- Handles role-based logic at database level

**2. Auto-Update Timestamp**
```sql
create or replace function public.set_updated_at()
returns trigger language plpgsql as $
begin
  new.updated_at = now();
  return new;
end;
$;

-- Apply to multiple tables
create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

create trigger trg_products_updated_at
  before update on public.products
  for each row execute procedure public.set_updated_at();

create trigger trg_orders_updated_at
  before update on public.orders
  for each row execute procedure public.set_updated_at();
```

**Why this is useful:**
- Automatically tracks when records are modified
- No need to manually set `updated_at` in application
- Consistent across all tables

**3. Update Counter Columns**
```sql
-- Increment post count when new post created
create or replace function increment_community_post_count()
returns trigger language plpgsql as $
begin
  update communities
  set post_count = post_count + 1
  where id = new.community_id;
  return new;
end;
$;

create trigger trg_increment_post_count
  after insert on posts
  for each row execute procedure increment_community_post_count();

-- Decrement when post deleted
create or replace function decrement_community_post_count()
returns trigger language plpgsql as $
begin
  update communities
  set post_count = post_count - 1
  where id = old.community_id;
  return old;
end;
$;

create trigger trg_decrement_post_count
  after delete on posts
  for each row execute procedure decrement_community_post_count();
```

**Why this is useful:**
- Keeps counts accurate without manual updates
- Improves query performance (no need to COUNT(*) every time)
- Atomic operations

**4. Cascade Soft Deletes**
```sql
-- When user deletes account, anonymize their content
create or replace function anonymize_user_content()
returns trigger language plpgsql as $
begin
  -- Update posts to show [deleted]
  update posts
  set author_id = null
  where author_id = old.id;
  
  -- Update comments
  update comments
  set author_id = null, is_deleted = true
  where author_id = old.id;
  
  return old;
end;
$;

create trigger trg_anonymize_on_delete
  before delete on profiles
  for each row execute procedure anonymize_user_content();
```

**Benefits of Triggers:**
- Enforce business logic at database level
- Automatic, no application code needed
- Consistent across all clients (web, mobile, admin tools)
- Atomic operations (part of transaction)

**Cautions:**
- Can make debugging harder (hidden logic)
- Performance impact if trigger is slow
- Document all triggers clearly

### Q22: How do you handle database migrations and schema updates?

**Answer:**

**Migration Strategy:**

**1. Version Control for Schema**
- All schema changes in SQL files
- Numbered migrations: `001_initial_schema.sql`, `002_add_reviews.sql`
- Stored in `database/migrations/` folder

**2. Migration Files**
```sql
-- database/migrations/003_add_product_reviews.sql

-- Create reviews table
create table public.product_reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  order_id uuid references orders(id) on delete set null,
  rating integer not null check (rating >= 1 and rating <= 5),
  comment text,
  created_at timestamptz not null default now(),
  unique(product_id, user_id) -- One review per user per product
);

-- Add indexes
create index idx_reviews_product on product_reviews(product_id);
create index idx_reviews_user on product_reviews(user_id);

-- Enable RLS
alter table public.product_reviews enable row level security;

-- RLS policies
create policy "reviews: public read"
  on public.product_reviews for select
  using (true);

create policy "reviews: own insert"
  on public.product_reviews for insert
  with check (auth.uid() = user_id);

create policy "reviews: own update"
  on public.product_reviews for update
  using (auth.uid() = user_id);
```

**3. Running Migrations**

**Development:**
- Run SQL directly in Supabase SQL Editor
- Or use Supabase CLI:
```bash
supabase db push
```

**Production:**
- Test migration on staging first
- Schedule during low-traffic period
- Run via Supabase Dashboard or CLI
- Monitor for errors

**4. Rollback Strategy**
```sql
-- database/migrations/003_add_product_reviews_rollback.sql

-- Drop policies
drop policy if exists "reviews: public read" on product_reviews;
drop policy if exists "reviews: own insert" on product_reviews;
drop policy if exists "reviews: own update" on product_reviews;

-- Drop table
drop table if exists public.product_reviews;
```

**5. Data Migrations**
Sometimes need to migrate existing data:
```sql
-- Add new column with default
alter table products add column category product_category default 'other';

-- Migrate existing data
update products
set category = 'food'
where name ilike '%food%' or name ilike '%treat%';

update products
set category = 'toys'
where name ilike '%toy%' or name ilike '%ball%';

-- Remove default after migration
alter table products alter column category drop default;
```

**6. Schema Versioning**
```sql
-- Track migrations
create table if not exists schema_migrations (
  version integer primary key,
  name text not null,
  applied_at timestamptz not null default now()
);

-- Record migration
insert into schema_migrations (version, name)
values (3, 'add_product_reviews');
```

**Best Practices:**
- Never modify old migrations
- Always create new migration for changes
- Test on local/staging before production
- Backup database before major migrations
- Make migrations reversible when possible
- Document breaking changes

**7. Handling Breaking Changes**
```sql
-- Bad: Dropping column immediately
alter table products drop column old_field;

-- Good: Gradual migration
-- Step 1: Add new column
alter table products add column new_field text;

-- Step 2: Migrate data
update products set new_field = old_field;

-- Step 3: Update application code to use new_field

-- Step 4: (After deploy) Drop old column
alter table products drop column old_field;
```



---

## 6. PROJECT OVERVIEW & DOMAIN

### Q23: Why is this platform needed? What problem does it solve?

**Answer:**

**Problems in Current Pet Care Ecosystem:**

**1. Fragmented Services**
- Pet owners use multiple apps: one for vet appointments, another for shopping, another for community
- No single platform for all pet care needs
- Difficult to track pet's complete health and care history

**2. Emergency Response Gaps**
- No centralized system to report injured/abandoned animals
- NGOs and rescuers miss critical alerts
- Delayed response can be fatal for animals

**3. Limited Vet Access**
- Hard to find specialized vets in your area
- No transparency in consultation fees
- Difficult to book appointments online
- No telemedicine options for remote areas

**4. NGO Funding Challenges**
- NGOs struggle with consistent funding
- Donation platforms take high commissions
- Lack of transparency in fund usage
- Difficult to reach potential donors

**5. Marketplace Trust Issues**
- Fake products, especially pet medicines
- No verified sellers
- Limited product information
- No community reviews

**6. Isolated Pet Owners**
- New pet owners lack guidance
- No platform to connect with experienced owners
- Limited access to pet care knowledge
- Breed-specific advice hard to find

**PawHaven's Solutions:**

**1. All-in-One Platform**
- Single account for all pet care needs
- Unified pet profile with complete history
- Seamless experience across features

**2. Emergency Response System**
- Real-time emergency reporting with location
- Instant alerts to nearby NGOs and vets
- Photo evidence for quick assessment
- Status tracking from report to resolution

**3. Vet Discovery & Booking**
- Search vets by specialty, location, fees
- View credentials and reviews
- Online booking with calendar integration
- Video consultations for remote areas
- Complete appointment history

**4. NGO Empowerment**
- Zero-commission donations
- Product collaboration for passive income
- Platform for updates and events
- Verified status builds trust
- Direct connection with supporters

**5. Trusted Marketplace**
- Verified store owners only
- Product reviews from verified buyers
- Category-based return policies
- Secure payments
- Order tracking

**6. Community Building**
- Connect with other pet owners
- Share experiences and advice
- Breed-specific communities
- Expert guidance from vets
- Event organization

**Impact:**

**For Pet Owners:**
- Save time (one platform vs. many)
- Better care (complete health records)
- Cost savings (compare prices, find deals)
- Peace of mind (emergency support)

**For Veterinarians:**
- Reach more clients
- Flexible consultation options
- Reduced no-shows (online booking)
- Build reputation through reviews

**For NGOs:**
- Sustainable funding
- Increased visibility
- Efficient rescue coordination
- Community support

**For Society:**
- Faster emergency response saves lives
- Better animal welfare
- Reduced stray population (through NGO support)
- Educated pet ownership

**Market Gap:**
- No existing platform combines ALL these features
- Competitors focus on one aspect (e.g., only marketplace or only vet booking)
- PawHaven is comprehensive pet care ecosystem

### Q24: Who are your target users and what are their pain points?

**Answer:**

**1. Pet Owners (Primary Users)**

**Demographics:**
- Age: 25-45 years
- Urban and semi-urban areas
- Middle to upper-middle class
- Tech-savvy, smartphone users

**Pain Points:**
- "I can't find a good vet near me"
- "My dog needs emergency care but I don't know who to call"
- "I'm a first-time pet owner and need guidance"
- "Pet supplies are expensive and I don't know if they're genuine"
- "I want to connect with other dog owners in my area"

**How PawHaven Helps:**
- Vet directory with filters and reviews
- Emergency reporting with instant alerts
- Community forums for advice
- Verified marketplace with competitive prices
- Local pet owner meetups

**2. Veterinarians**

**Demographics:**
- Licensed veterinary doctors
- Private practitioners or clinic owners
- Looking to expand client base

**Pain Points:**
- "Hard to reach new clients beyond word-of-mouth"
- "Patients miss appointments without notice"
- "Can't offer remote consultations easily"
- "Difficult to manage appointment scheduling"

**How PawHaven Helps:**
- Profile listing with specialty showcase
- Online booking system with reminders
- Video consultation integration
- Automated appointment management
- Review system builds reputation

**3. Animal Welfare NGOs**

**Demographics:**
- Registered animal rescue organizations
- Small to medium-sized NGOs
- Limited funding and resources

**Pain Points:**
- "Inconsistent donations make planning difficult"
- "High commission fees on donation platforms"
- "Miss emergency reports in our area"
- "Hard to reach potential volunteers and donors"
- "Need sustainable income sources"

**How PawHaven Helps:**
- Zero-commission donations
- Product collaboration for passive income
- Real-time emergency alerts
- Platform for updates and events
- Verified status builds credibility

**4. Pet Store Owners**

**Demographics:**
- Small to medium pet supply businesses
- Looking to expand online presence
- Want to build brand reputation

**Pain Points:**
- "High costs to build own e-commerce site"
- "Difficult to compete with large marketplaces"
- "Want to show social responsibility"
- "Need to reach more customers"

**How PawHaven Helps:**
- Ready-made marketplace platform
- Niche audience (pet owners only)
- NGO collaboration for brand image
- Lower fees than general marketplaces
- Integrated payment processing

**5. Animal Rescuers (Individual)**

**Demographics:**
- Compassionate individuals
- Active in animal welfare
- May or may not be affiliated with NGOs

**Pain Points:**
- "See injured animals but don't know how to help"
- "Can't transport animal to vet myself"
- "Need to alert others quickly"

**How PawHaven Helps:**
- Easy emergency reporting
- Alerts sent to nearby NGOs/vets
- Community support for rescue efforts
- Track rescue status

**User Personas:**

**Persona 1: Priya (Pet Owner)**
- 28, Software Engineer, Mumbai
- First-time dog owner (Golden Retriever puppy)
- Needs: Training tips, vet for vaccinations, quality food
- Uses PawHaven for: Vet booking, community advice, shopping

**Persona 2: Dr. Sharma (Veterinarian)**
- 42, Veterinary Doctor, Bangalore
- Runs small clinic, wants more clients
- Needs: Online presence, appointment management
- Uses PawHaven for: Profile listing, appointment bookings, consultations

**Persona 3: Paws Foundation (NGO)**
- Animal rescue NGO, Delhi
- 15 volunteers, limited funding
- Needs: Donations, emergency alerts, visibility
- Uses PawHaven for: Fundraising, rescue coordination, updates

**Persona 4: Rahul (Store Owner)**
- 35, Pet supply store owner, Pune
- Wants to sell online, build reputation
- Needs: E-commerce platform, trust building
- Uses PawHaven for: Product listing, order management, NGO partnerships

### Q25: How does your platform benefit NGOs and animal welfare?

**Answer:**

**Direct Benefits to NGOs:**

**1. Sustainable Funding**

**a) Zero-Commission Donations:**
- Traditional platforms charge 5-10% commission
- PawHaven charges 0% on donations
- 100% of donation reaches NGO
- Example: ₹10,000 donation = ₹10,000 to NGO (vs ₹9,000 on other platforms)

**b) Product Collaboration Revenue:**
- Partner with stores on products
- Receive 10-20% of sales automatically
- Passive income without active fundraising
- Example: Store sells ₹1,00,000 worth of collaboration products/month
  - NGO receives ₹15,000 without any effort

**c) Event Fundraisers:**
- Create fundraising events on platform
- Reach wider audience
- Track donations in real-time
- Automated receipts for donors

**2. Operational Efficiency**

**a) Emergency Response:**
- Real-time alerts for emergencies in their area
- Location-based filtering
- Photo evidence for quick assessment
- Coordinate with volunteers through platform

**b) Volunteer Management:**
- Volunteers can register through platform
- Assign tasks for rescue operations
- Track volunteer contributions

**c) Resource Tracking:**
- Track donations and expenses
- Generate reports for transparency
- Show impact to donors

**3. Visibility & Credibility**

**a) Verified Status:**
- Admin verification builds trust
- Badge shows legitimacy
- Increases donor confidence

**b) Updates & Stories:**
- Post rescue stories with photos
- Show impact of donations
- Build emotional connection with supporters

**c) Event Promotion:**
- Promote adoption drives
- Organize fundraising events
- Reach pet owner community directly

**4. Community Building**

**a) Direct Connection with Pet Owners:**
- Pet owners see NGO's work
- Easy to donate while shopping
- Community members can volunteer

**b) Adoption Platform:**
- List rescued animals for adoption
- Reach potential adopters
- Track adoption applications

**Indirect Benefits to Animal Welfare:**

**1. Faster Emergency Response**
- Anyone can report injured/abandoned animals
- NGOs get instant alerts
- Reduces response time from hours to minutes
- More lives saved

**2. Educated Pet Ownership**
- Community forums spread awareness
- Vets provide guidance
- Reduces abandonment due to lack of knowledge

**3. Support for Stray Animals**
- Emergency reporting helps strays
- NGO visibility leads to more support
- Collaboration products fund stray care

**4. Reduced Illegal Breeding**
- Verified marketplace reduces fake breeders
- Adoption promoted over buying
- Community educates about responsible breeding

**Real-World Impact Example:**

**Before PawHaven:**
- NGO receives ₹50,000/month in donations (after 10% commission = ₹45,000)
- Misses 30% of emergency reports (no centralized system)
- Spends 20 hours/month on fundraising campaigns
- Limited to local area awareness

**After PawHaven:**
- Receives ₹50,000/month in donations (0% commission = ₹50,000)
- Additional ₹15,000/month from product collaborations
- Receives 100% of emergency reports in their area
- Spends 5 hours/month (automated system)
- Nationwide visibility

**Total Impact:**
- 44% increase in funding (₹65,000 vs ₹45,000)
- 70% more emergencies handled
- 75% time saved on fundraising
- 10x reach expansion

**Transparency Features:**

**1. Donation Tracking:**
- Donors see exactly where money goes
- NGO posts updates on fund usage
- Builds long-term donor relationships

**2. Impact Metrics:**
- Animals rescued
- Funds raised
- Volunteers engaged
- Success stories

**3. Financial Reports:**
- Monthly statements
- Expense breakdown
- Audit-ready documentation

**Long-term Vision:**
- Create network of NGOs across India
- Coordinate large-scale rescue operations
- Share resources and best practices
- Unified platform for animal welfare

---

## 7. TECHNICAL DEEP DIVE

### Q26: Explain how you implemented the payment flow with Stripe/Razorpay.

**Answer:**

**Payment Architecture:**

**1. Payment Intent Creation (Server-Side)**

**Razorpay Flow:**
```typescript
// /api/razorpay/create-order/route.ts
import Razorpay from 'razorpay'

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!
})

export async function POST(request: Request) {
  const { amount, currency = 'INR', receipt } = await request.json()
  
  // Verify user is authenticated
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  try {
    // Create Razorpay order
    const order = await razorpay.orders.create({
      amount: amount * 100, // Convert to paise
      currency,
      receipt,
      notes: {
        user_id: user.id,
        email: user.email
      }
    })
    
    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    )
  }
}
```

**2. Client-Side Payment UI**
```typescript
// components/checkout/razorpay-button.tsx
'use client'

import { useEffect } from 'react'

declare global {
  interface Window {
    Razorpay: any
  }
}

export function RazorpayButton({ amount, onSuccess }) {
  useEffect(() => {
    // Load Razorpay script
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    document.body.appendChild(script)
  }, [])
  
  const handlePayment = async () => {
    // Create order on server
    const response = await fetch('/api/razorpay/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount,
        receipt: `order_${Date.now()}`
      })
    })
    
    const { orderId, amount: orderAmount, currency } = await response.json()
    
    // Open Razorpay checkout
    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      amount: orderAmount,
      currency,
      name: 'PawHaven',
      description: 'Pet supplies purchase',
      order_id: orderId,
      handler: async function (response) {
        // Payment successful
        await verifyPayment(response)
        onSuccess(response)
      },
      prefill: {
        name: user.full_name,
        email: user.email
      },
      theme: {
        color: '#8B7355'
      }
    }
    
    const razorpay = new window.Razorpay(options)
    razorpay.open()
  }
  
  return (
    <button onClick={handlePayment}>
      Pay ₹{amount}
    </button>
  )
}
```

**3. Payment Verification**
```typescript
// /api/razorpay/verify/route.ts
import crypto from 'crypto'

export async function POST(request: Request) {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature
  } = await request.json()
  
  // Verify signature
  const body = razorpay_order_id + '|' + razorpay_payment_id
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
    .update(body)
    .digest('hex')
  
  if (expectedSignature !== razorpay_signature) {
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    )
  }
  
  // Payment verified - update order status
  const supabase = await createServerSupabaseClient()
  await supabase
    .from('orders')
    .update({
      status: 'confirmed',
      payment_id: razorpay_payment_id,
      payment_status: 'paid'
    })
    .eq('razorpay_order_id', razorpay_order_id)
  
  return NextResponse.json({ success: true })
}
```

**4. Webhook Handler (for async events)**
```typescript
// /api/razorpay/webhook/route.ts
export async function POST(request: Request) {
  const signature = request.headers.get('x-razorpay-signature')
  const body = await request.text()
  
  // Verify webhook signature
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET!)
    .update(body)
    .digest('hex')
  
  if (signature !== expectedSignature) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }
  
  const event = JSON.parse(body)
  
  // Handle different events
  switch (event.event) {
    case 'payment.captured':
      await handlePaymentCaptured(event.payload.payment.entity)
      break
    
    case 'payment.failed':
      await handlePaymentFailed(event.payload.payment.entity)
      break
    
    case 'refund.processed':
      await handleRefundProcessed(event.payload.refund.entity)
      break
  }
  
  return NextResponse.json({ received: true })
}

async function handlePaymentCaptured(payment) {
  const supabase = createServerSupabaseAdminClient()
  
  await supabase
    .from('orders')
    .update({
      status: 'confirmed',
      payment_status: 'captured',
      payment_id: payment.id
    })
    .eq('razorpay_order_id', payment.order_id)
  
  // Send confirmation email
  await sendOrderConfirmationEmail(payment.order_id)
}
```

**Stripe Flow (Similar Structure):**
```typescript
// /api/stripe/create-payment-intent/route.ts
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16'
})

export async function POST(request: Request) {
  const { amount, currency = 'inr' } = await request.json()
  
  const paymentIntent = await stripe.paymentIntents.create({
    amount: amount * 100,
    currency,
    automatic_payment_methods: {
      enabled: true
    }
  })
  
  return NextResponse.json({
    clientSecret: paymentIntent.client_secret
  })
}
```

**Security Measures:**

1. **Server-Side Order Creation**: Never trust client for amount
2. **Signature Verification**: Verify all webhooks
3. **HTTPS Only**: All payment communication encrypted
4. **PCI Compliance**: Payment details never touch our server
5. **Idempotency**: Prevent duplicate charges
6. **Audit Logging**: Log all payment events

**Error Handling:**

```typescript
try {
  await processPayment()
} catch (error) {
  if (error.code === 'card_declined') {
    showError('Your card was declined. Please try another card.')
  } else if (error.code === 'insufficient_funds') {
    showError('Insufficient funds. Please try another payment method.')
  } else {
    showError('Payment failed. Please try again.')
    // Log error for debugging
    logPaymentError(error)
  }
}
```

**Refund Flow:**
```typescript
export async function processRefund(orderId: string, amount: number) {
  // Get payment ID from order
  const { data: order } = await supabase
    .from('orders')
    .select('payment_id, payment_gateway')
    .eq('id', orderId)
    .single()
  
  if (order.payment_gateway === 'razorpay') {
    await razorpay.payments.refund(order.payment_id, {
      amount: amount * 100
    })
  } else if (order.payment_gateway === 'stripe') {
    await stripe.refunds.create({
      payment_intent: order.payment_id,
      amount: amount * 100
    })
  }
  
  // Update order status
  await supabase
    .from('orders')
    .update({ status: 'refunded', refund_amount: amount })
    .eq('id', orderId)
}
```



---

## 8. FUTURE ENHANCEMENTS & SCALABILITY

### Q27: How would your application handle 10,000 concurrent users?

**Answer:**

**Current Architecture Strengths:**

**1. Serverless Infrastructure (Vercel + Supabase)**
- Auto-scales based on demand
- No server management needed
- Pay only for what you use

**2. Database Optimization**
- Connection pooling (Supabase handles this)
- Indexed queries for fast lookups
- RLS policies prevent unauthorized data access

**Scaling Strategies:**

**1. Database Level**

**a) Read Replicas:**
```typescript
// Use read replica for heavy read operations
const readClient = createClient(
  process.env.SUPABASE_READ_REPLICA_URL!,
  process.env.SUPABASE_ANON_KEY!
)

// Write to primary
await supabaseClient.from('orders').insert(order)

// Read from replica
const products = await readClient.from('products').select('*')
```

**b) Database Indexing:**
```sql
-- Composite indexes for common queries
create index idx_products_store_category on products(store_id, category);
create index idx_orders_user_status on orders(user_id, status);
create index idx_appointments_vet_date on appointments(vet_id, scheduled_at);
```

**c) Query Optimization:**
```typescript
// Bad: N+1 query problem
for (const order of orders) {
  const items = await getOrderItems(order.id) // N queries
}

// Good: Single query with join
const orders = await supabase
  .from('orders')
  .select('*, items:order_items(*)')
```

**2. Caching Layer**

**a) Redis for Session/Cart:**
```typescript
import Redis from 'ioredis'

const redis = new Redis(process.env.REDIS_URL)

// Cache frequently accessed data
export async function getProduct(id: string) {
  // Check cache first
  const cached = await redis.get(`product:${id}`)
  if (cached) return JSON.parse(cached)
  
  // Fetch from database
  const product = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single()
  
  // Cache for 1 hour
  await redis.setex(`product:${id}`, 3600, JSON.stringify(product))
  
  return product
}
```

**b) CDN Caching:**
- Static assets cached at edge
- API responses cached with appropriate headers
```typescript
export async function GET() {
  return NextResponse.json(data, {
    headers: {
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400'
    }
  })
}
```

**3. Load Balancing**
- Vercel automatically distributes traffic
- Edge functions run close to users
- Global CDN for static content

**4. Database Connection Pooling**
```typescript
// Supabase handles this, but for custom setup:
import { Pool } from 'pg'

const pool = new Pool({
  max: 20, // Maximum connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
})
```

**5. Rate Limiting**
```typescript
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '10 s'), // 10 requests per 10 seconds
})

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for')
  const { success } = await ratelimit.limit(ip)
  
  if (!success) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429 }
    )
  }
  
  // Process request
}
```

**6. Async Processing**
```typescript
// Use queue for heavy operations
import { Queue } from 'bullmq'

const emailQueue = new Queue('emails')

// Add to queue instead of processing immediately
await emailQueue.add('send-order-confirmation', {
  orderId: order.id,
  email: user.email
})

// Worker processes queue in background
```

**7. Monitoring & Alerts**
```typescript
// Vercel Analytics
import { Analytics } from '@vercel/analytics'

// Custom metrics
import { track } from '@vercel/analytics'

track('order_created', {
  amount: order.total_amount,
  items: order.items.length
})

// Error tracking
import * as Sentry from '@sentry/nextjs'

Sentry.captureException(error)
```

**Performance Targets:**
- Response time: < 200ms (p95)
- Database queries: < 50ms
- Page load: < 2s
- API availability: 99.9%

**Bottleneck Identification:**
```typescript
// Add timing logs
console.time('fetch-products')
const products = await getProducts()
console.timeEnd('fetch-products')

// Use Vercel Speed Insights
import { SpeedInsights } from '@vercel/speed-insights/next'
```

**Horizontal Scaling:**
- Serverless functions scale automatically
- Database can be upgraded to larger instance
- Add read replicas for read-heavy workload
- Implement sharding for massive scale

### Q28: What features would you add if you had more time?

**Answer:**

**Phase 1: Enhanced Features (1-2 months)**

**1. AI-Powered Recommendations**
```typescript
// Product recommendations based on pet profile
export async function getRecommendedProducts(petId: string) {
  const pet = await getPet(petId)
  
  // AI model considers: species, breed, age, past purchases
  const recommendations = await aiModel.predict({
    species: pet.species,
    breed: pet.breed,
    age: calculateAge(pet.birth_date),
    pastPurchases: await getUserPurchases(pet.owner_id)
  })
  
  return recommendations
}
```

**2. Telemedicine Integration**
- Video consultations with screen sharing
- Digital prescriptions
- Medical record sharing
- Payment integration for consultations

**3. Pet Health Tracking**
- Vaccination reminders
- Weight tracking charts
- Medication schedules
- Health milestones

**4. Advanced Search**
```typescript
// Elasticsearch for better search
import { Client } from '@elastic/elasticsearch'

const client = new Client({ node: process.env.ELASTICSEARCH_URL })

// Full-text search with filters
const results = await client.search({
  index: 'products',
  body: {
    query: {
      bool: {
        must: [
          { match: { name: searchQuery } }
        ],
        filter: [
          { term: { category: 'food' } },
          { range: { price: { lte: 1000 } } }
        ]
      }
    }
  }
})
```

**Phase 2: Mobile App (2-3 months)**

**1. React Native App**
- Native iOS and Android apps
- Push notifications for emergencies
- Camera integration for emergency reports
- Offline mode for viewing pet records

**2. Location-Based Features**
- Find nearby vets on map
- Pet-friendly places
- Walking trails
- Dog parks

**Phase 3: Advanced Features (3-6 months)**

**1. Pet Insurance Integration**
- Compare insurance plans
- Direct claim filing
- Integration with vet records

**2. Breeding Management**
- Pedigree tracking
- Breeding records
- Puppy/kitten management

**3. Pet Training Platform**
- Video courses
- Live training sessions
- Progress tracking
- Certification

**4. Subscription Service**
```typescript
// Monthly pet supply subscription
interface Subscription {
  id: string
  user_id: string
  pet_id: string
  products: {
    product_id: string
    quantity: number
  }[]
  frequency: 'weekly' | 'monthly'
  next_delivery: string
  status: 'active' | 'paused' | 'cancelled'
}

// Auto-create orders
async function processSubscriptions() {
  const dueSubscriptions = await getDueSubscriptions()
  
  for (const sub of dueSubscriptions) {
    await createOrder({
      user_id: sub.user_id,
      items: sub.products,
      is_subscription: true
    })
    
    // Schedule next delivery
    await updateNextDelivery(sub.id)
  }
}
```

**5. Social Features**
- Pet profiles (like Instagram for pets)
- Photo contests
- Pet of the month
- Badges and achievements

**6. Analytics Dashboard**
```typescript
// For store owners
interface StoreAnalytics {
  revenue: {
    today: number
    week: number
    month: number
    trend: 'up' | 'down'
  }
  topProducts: Product[]
  customerDemographics: {
    age_groups: Record<string, number>
    locations: Record<string, number>
  }
  conversionRate: number
}
```

**7. Multi-Language Support**
```typescript
// i18n integration
import { useTranslation } from 'next-i18next'

function ProductCard({ product }) {
  const { t } = useTranslation('common')
  
  return (
    <div>
      <h3>{product.name}</h3>
      <button>{t('add_to_cart')}</button>
    </div>
  )
}
```

**8. Voice Assistant Integration**
- "Alexa, book a vet appointment for my dog"
- "Hey Google, order dog food from PawHaven"

**9. Blockchain for Pet Records**
- Immutable vaccination records
- Ownership transfer tracking
- Breeding lineage verification

**10. AR Features**
- Virtual try-on for pet accessories
- Visualize furniture in your home
- Interactive pet care guides

**Priority Order:**
1. AI recommendations (high impact, medium effort)
2. Mobile app (high impact, high effort)
3. Health tracking (medium impact, low effort)
4. Telemedicine (high impact, medium effort)
5. Advanced search (medium impact, medium effort)

### Q29: How would you implement analytics and monitoring?

**Answer:**

**1. Application Performance Monitoring (APM)**

**Vercel Analytics:**
```typescript
// app/layout.tsx
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
```

**Custom Event Tracking:**
```typescript
import { track } from '@vercel/analytics'

// Track business events
export function trackOrderCreated(order: Order) {
  track('order_created', {
    order_id: order.id,
    amount: order.total_amount,
    items_count: order.items.length,
    store_id: order.store_id
  })
}

export function trackProductView(product: Product) {
  track('product_viewed', {
    product_id: product.id,
    category: product.category,
    price: product.price
  })
}
```

**2. Error Tracking (Sentry)**

```typescript
// sentry.client.config.ts
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
  environment: process.env.NODE_ENV,
  
  beforeSend(event, hint) {
    // Filter out sensitive data
    if (event.request) {
      delete event.request.cookies
      delete event.request.headers?.authorization
    }
    return event
  }
})

// Usage
try {
  await createOrder(data)
} catch (error) {
  Sentry.captureException(error, {
    tags: {
      section: 'checkout',
      user_id: userId
    },
    extra: {
      order_data: data
    }
  })
  throw error
}
```

**3. Database Monitoring**

```sql
-- Slow query log
create table query_logs (
  id uuid primary key default gen_random_uuid(),
  query text,
  duration_ms integer,
  executed_at timestamptz default now()
);

-- Log slow queries (via trigger or application)
create or replace function log_slow_query()
returns trigger language plpgsql as $
begin
  if new.duration_ms > 1000 then
    insert into query_logs (query, duration_ms)
    values (new.query, new.duration_ms);
  end if;
  return new;
end;
$;
```

**4. Business Metrics Dashboard**

```typescript
// lib/analytics/metrics.ts
export async function getBusinessMetrics(period: 'day' | 'week' | 'month') {
  const supabase = await createServerSupabaseClient()
  
  // Revenue
  const { data: revenue } = await supabase
    .from('orders')
    .select('total_amount')
    .eq('status', 'delivered')
    .gte('created_at', getStartDate(period))
  
  const totalRevenue = revenue?.reduce((sum, o) => sum + o.total_amount, 0) || 0
  
  // New users
  const { count: newUsers } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', getStartDate(period))
  
  // Active users
  const { count: activeUsers } = await supabase
    .from('orders')
    .select('user_id', { count: 'exact', head: true })
    .gte('created_at', getStartDate(period))
  
  // Top products
  const { data: topProducts } = await supabase
    .from('order_items')
    .select('product_id, quantity, product:products(name)')
    .gte('created_at', getStartDate(period))
  
  return {
    revenue: totalRevenue,
    newUsers,
    activeUsers,
    topProducts: aggregateTopProducts(topProducts)
  }
}
```

**5. Real-Time Monitoring Dashboard**

```typescript
// app/admin/analytics/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { supabaseClient } from '@/lib/supabase/client'

export default function AnalyticsDashboard() {
  const [metrics, setMetrics] = useState(null)
  
  useEffect(() => {
    // Real-time subscription to orders
    const subscription = supabaseClient
      .channel('orders')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'orders'
      }, (payload) => {
        // Update metrics in real-time
        updateMetrics(payload.new)
      })
      .subscribe()
    
    return () => subscription.unsubscribe()
  }, [])
  
  return (
    <div>
      <MetricCard title="Revenue Today" value={metrics?.revenue} />
      <MetricCard title="Orders Today" value={metrics?.orders} />
      <MetricCard title="Active Users" value={metrics?.activeUsers} />
      <Chart data={metrics?.revenueChart} />
    </div>
  )
}
```

**6. Logging Strategy**

```typescript
// lib/logger.ts
import pino from 'pino'

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true
    }
  }
})

export function logInfo(message: string, data?: object) {
  logger.info({ ...data }, message)
}

export function logError(message: string, error: Error, data?: object) {
  logger.error({ ...data, error: error.stack }, message)
}

// Usage
logInfo('Order created', { orderId: order.id, amount: order.total_amount })
logError('Payment failed', error, { userId, orderId })
```

**7. Uptime Monitoring**

```typescript
// Use external service like UptimeRobot or implement custom
// /api/health/route.ts
export async function GET() {
  try {
    // Check database
    const supabase = await createServerSupabaseClient()
    await supabase.from('profiles').select('id').limit(1)
    
    // Check external services
    await fetch('https://api.razorpay.com/v1/health')
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'up',
        payment: 'up'
      }
    })
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: error.message
      },
      { status: 503 }
    )
  }
}
```

**8. User Behavior Analytics**

```typescript
// Track user journey
export function trackUserJourney(event: string, properties?: object) {
  // Send to analytics service
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', event, properties)
  }
}

// Usage
trackUserJourney('product_added_to_cart', {
  product_id: product.id,
  product_name: product.name,
  price: product.price
})

trackUserJourney('checkout_started', {
  cart_value: total,
  items_count: items.length
})

trackUserJourney('purchase_completed', {
  order_id: order.id,
  revenue: order.total_amount
})
```

**Metrics to Track:**
- Revenue (daily, weekly, monthly)
- User acquisition and retention
- Conversion rates (visitor → signup → purchase)
- Average order value
- Cart abandonment rate
- Page load times
- Error rates
- API response times
- Database query performance
- User engagement (time on site, pages per session)

---

## 9. DEMONSTRATION TIPS

### Key Features to Demo:

**1. User Registration & Role Selection**
- Show different signup forms for different roles
- Demonstrate document upload for professionals
- Show verification pending state

**2. Vet Booking Flow**
- Browse vets with filters
- View vet profile
- Book appointment
- Show confirmation

**3. Emergency Reporting**
- Create emergency report with location
- Upload images
- Show on emergency feed
- Demonstrate status updates

**4. Marketplace Shopping**
- Browse products
- Add to cart
- Checkout process
- Payment (use test mode)
- Order tracking

**5. Admin Panel**
- View pending verifications
- Approve/reject users
- View all orders
- Analytics dashboard

**6. NGO Features**
- Create donation campaign
- Product collaboration request
- Post updates
- View donations received

**7. Community**
- Create post
- Comment and reply
- Upvote/downvote
- Join community

### Common Demo Mistakes to Avoid:

1. **Don't use production data** - Use test accounts
2. **Prepare test data** - Have sample products, users ready
3. **Test beforehand** - Ensure everything works
4. **Have backup plan** - Screenshots/video if live demo fails
5. **Explain as you go** - Don't just click, explain the logic

### Questions to Prepare For:

- "What happens if payment fails?"
- "How do you prevent duplicate orders?"
- "What if two users book the same vet slot?"
- "How do you handle refunds?"
- "What if a user uploads inappropriate content?"

---

## 10. FINAL TIPS

### During Viva:

1. **Be Confident**: You built this, you know it best
2. **Be Honest**: If you don't know something, say so
3. **Think Aloud**: Explain your thought process
4. **Use Examples**: Real-world scenarios help
5. **Show Enthusiasm**: Talk about what you learned
6. **Accept Feedback**: Be open to suggestions

### If You Don't Know an Answer:

"That's a great question. While I haven't implemented that specific feature, here's how I would approach it..."

### Closing Statement:

"This project taught me full-stack development, database design, authentication, payment integration, and most importantly, how to build a platform that solves real problems. I'm proud of what I've built and excited to continue improving it."

---

## QUICK REFERENCE

### Tech Stack Summary:
- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Supabase
- **Database**: PostgreSQL (Supabase)
- **Auth**: Supabase Auth
- **Payments**: Razorpay, Stripe
- **Storage**: Cloudinary
- **Chat**: CometChat
- **Deployment**: Vercel

### Key Numbers:
- 5 user roles
- 9 main features
- 15+ database tables
- 50+ API endpoints
- 100+ React components

### Project Timeline:
- Planning & Design: 1 week
- Database Schema: 1 week
- Authentication: 1 week
- Core Features: 6 weeks
- Testing & Refinement: 1 week
- **Total**: ~10 weeks

Good luck with your viva! 🎓🐾
