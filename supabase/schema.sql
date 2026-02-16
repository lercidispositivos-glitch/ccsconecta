-- ============================================
-- CCS Conecta - Database Schema V3
-- Run this in Supabase SQL Editor
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. PROFILES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  company_name TEXT,
  whatsapp TEXT,
  photo_url TEXT,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved')),
  points_balance INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Helper function to check if current user is admin (bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper function to get current user status (bypasses RLS)
CREATE OR REPLACE FUNCTION public.get_my_status()
RETURNS TEXT AS $$
  SELECT status FROM public.profiles
  WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Drop old policies if they exist
DROP POLICY IF EXISTS "Users can view approved profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
DROP POLICY IF EXISTS "System can insert profiles" ON public.profiles;

-- Policies for profiles (using helper functions to avoid recursion)
CREATE POLICY "Users can view approved profiles"
  ON public.profiles FOR SELECT
  USING (
    status = 'approved'
    OR id = auth.uid()
    OR public.is_admin()
  );

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "Admins can update any profile"
  ON public.profiles FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "System can insert profiles"
  ON public.profiles FOR INSERT
  WITH CHECK (id = auth.uid());

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_profiles_updated ON public.profiles;
CREATE TRIGGER on_profiles_updated
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Auto-create profile on signup  
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, photo_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 2. WORKSHOPS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.workshops (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  leader_name TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'users',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.workshops ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone authenticated can view workshops" ON public.workshops;
CREATE POLICY "Anyone authenticated can view workshops"
  ON public.workshops FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Seed workshops data (only if empty)
INSERT INTO public.workshops (name, description, leader_name, icon)
SELECT * FROM (VALUES
  ('Networking', 'Integração entre conselheiros, pitch empresarial e portfólio de serviços', 'Fernando Molinari', 'handshake'),
  ('Diagnóstico', 'Índice de maturidade empresarial e análise estratégica', 'James Garcia Mommensohn', 'bar-chart-3'),
  ('Desenvolvimento', 'Capacitação técnica, treinamento e desenvolvimento profissional', 'Simone Boer Ramos', 'graduation-cap')
) AS t(name, description, leader_name, icon)
WHERE NOT EXISTS (SELECT 1 FROM public.workshops LIMIT 1);

-- ============================================
-- 3. EVENT TYPES TABLE
-- ============================================
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

-- Seed default event types (only if empty)
INSERT INTO public.event_types (name, label, color, default_points)
SELECT * FROM (VALUES
  ('reuniao', 'Reunião Ordinária', 'blue', 10),
  ('oficina', 'Oficina', 'purple', 20),
  ('acao_social', 'Ação Social', 'emerald', 30)
) AS t(name, label, color, default_points)
WHERE NOT EXISTS (SELECT 1 FROM public.event_types LIMIT 1);

-- ============================================
-- 4. EVENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  date TIMESTAMPTZ NOT NULL,
  location TEXT NOT NULL DEFAULT 'ACIM - Maringá',
  address TEXT,
  maps_url TEXT,
  type TEXT NOT NULL DEFAULT 'reuniao',
  is_recurring BOOLEAN NOT NULL DEFAULT false,
  recurrence_rule TEXT,
  workshop_id UUID REFERENCES public.workshops(id) ON DELETE SET NULL,
  qr_code_secret TEXT NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  points_value INTEGER NOT NULL DEFAULT 10,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add columns if table already exists (safe for re-runs)
DO $$ BEGIN
  ALTER TABLE public.events ADD COLUMN IF NOT EXISTS address TEXT;
  ALTER TABLE public.events ADD COLUMN IF NOT EXISTS maps_url TEXT;
  ALTER TABLE public.events ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN NOT NULL DEFAULT false;
  ALTER TABLE public.events ADD COLUMN IF NOT EXISTS recurrence_rule TEXT;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Remove old CHECK constraint if exists (allows dynamic event types)
DO $$ BEGIN
  ALTER TABLE public.events DROP CONSTRAINT IF EXISTS events_type_check;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Drop old policies
DROP POLICY IF EXISTS "Approved members can view events" ON public.events;
DROP POLICY IF EXISTS "Admins can manage events" ON public.events;
DROP POLICY IF EXISTS "Admins can insert events" ON public.events;
DROP POLICY IF EXISTS "Admins can update events" ON public.events;
DROP POLICY IF EXISTS "Admins can delete events" ON public.events;
DROP POLICY IF EXISTS "Allow all for authenticated" ON public.events;

CREATE POLICY "Approved members can view events"
  ON public.events FOR SELECT
  USING (
    public.is_admin()
    OR public.get_my_status() = 'approved'
  );

CREATE POLICY "Admins can insert events"
  ON public.events FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update events"
  ON public.events FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "Admins can delete events"
  ON public.events FOR DELETE
  USING (public.is_admin());

-- ============================================
-- 4. CHECKINS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.checkins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  checked_in_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, event_id)
);

ALTER TABLE public.checkins ENABLE ROW LEVEL SECURITY;

-- Drop old policies
DROP POLICY IF EXISTS "Users can view own checkins" ON public.checkins;
DROP POLICY IF EXISTS "Admins can view all checkins" ON public.checkins;
DROP POLICY IF EXISTS "Users can insert own checkins" ON public.checkins;

CREATE POLICY "Users can view own checkins"
  ON public.checkins FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all checkins"
  ON public.checkins FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Users can insert own checkins"
  ON public.checkins FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- ============================================
-- 5. FUNCTION: Process Check-in + Award Points
-- ============================================
CREATE OR REPLACE FUNCTION public.process_checkin(
  p_event_id UUID,
  p_qr_secret TEXT
)
RETURNS JSON AS $$
DECLARE
  v_event public.events;
  v_existing public.checkins;
  v_points INTEGER;
BEGIN
  -- Verify event exists and QR code matches
  SELECT * INTO v_event
  FROM public.events
  WHERE id = p_event_id AND qr_code_secret = p_qr_secret;

  IF v_event IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'QR Code inválido ou evento não encontrado');
  END IF;

  -- Check for duplicate check-in
  SELECT * INTO v_existing
  FROM public.checkins
  WHERE user_id = auth.uid() AND event_id = p_event_id;

  IF v_existing IS NOT NULL THEN
    RETURN json_build_object('success', false, 'error', 'Você já fez check-in neste evento');
  END IF;

  -- Get points value
  v_points := v_event.points_value;

  -- Insert check-in
  INSERT INTO public.checkins (user_id, event_id)
  VALUES (auth.uid(), p_event_id);

  -- Update points balance
  UPDATE public.profiles
  SET points_balance = points_balance + v_points
  WHERE id = auth.uid();

  RETURN json_build_object(
    'success', true,
    'points_awarded', v_points,
    'event_title', v_event.title
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
