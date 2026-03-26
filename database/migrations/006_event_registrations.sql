-- Migration 006: Event Registrations
-- Replaces external registration_url with in-app registration for NGO and community events.

-- ─── NGO Event Registrations ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ngo_event_registrations (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id   UUID NOT NULL REFERENCES ngo_events(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(event_id, user_id)
);

ALTER TABLE ngo_event_registrations ENABLE ROW LEVEL SECURITY;

-- Users can see their own registrations
CREATE POLICY "Users can view own ngo event registrations"
  ON ngo_event_registrations FOR SELECT
  USING (auth.uid() = user_id);

-- NGO owners can see all registrations for their events
CREATE POLICY "NGO owners can view event registrations"
  ON ngo_event_registrations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM ngo_events
      WHERE ngo_events.id = event_id
        AND ngo_events.ngo_id = auth.uid()
    )
  );

-- Any authenticated user can register
CREATE POLICY "Authenticated users can register for ngo events"
  ON ngo_event_registrations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can unregister themselves
CREATE POLICY "Users can unregister from ngo events"
  ON ngo_event_registrations FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS ngo_event_registrations_event_id_idx ON ngo_event_registrations(event_id);
CREATE INDEX IF NOT EXISTS ngo_event_registrations_user_id_idx  ON ngo_event_registrations(user_id);

-- ─── Community Event Registrations ───────────────────────────────────────────

CREATE TABLE IF NOT EXISTS community_event_registrations (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id   UUID NOT NULL REFERENCES community_events(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(event_id, user_id)
);

ALTER TABLE community_event_registrations ENABLE ROW LEVEL SECURITY;

-- Users can see their own registrations
CREATE POLICY "Users can view own community event registrations"
  ON community_event_registrations FOR SELECT
  USING (auth.uid() = user_id);

-- Event creators can see all registrations for their events
CREATE POLICY "Event creators can view community event registrations"
  ON community_event_registrations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM community_events
      WHERE community_events.id = event_id
        AND community_events.creator_id = auth.uid()
    )
  );

-- Any authenticated user can register
CREATE POLICY "Authenticated users can register for community events"
  ON community_event_registrations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can unregister themselves
CREATE POLICY "Users can unregister from community events"
  ON community_event_registrations FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS community_event_registrations_event_id_idx ON community_event_registrations(event_id);
CREATE INDEX IF NOT EXISTS community_event_registrations_user_id_idx  ON community_event_registrations(user_id);
