-- ============================================================
-- Migration 007: NGO Product Collaborations
-- Run this in Supabase SQL Editor
-- ============================================================

-- ── ngo_product_collaborations ────────────────────────────────────────────────
-- Status flow:
--   pending  → store owner sent request, NGO hasn't responded
--   accepted → NGO accepted, product becomes featured
--   rejected → NGO declined

CREATE TABLE IF NOT EXISTS ngo_product_collaborations (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id            UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  store_id              UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  ngo_id                UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status                TEXT NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending', 'accepted', 'rejected')),
  ngo_proceeds_percent  DECIMAL(5,2) NOT NULL CHECK (ngo_proceeds_percent > 0 AND ngo_proceeds_percent <= 100),
  store_message         TEXT,
  ngo_response_message  TEXT,
  created_at            TIMESTAMPTZ DEFAULT now(),
  updated_at            TIMESTAMPTZ DEFAULT now(),
  UNIQUE (product_id)   -- one active collaboration per product
);

CREATE INDEX IF NOT EXISTS collab_product_idx  ON ngo_product_collaborations(product_id);
CREATE INDEX IF NOT EXISTS collab_store_idx    ON ngo_product_collaborations(store_id);
CREATE INDEX IF NOT EXISTS collab_ngo_idx      ON ngo_product_collaborations(ngo_id);
CREATE INDEX IF NOT EXISTS collab_status_idx   ON ngo_product_collaborations(status);

ALTER TABLE ngo_product_collaborations ENABLE ROW LEVEL SECURITY;

-- Public: anyone can read accepted collaborations (for marketplace display)
CREATE POLICY "collab: public read accepted"
  ON ngo_product_collaborations FOR SELECT
  USING (status = 'accepted');

-- Store owner: can read all collaborations for their own store
CREATE POLICY "collab: store owner read own"
  ON ngo_product_collaborations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM stores
      WHERE stores.id = ngo_product_collaborations.store_id
        AND stores.owner_id = auth.uid()
    )
  );

-- NGO: can read collaborations directed to them
CREATE POLICY "collab: ngo read own"
  ON ngo_product_collaborations FOR SELECT
  USING (auth.uid() = ngo_id);

-- Store owner: can insert (request) collaborations for their own products
CREATE POLICY "collab: store owner insert"
  ON ngo_product_collaborations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM stores
      WHERE stores.id = ngo_product_collaborations.store_id
        AND stores.owner_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM products
      WHERE products.id = ngo_product_collaborations.product_id
        AND products.store_id = ngo_product_collaborations.store_id
    )
  );

-- NGO: can update (accept/reject) collaborations directed to them
CREATE POLICY "collab: ngo update own"
  ON ngo_product_collaborations FOR UPDATE
  USING (auth.uid() = ngo_id)
  WITH CHECK (auth.uid() = ngo_id);

-- Store owner: can delete (cancel) their own collaboration requests
CREATE POLICY "collab: store owner delete"
  ON ngo_product_collaborations FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM stores
      WHERE stores.id = ngo_product_collaborations.store_id
        AND stores.owner_id = auth.uid()
    )
  );

-- Admins: full access
CREATE POLICY "collab: admin all"
  ON ngo_product_collaborations FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_ngo_product_collaborations_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER ngo_product_collaborations_updated_at
  BEFORE UPDATE ON ngo_product_collaborations
  FOR EACH ROW EXECUTE FUNCTION update_ngo_product_collaborations_updated_at();
