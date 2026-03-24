-- ============================================================
-- Migration 005: Fix missing columns from schema.sql gaps
-- Run this in Supabase SQL Editor
-- ============================================================

-- ─── donations: add is_anonymous + status ────────────────────
-- schema.sql created the donations table without these columns.
-- migration 003 tried CREATE TABLE IF NOT EXISTS but since the
-- table already existed, these columns were never added.

ALTER TABLE public.donations
  ADD COLUMN IF NOT EXISTS is_anonymous boolean NOT NULL DEFAULT false;

ALTER TABLE public.donations
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'completed';

-- ─── emergency_reports: add category ─────────────────────────
-- migration 001 is supposed to add this, but run this as a safety net.

ALTER TABLE public.emergency_reports
  ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'other';

-- ─── appointments: add consultation_type + duration_minutes ──
-- migration 001 adds these; this is a safety net.

ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS consultation_type text NOT NULL DEFAULT 'in-person';

ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS duration_minutes integer NOT NULL DEFAULT 30;
