-- ============================================================
-- Phase 11 Migration: Product Returns + Community Events
-- Run this in Supabase SQL Editor
-- ============================================================

-- ── return_requests ───────────────────────────────────────────────────────────
-- reason_type:
--   damaged      → full refund incl. delivery, requires images + admin approval
--   wrong_item   → full refund incl. delivery, requires images + admin approval
--   changed_mind → product-only refund, auto after item collected
--
-- status flow:
--   pending → collecting → collected → refunded        (changed_mind: auto)
--   pending → collecting → collected → approved → refunded  (damaged/wrong)
--   pending → rejected                                 (admin rejects)

CREATE TABLE IF NOT EXISTS return_requests (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id      UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reason_type   TEXT NOT NULL CHECK (reason_type IN ('damaged', 'wrong_item', 'changed_mind')),
  reason_note   TEXT,
  image_urls    TEXT[] DEFAULT '{}',
  status        TEXT NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'collecting', 'collected', 'approved', 'rejected', 'refunded')),
  refund_type   TEXT CHECK (refund_type IN ('full', 'product_only')),
  refund_amount DECIMAL(10,2),
  admin_notes   TEXT,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE (order_id)
);

CREATE INDEX IF NOT EXISTS return_requests_order_id_idx  ON return_requests(order_id);
CREATE INDEX IF NOT EXISTS return_requests_user_id_idx   ON return_requests(user_id);
CREATE INDEX IF NOT EXISTS return_requests_status_idx    ON return_requests(status);

ALTER TABLE return_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own return requests"
  ON return_requests FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create return requests"
  ON return_requests FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all return requests"
  ON return_requests FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Trigger: auto-update updated_at
CREATE OR REPLACE FUNCTION update_return_requests_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER return_requests_updated_at
  BEFORE UPDATE ON return_requests
  FOR EACH ROW EXECUTE FUNCTION update_return_requests_updated_at();


-- ── community_events ──────────────────────────────────────────────────────────
-- Any community member can create events for their community.
-- type: meetup | social | training | other

CREATE TABLE IF NOT EXISTS community_events (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id     UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  creator_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title            TEXT NOT NULL,
  description      TEXT,
  type             TEXT NOT NULL DEFAULT 'meetup'
                   CHECK (type IN ('meetup', 'social', 'training', 'other')),
  location         TEXT,
  event_date       TIMESTAMPTZ NOT NULL,
  image_url        TEXT,
  registration_url TEXT,
  is_active        BOOLEAN DEFAULT true,
  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS community_events_community_id_idx ON community_events(community_id);
CREATE INDEX IF NOT EXISTS community_events_event_date_idx   ON community_events(event_date);

ALTER TABLE community_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active community events"
  ON community_events FOR SELECT USING (is_active = true);

-- Community members can create events
CREATE POLICY "Community members can create events"
  ON community_events FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM community_members
      WHERE community_id = community_events.community_id
        AND user_id = auth.uid()
    )
  );

-- Creator or community moderator can update/delete their events
CREATE POLICY "Creator or moderator can manage events"
  ON community_events FOR ALL USING (
    auth.uid() = creator_id
    OR EXISTS (
      SELECT 1 FROM community_members
      WHERE community_id = community_events.community_id
        AND user_id = auth.uid()
        AND role = 'moderator'
    )
  );

-- Admins can manage all
CREATE POLICY "Admins can manage all community events"
  ON community_events FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Trigger: auto-update updated_at
CREATE OR REPLACE FUNCTION update_community_events_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER community_events_updated_at
  BEFORE UPDATE ON community_events
  FOR EACH ROW EXECUTE FUNCTION update_community_events_updated_at();
