-- ============================================
-- Migration: Add event_types table + recurring events
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Create event_types table
CREATE TABLE IF NOT EXISTS public.event_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT 'blue',
  default_points INTEGER NOT NULL DEFAULT 10,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.event_types ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can view event_types" ON public.event_types;
DROP POLICY IF EXISTS "Admins can insert event_types" ON public.event_types;
DROP POLICY IF EXISTS "Admins can update event_types" ON public.event_types;
DROP POLICY IF EXISTS "Admins can delete event_types" ON public.event_types;

CREATE POLICY "Authenticated can view event_types"
  ON public.event_types FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can insert event_types"
  ON public.event_types FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update event_types"
  ON public.event_types FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "Admins can delete event_types"
  ON public.event_types FOR DELETE
  USING (public.is_admin());

-- 2. Seed default event types
INSERT INTO public.event_types (name, label, color, default_points)
SELECT * FROM (VALUES
  ('reuniao', 'Reunião Ordinária', 'blue', 10),
  ('oficina', 'Oficina', 'purple', 20),
  ('acao_social', 'Ação Social', 'emerald', 30)
) AS t(name, label, color, default_points)
WHERE NOT EXISTS (SELECT 1 FROM public.event_types LIMIT 1);

-- 3. Add recurring event columns to events table
DO $$ BEGIN
  ALTER TABLE public.events ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN NOT NULL DEFAULT false;
  ALTER TABLE public.events ADD COLUMN IF NOT EXISTS recurrence_rule TEXT;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- 4. Remove old CHECK constraint (allows dynamic event types)
DO $$ BEGIN
  ALTER TABLE public.events DROP CONSTRAINT IF EXISTS events_type_check;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
