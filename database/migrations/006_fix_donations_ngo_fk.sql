-- ============================================================
-- Migration 006: Fix donations.ngo_id FK to reference profiles
-- ============================================================
-- schema.sql created donations with ngo_id referencing ngos(id),
-- but the service layer expects it to reference profiles(id).
-- Since ngos.id = profiles.id (1:1), all data remains valid.
-- Run this in Supabase SQL Editor.
-- ============================================================

ALTER TABLE public.donations
  DROP CONSTRAINT IF EXISTS donations_ngo_id_fkey;

ALTER TABLE public.donations
  ADD CONSTRAINT donations_ngo_id_fkey
    FOREIGN KEY (ngo_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
