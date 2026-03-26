-- ============================================================
-- Furever - Phase 2/3/4 Migration
-- Run this in Supabase Dashboard → SQL Editor
-- Safe to run on top of the base schema.sql
-- ============================================================

-- ─── Appointments: new columns ───────────────────────────────
alter table public.appointments
  add column if not exists consultation_type text
    not null default 'in_person'
    check (consultation_type in ('in_person', 'video', 'phone')),
  add column if not exists duration_minutes integer not null default 60;

-- ─── Emergency reports: new columns ──────────────────────────
alter table public.emergency_reports
  add column if not exists category text
    not null default 'other'
    check (category in ('injured', 'lost', 'abandoned', 'sick', 'other'));

-- ─── Performance indexes ──────────────────────────────────────
create index if not exists idx_emergency_category
  on public.emergency_reports(category);

create index if not exists idx_emergency_coords
  on public.emergency_reports(lat, lng)
  where lat is not null and lng is not null;

create index if not exists idx_appointments_status
  on public.appointments(status);

create index if not exists idx_appointments_scheduled
  on public.appointments(scheduled_at);

-- ─── Realtime (run after enabling Realtime in dashboard) ─────
-- Enable these after turning on Realtime in the Supabase dashboard:
--   Project Settings → Realtime → Enable for tables below

alter publication supabase_realtime add table public.emergency_reports;
alter publication supabase_realtime add table public.appointments;

-- ─── Verify new columns exist ────────────────────────────────
do $$
begin
  assert exists (
    select 1 from information_schema.columns
    where table_name='appointments' and column_name='consultation_type'
  ), 'consultation_type column missing from appointments';

  assert exists (
    select 1 from information_schema.columns
    where table_name='emergency_reports' and column_name='category'
  ), 'category column missing from emergency_reports';

  raise notice 'Phase 2/3/4 migration completed successfully.';
end$$;
