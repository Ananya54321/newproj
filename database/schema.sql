-- ============================================================
-- FUREVER — Supabase Database Schema
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- ─── Extensions ─────────────────────────────────────────────
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm"; -- for fuzzy text search

-- ─── Enums ───────────────────────────────────────────────────
create type user_role as enum (
  'user',
  'veterinarian',
  'ngo',
  'store_owner',
  'admin'
);

create type verification_status as enum (
  'pending',
  'approved',
  'rejected'
);

create type emergency_status as enum (
  'open',
  'in_progress',
  'resolved',
  'closed'
);

create type appointment_status as enum (
  'pending',
  'confirmed',
  'completed',
  'cancelled'
);

-- ─── profiles ────────────────────────────────────────────────
-- Extends auth.users. Created automatically via trigger on signup
-- or explicitly in the auth callback route.
create table public.profiles (
  id                  uuid        primary key references auth.users(id) on delete cascade,
  email               text        not null,
  full_name           text,
  avatar_url          text,
  role                user_role   not null default 'user',
  verification_status verification_status,
  phone               text,
  bio                 text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

comment on table public.profiles is 'Public profile extending auth.users. Role-based access is gated here.';

-- Auto-update updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

-- Auto-create a minimal profile row when a new auth user is created
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  _role user_role;
  _verification verification_status;
begin
  -- Read role from user_metadata, default to 'user'
  _role := coalesce(
    (new.raw_user_meta_data->>'role')::user_role,
    'user'
  );

  -- Set verification_status only for roles that require it
  if _role in ('veterinarian', 'ngo', 'store_owner') then
    _verification := 'pending';
  else
    _verification := null;
  end if;

  insert into public.profiles (id, email, full_name, role, verification_status, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    _role,
    _verification,
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─── veterinarians ───────────────────────────────────────────
create table public.veterinarians (
  id                      uuid        primary key references public.profiles(id) on delete cascade,
  license_number          text,
  license_document_url    text,       -- Supabase Storage path
  resume_url              text,
  specialty               text[],
  years_experience        integer,
  clinic_name             text,
  clinic_address          text,
  consultation_fee        numeric(10,2),
  available_hours         jsonb,      -- { "mon": ["09:00","17:00"], ... }
  bio                     text,
  verified_at             timestamptz,
  verified_by             uuid        references public.profiles(id),
  rejection_reason        text
);

-- ─── ngos ────────────────────────────────────────────────────
create table public.ngos (
  id                          uuid    primary key references public.profiles(id) on delete cascade,
  organization_name           text    not null,
  registration_number         text,
  registration_document_url   text,
  mission_statement           text,
  website_url                 text,
  address                     text,
  accepts_donations           boolean not null default true,
  verified_at                 timestamptz,
  verified_by                 uuid    references public.profiles(id),
  rejection_reason            text
);

-- ─── stores ──────────────────────────────────────────────────
create table public.stores (
  id               uuid        primary key default gen_random_uuid(),
  owner_id         uuid        not null references public.profiles(id) on delete cascade,
  name             text        not null,
  slug             text        unique,
  description      text,
  logo_url         text,
  banner_url       text,
  address          text,
  is_active        boolean     not null default false,
  verified_at      timestamptz,
  rejection_reason text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create trigger trg_stores_updated_at
  before update on public.stores
  for each row execute procedure public.set_updated_at();

create index idx_stores_owner on public.stores(owner_id);

-- ─── pets ────────────────────────────────────────────────────
create table public.pets (
  id             uuid        primary key default gen_random_uuid(),
  owner_id       uuid        not null references public.profiles(id) on delete cascade,
  name           text        not null,
  species        text        not null,
  breed          text,
  birth_date     date,
  weight_kg      numeric(5,2),
  avatar_url     text,
  medical_notes  text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create trigger trg_pets_updated_at
  before update on public.pets
  for each row execute procedure public.set_updated_at();

create index idx_pets_owner on public.pets(owner_id);

-- ─── products ────────────────────────────────────────────────
create table public.products (
  id          uuid        primary key default gen_random_uuid(),
  store_id    uuid        not null references public.stores(id) on delete cascade,
  name        text        not null,
  description text,
  price       numeric(10,2) not null,
  stock       integer     not null default 0,
  images      text[],     -- Supabase Storage paths
  is_active   boolean     not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger trg_products_updated_at
  before update on public.products
  for each row execute procedure public.set_updated_at();

create index idx_products_store on public.products(store_id);

-- ─── appointments ────────────────────────────────────────────
create table public.appointments (
  id          uuid               primary key default gen_random_uuid(),
  user_id     uuid               not null references public.profiles(id) on delete cascade,
  vet_id      uuid               not null references public.veterinarians(id) on delete cascade,
  pet_id      uuid               references public.pets(id) on delete set null,
  scheduled_at timestamptz       not null,
  status      appointment_status not null default 'pending',
  notes       text,
  created_at  timestamptz        not null default now(),
  updated_at  timestamptz        not null default now()
);

create trigger trg_appointments_updated_at
  before update on public.appointments
  for each row execute procedure public.set_updated_at();

create index idx_appointments_user on public.appointments(user_id);
create index idx_appointments_vet  on public.appointments(vet_id);

-- ─── emergency_reports ───────────────────────────────────────
create table public.emergency_reports (
  id          uuid             primary key default gen_random_uuid(),
  reporter_id uuid             not null references public.profiles(id) on delete cascade,
  title       text             not null,
  description text,
  location    text             not null,
  lat         double precision,
  lng         double precision,
  image_urls  text[],
  status      emergency_status not null default 'open',
  created_at  timestamptz      not null default now(),
  updated_at  timestamptz      not null default now()
);

create trigger trg_emergency_updated_at
  before update on public.emergency_reports
  for each row execute procedure public.set_updated_at();

create index idx_emergency_reporter on public.emergency_reports(reporter_id);
create index idx_emergency_status   on public.emergency_reports(status);

-- ─── donations ───────────────────────────────────────────────
create table public.donations (
  id         uuid        primary key default gen_random_uuid(),
  donor_id   uuid        references public.profiles(id) on delete set null,
  ngo_id     uuid        not null references public.ngos(id) on delete cascade,
  amount     numeric(12,2) not null,
  currency   char(3)     not null default 'USD',
  message    text,
  created_at timestamptz not null default now()
);

create index idx_donations_ngo   on public.donations(ngo_id);
create index idx_donations_donor on public.donations(donor_id);


-- ============================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================

-- Enable RLS on all tables
alter table public.profiles         enable row level security;
alter table public.veterinarians    enable row level security;
alter table public.ngos             enable row level security;
alter table public.stores           enable row level security;
alter table public.pets             enable row level security;
alter table public.products         enable row level security;
alter table public.appointments     enable row level security;
alter table public.emergency_reports enable row level security;
alter table public.donations        enable row level security;

-- ── Helper: is the caller an admin? ─────────────────────────
create or replace function public.is_admin()
returns boolean language sql stable security definer as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- ── Helper: is the caller's account approved? ────────────────
create or replace function public.is_approved()
returns boolean language sql stable security definer as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and (verification_status = 'approved' or verification_status is null)
  );
$$;


-- ─── profiles RLS ────────────────────────────────────────────

-- Anyone (even anonymous) can read public profile info
create policy "profiles: public read"
  on public.profiles for select
  using (true);

-- Users can only update their own profile
create policy "profiles: own update"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Admins can do anything
create policy "profiles: admin all"
  on public.profiles for all
  using (public.is_admin());

-- Service role (via admin client) can insert (used in trigger / callback)
create policy "profiles: service insert"
  on public.profiles for insert
  with check (true); -- guarded by trigger / service role key


-- ─── veterinarians RLS ───────────────────────────────────────

-- Approved vets are publicly readable
create policy "vets: approved public read"
  on public.veterinarians for select
  using (
    exists (
      select 1 from public.profiles
      where id = public.veterinarians.id
        and verification_status = 'approved'
    )
    or auth.uid() = public.veterinarians.id
    or public.is_admin()
  );

-- Vets can update their own row
create policy "vets: own update"
  on public.veterinarians for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Insert allowed for the vet themselves
create policy "vets: own insert"
  on public.veterinarians for insert
  with check (auth.uid() = id);

-- Admins manage all
create policy "vets: admin all"
  on public.veterinarians for all
  using (public.is_admin());


-- ─── ngos RLS ────────────────────────────────────────────────

-- Approved NGOs are publicly readable
create policy "ngos: approved public read"
  on public.ngos for select
  using (
    exists (
      select 1 from public.profiles
      where id = public.ngos.id
        and verification_status = 'approved'
    )
    or auth.uid() = public.ngos.id
    or public.is_admin()
  );

create policy "ngos: own update"
  on public.ngos for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "ngos: own insert"
  on public.ngos for insert
  with check (auth.uid() = id);

create policy "ngos: admin all"
  on public.ngos for all
  using (public.is_admin());


-- ─── stores RLS ──────────────────────────────────────────────

-- Active/verified stores are publicly readable
create policy "stores: active public read"
  on public.stores for select
  using (
    is_active = true
    or owner_id = auth.uid()
    or public.is_admin()
  );

create policy "stores: owner insert"
  on public.stores for insert
  with check (auth.uid() = owner_id);

create policy "stores: owner update"
  on public.stores for update
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

create policy "stores: owner delete"
  on public.stores for delete
  using (auth.uid() = owner_id);

create policy "stores: admin all"
  on public.stores for all
  using (public.is_admin());


-- ─── pets RLS ────────────────────────────────────────────────

-- Only the owner can see/manage their pets
create policy "pets: own all"
  on public.pets for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

-- Vets can read pet records for their appointments
create policy "pets: vet read"
  on public.pets for select
  using (
    exists (
      select 1 from public.appointments
      where pet_id = public.pets.id
        and vet_id = auth.uid()
    )
  );

create policy "pets: admin all"
  on public.pets for all
  using (public.is_admin());


-- ─── products RLS ────────────────────────────────────────────

-- Active products are publicly readable
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

-- Store owner manages their products
create policy "products: store owner all"
  on public.products for all
  using (
    exists (
      select 1 from public.stores
      where id = public.products.store_id
        and owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.stores
      where id = public.products.store_id
        and owner_id = auth.uid()
    )
  );

create policy "products: admin all"
  on public.products for all
  using (public.is_admin());


-- ─── appointments RLS ────────────────────────────────────────

-- Users see their own appointments; vets see appointments with them
create policy "appointments: participant read"
  on public.appointments for select
  using (
    auth.uid() = user_id
    or auth.uid() = vet_id
    or public.is_admin()
  );

create policy "appointments: user insert"
  on public.appointments for insert
  with check (
    auth.uid() = user_id
    and public.is_approved()
  );

-- Both parties can update status
create policy "appointments: participant update"
  on public.appointments for update
  using (auth.uid() = user_id or auth.uid() = vet_id)
  with check (auth.uid() = user_id or auth.uid() = vet_id);

create policy "appointments: user delete"
  on public.appointments for delete
  using (auth.uid() = user_id);

create policy "appointments: admin all"
  on public.appointments for all
  using (public.is_admin());


-- ─── emergency_reports RLS ───────────────────────────────────

-- All authenticated users can read emergency reports
create policy "emergency: auth read"
  on public.emergency_reports for select
  using (auth.role() = 'authenticated');

-- Authenticated users can report emergencies
create policy "emergency: auth insert"
  on public.emergency_reports for insert
  with check (
    auth.uid() = reporter_id
    and auth.role() = 'authenticated'
    and public.is_approved()
  );

-- Reporters can update their own reports
create policy "emergency: reporter update"
  on public.emergency_reports for update
  using (auth.uid() = reporter_id)
  with check (auth.uid() = reporter_id);

create policy "emergency: admin all"
  on public.emergency_reports for all
  using (public.is_admin());


-- ─── donations RLS ───────────────────────────────────────────

-- Donors see their own donations; NGOs see donations to them
create policy "donations: participant read"
  on public.donations for select
  using (
    auth.uid() = donor_id
    or auth.uid() = ngo_id
    or public.is_admin()
  );

-- Authenticated users can make donations to approved NGOs
create policy "donations: auth insert"
  on public.donations for insert
  with check (
    auth.uid() = donor_id
    and exists (
      select 1 from public.profiles
      where id = public.donations.ngo_id
        and verification_status = 'approved'
    )
  );

create policy "donations: admin all"
  on public.donations for all
  using (public.is_admin());


-- ============================================================
-- STORAGE BUCKETS
-- Create these in the Supabase Dashboard → Storage
-- ============================================================
-- bucket: avatars        (public)
-- bucket: vet-documents  (private) — license, resume uploads
-- bucket: ngo-documents  (private)
-- bucket: product-images (public)
-- bucket: emergency-media (public)


-- ============================================================
-- INITIAL ADMIN SETUP (run manually after seeding)
-- ============================================================
-- UPDATE public.profiles SET role = 'admin' WHERE email = 'admin@furever.app';
