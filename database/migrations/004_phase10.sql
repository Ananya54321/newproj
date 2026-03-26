-- ============================================================
-- Phase 10 Migration
-- Run this in Supabase SQL Editor
-- ============================================================

-- ── profiles: add slug, address, lat/lng ─────────────────────────────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS slug VARCHAR(50) UNIQUE,
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS latitude DECIMAL(10,8),
  ADD COLUMN IF NOT EXISTS longitude DECIMAL(11,8);

CREATE UNIQUE INDEX IF NOT EXISTS profiles_slug_idx ON profiles(slug) WHERE slug IS NOT NULL;

-- ── veterinarians: social links + extra docs ──────────────────────────────────
ALTER TABLE veterinarians
  ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS extra_document_urls TEXT[] DEFAULT '{}';

-- ── ngos: social links + extra docs ──────────────────────────────────────────
ALTER TABLE ngos
  ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS extra_document_urls TEXT[] DEFAULT '{}';

-- ── stores: store images + social links ──────────────────────────────────────
ALTER TABLE stores
  ADD COLUMN IF NOT EXISTS store_images TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}';

-- ── orders: dispatch fields ───────────────────────────────────────────────────
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS dispatch_note TEXT,
  ADD COLUMN IF NOT EXISTS tracking_number TEXT;

-- ── stripe_connections ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS stripe_connections (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  stripe_account_id TEXT NOT NULL,
  charges_enabled   BOOLEAN DEFAULT false,
  details_submitted BOOLEAN DEFAULT false,
  created_at        TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id)
);

ALTER TABLE stripe_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own stripe connection"
  ON stripe_connections FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own stripe connection"
  ON stripe_connections FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own stripe connection"
  ON stripe_connections FOR UPDATE USING (auth.uid() = user_id);

-- ── ngo_events ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ngo_events (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ngo_id           UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title            TEXT NOT NULL,
  description      TEXT,
  type             TEXT NOT NULL CHECK (type IN ('meetup', 'fundraiser')),
  location         TEXT,
  event_date       TIMESTAMPTZ NOT NULL,
  image_url        TEXT,
  registration_url TEXT,
  goal_amount      DECIMAL(10,2),
  raised_amount    DECIMAL(10,2) DEFAULT 0,
  is_active        BOOLEAN DEFAULT true,
  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ngo_events_ngo_id_idx    ON ngo_events(ngo_id);
CREATE INDEX IF NOT EXISTS ngo_events_event_date_idx ON ngo_events(event_date);

ALTER TABLE ngo_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active ngo events"
  ON ngo_events FOR SELECT USING (is_active = true);

CREATE POLICY "NGO owners can manage their events"
  ON ngo_events FOR ALL USING (auth.uid() = ngo_id);

-- ── product_reviews ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS product_reviews (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  order_id   UUID REFERENCES orders(id) ON DELETE SET NULL,
  rating     INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment    TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (product_id, user_id)
);

CREATE INDEX IF NOT EXISTS product_reviews_product_id_idx ON product_reviews(product_id);

ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view reviews"
  ON product_reviews FOR SELECT USING (true);

CREATE POLICY "Users can insert own reviews"
  ON product_reviews FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reviews"
  ON product_reviews FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reviews"
  ON product_reviews FOR DELETE USING (auth.uid() = user_id);

-- ── RLS for profiles slug (allow public SELECT on slug) ───────────────────────
-- profiles already has SELECT policy - slug column is automatically included.

-- ── updated_at trigger for ngo_events ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_ngo_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_ngo_events_updated_at ON ngo_events;
CREATE TRIGGER trg_ngo_events_updated_at
  BEFORE UPDATE ON ngo_events
  FOR EACH ROW EXECUTE FUNCTION update_ngo_events_updated_at();
