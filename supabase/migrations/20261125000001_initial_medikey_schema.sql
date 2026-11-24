-- ============================================================================
-- MediKey Database Migration: 20261125000001_initial_medikey_schema.sql
-- Description: Core Schema, Schema-Qualified Crypto, RLS, Storage & Secure RPC
-- ============================================================================

-- 1. Enable pgcrypto in extensions schema
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA extensions;

-- ============================================================================
-- 2. User Profiles Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  health_id text UNIQUE NOT NULL,
  full_name text NOT NULL DEFAULT '',
  email text,
  phone text DEFAULT '',
  age int CHECK (age >= 0 AND age <= 130),
  blood_group text DEFAULT 'Unknown',
  avatar_url text DEFAULT '',
  allergies text DEFAULT '',
  current_medications text DEFAULT '',
  chronic_conditions text DEFAULT '',
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- ============================================================================
-- 3. Medical History & Doctor Details Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.medical_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  surgeries text DEFAULT '',
  family_history text DEFAULT '',
  primary_doctor text DEFAULT '',
  doctor_phone text DEFAULT '',
  preferred_hospital text DEFAULT '',
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT uq_medical_history_user UNIQUE(user_id)
);

-- ============================================================================
-- 4. Emergency Contacts Table (In Case of Emergency - ICE)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.emergency_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  relationship text DEFAULT '',
  phone text NOT NULL,
  is_primary boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- ============================================================================
-- 5. Medical Documents Table (Records, Labs, Certificates)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.medical_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  category text NOT NULL CHECK (category IN ('medical', 'labs', 'certificates')),
  file_path text NOT NULL,
  file_name text NOT NULL,
  file_size bigint,
  mime_type text,
  notes text DEFAULT '',
  document_date date DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- ============================================================================
-- 6. Prescriptions Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.prescriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  medication_name text NOT NULL,
  dosage text DEFAULT '',
  frequency text DEFAULT '',
  instructions text DEFAULT '',
  prescribing_doctor text DEFAULT '',
  is_active boolean DEFAULT true NOT NULL,
  start_date date,
  end_date date,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- ============================================================================
-- 7. Health Notes Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.health_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  note text NOT NULL,
  category text DEFAULT 'general',
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- ============================================================================
-- 8. Appointments Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  clinic_name text NOT NULL,
  appointment_date date NOT NULL,
  appointment_time text DEFAULT '',
  reason text DEFAULT '',
  status text DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- ============================================================================
-- 9. Medical Kit Inventory Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.medical_kit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_name text NOT NULL,
  quantity text DEFAULT '1',
  notes text DEFAULT '',
  expiry_date date,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- ============================================================================
-- 10. Emergency Shares Table (Cryptographic Token Access)
-- Fixed: Uses extensions.gen_random_bytes(20) to guarantee schema resolution
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.emergency_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  share_token text UNIQUE NOT NULL DEFAULT encode(extensions.gen_random_bytes(20), 'hex'),
  is_revoked boolean DEFAULT false NOT NULL,
  expires_at timestamptz,
  consented_fields jsonb NOT NULL DEFAULT '{"name": true, "blood": true, "allergies": true, "conditions": true, "medicines": true, "emergency_contacts": true}'::jsonb,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- ============================================================================
-- 11. User Settings Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.user_settings (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  language text DEFAULT 'en' NOT NULL,
  theme text DEFAULT 'light' NOT NULL,
  notifications_enabled boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- ============================================================================
-- 12. Indexes for Query Performance
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_profiles_health_id ON public.profiles(health_id);
CREATE INDEX IF NOT EXISTS idx_emergency_contacts_user_id ON public.emergency_contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_medical_documents_user_id ON public.medical_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_user_id ON public.prescriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_health_notes_user_id ON public.health_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_user_id ON public.appointments(user_id);
CREATE INDEX IF NOT EXISTS idx_medical_kit_user_id ON public.medical_kit(user_id);
CREATE INDEX IF NOT EXISTS idx_emergency_shares_token ON public.emergency_shares(share_token);

-- ============================================================================
-- 13. Enable Row Level Security (RLS) on All 10 Tables
-- ============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_kit ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT TO authenticated USING ((select auth.uid()) = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING ((select auth.uid()) = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = id);

-- Medical History Policies
DROP POLICY IF EXISTS "Users can view own medical history" ON public.medical_history;
CREATE POLICY "Users can view own medical history" ON public.medical_history
  FOR SELECT TO authenticated USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own medical history" ON public.medical_history;
CREATE POLICY "Users can update own medical history" ON public.medical_history
  FOR UPDATE TO authenticated USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own medical history" ON public.medical_history;
CREATE POLICY "Users can insert own medical history" ON public.medical_history
  FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = user_id);

-- Emergency Contacts Policies
DROP POLICY IF EXISTS "Users can view own emergency contacts" ON public.emergency_contacts;
CREATE POLICY "Users can view own emergency contacts" ON public.emergency_contacts
  FOR SELECT TO authenticated USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own emergency contacts" ON public.emergency_contacts;
CREATE POLICY "Users can insert own emergency contacts" ON public.emergency_contacts
  FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own emergency contacts" ON public.emergency_contacts;
CREATE POLICY "Users can update own emergency contacts" ON public.emergency_contacts
  FOR UPDATE TO authenticated USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own emergency contacts" ON public.emergency_contacts;
CREATE POLICY "Users can delete own emergency contacts" ON public.emergency_contacts
  FOR DELETE TO authenticated USING ((select auth.uid()) = user_id);

-- Medical Documents Policies
DROP POLICY IF EXISTS "Users can view own medical documents" ON public.medical_documents;
CREATE POLICY "Users can view own medical documents" ON public.medical_documents
  FOR SELECT TO authenticated USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own medical documents" ON public.medical_documents;
CREATE POLICY "Users can insert own medical documents" ON public.medical_documents
  FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own medical documents" ON public.medical_documents;
CREATE POLICY "Users can update own medical documents" ON public.medical_documents
  FOR UPDATE TO authenticated USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own medical documents" ON public.medical_documents;
CREATE POLICY "Users can delete own medical documents" ON public.medical_documents
  FOR DELETE TO authenticated USING ((select auth.uid()) = user_id);

-- Prescriptions Policies
DROP POLICY IF EXISTS "Users can view own prescriptions" ON public.prescriptions;
CREATE POLICY "Users can view own prescriptions" ON public.prescriptions
  FOR SELECT TO authenticated USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own prescriptions" ON public.prescriptions;
CREATE POLICY "Users can insert own prescriptions" ON public.prescriptions
  FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own prescriptions" ON public.prescriptions;
CREATE POLICY "Users can update own prescriptions" ON public.prescriptions
  FOR UPDATE TO authenticated USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own prescriptions" ON public.prescriptions;
CREATE POLICY "Users can delete own prescriptions" ON public.prescriptions
  FOR DELETE TO authenticated USING ((select auth.uid()) = user_id);

-- Health Notes Policies
DROP POLICY IF EXISTS "Users can view own health notes" ON public.health_notes;
CREATE POLICY "Users can view own health notes" ON public.health_notes
  FOR SELECT TO authenticated USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own health notes" ON public.health_notes;
CREATE POLICY "Users can insert own health notes" ON public.health_notes
  FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own health notes" ON public.health_notes;
CREATE POLICY "Users can update own health notes" ON public.health_notes
  FOR UPDATE TO authenticated USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own health notes" ON public.health_notes;
CREATE POLICY "Users can delete own health notes" ON public.health_notes
  FOR DELETE TO authenticated USING ((select auth.uid()) = user_id);

-- Appointments Policies
DROP POLICY IF EXISTS "Users can view own appointments" ON public.appointments;
CREATE POLICY "Users can view own appointments" ON public.appointments
  FOR SELECT TO authenticated USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own appointments" ON public.appointments;
CREATE POLICY "Users can insert own appointments" ON public.appointments
  FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own appointments" ON public.appointments;
CREATE POLICY "Users can update own appointments" ON public.appointments
  FOR UPDATE TO authenticated USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own appointments" ON public.appointments;
CREATE POLICY "Users can delete own appointments" ON public.appointments
  FOR DELETE TO authenticated USING ((select auth.uid()) = user_id);

-- Medical Kit Policies
DROP POLICY IF EXISTS "Users can view own medical kit items" ON public.medical_kit;
CREATE POLICY "Users can view own medical kit items" ON public.medical_kit
  FOR SELECT TO authenticated USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own medical kit items" ON public.medical_kit;
CREATE POLICY "Users can insert own medical kit items" ON public.medical_kit
  FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own medical kit items" ON public.medical_kit;
CREATE POLICY "Users can update own medical kit items" ON public.medical_kit
  FOR UPDATE TO authenticated USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own medical kit items" ON public.medical_kit;
CREATE POLICY "Users can delete own medical kit items" ON public.medical_kit
  FOR DELETE TO authenticated USING ((select auth.uid()) = user_id);

-- Emergency Shares Policies
DROP POLICY IF EXISTS "Users can view own emergency shares" ON public.emergency_shares;
CREATE POLICY "Users can view own emergency shares" ON public.emergency_shares
  FOR SELECT TO authenticated USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own emergency shares" ON public.emergency_shares;
CREATE POLICY "Users can insert own emergency shares" ON public.emergency_shares
  FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own emergency shares" ON public.emergency_shares;
CREATE POLICY "Users can update own emergency shares" ON public.emergency_shares
  FOR UPDATE TO authenticated USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own emergency shares" ON public.emergency_shares;
CREATE POLICY "Users can delete own emergency shares" ON public.emergency_shares
  FOR DELETE TO authenticated USING ((select auth.uid()) = user_id);

-- User Settings Policies
DROP POLICY IF EXISTS "Users can view own settings" ON public.user_settings;
CREATE POLICY "Users can view own settings" ON public.user_settings
  FOR SELECT TO authenticated USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own settings" ON public.user_settings;
CREATE POLICY "Users can update own settings" ON public.user_settings
  FOR UPDATE TO authenticated USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own settings" ON public.user_settings;
CREATE POLICY "Users can insert own settings" ON public.user_settings
  FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = user_id);

-- ============================================================================
-- 14. Automatic User Profile & Settings Creation Trigger
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  gen_id text;
BEGIN
  gen_id := 'MK-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6));

  INSERT INTO public.profiles (id, health_id, full_name, email)
  VALUES (
    new.id,
    gen_id,
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    new.email
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_settings (user_id, language)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'language', 'en')
  )
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.medical_history (user_id)
  VALUES (new.id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_catalog;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ============================================================================
-- 15. Secure Emergency Share RPC Function (Public First-Responder Access)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_emergency_share(p_token text)
RETURNS jsonb AS $$
DECLARE
  v_share record;
  v_profile record;
  v_contacts jsonb;
  v_result jsonb;
BEGIN
  -- Lookup share record
  SELECT * INTO v_share
  FROM public.emergency_shares
  WHERE share_token = p_token
    AND is_revoked = false
    AND (expires_at IS NULL OR expires_at > now());

  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false, 'error', 'This emergency link is invalid, expired, or has been revoked by the patient.');
  END IF;

  -- Lookup patient profile
  SELECT * INTO v_profile
  FROM public.profiles
  WHERE id = v_share.user_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Patient profile not found.');
  END IF;

  -- Lookup emergency contacts
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object('name', name, 'phone', phone, 'relationship', relationship, 'is_primary', is_primary)
    ), '[]'::jsonb
  ) INTO v_contacts
  FROM public.emergency_contacts
  WHERE user_id = v_share.user_id;

  -- Build strictly consented payload
  v_result := jsonb_build_object(
    'valid', true,
    'health_id', v_profile.health_id,
    'full_name', CASE WHEN (v_share.consented_fields->>'name')::boolean IS NOT FALSE THEN v_profile.full_name ELSE 'Patient' END,
    'blood_group', CASE WHEN (v_share.consented_fields->>'blood')::boolean IS NOT FALSE THEN v_profile.blood_group ELSE NULL END,
    'allergies', CASE WHEN (v_share.consented_fields->>'allergies')::boolean IS NOT FALSE THEN v_profile.allergies ELSE NULL END,
    'conditions', CASE WHEN (v_share.consented_fields->>'conditions')::boolean IS NOT FALSE THEN v_profile.chronic_conditions ELSE NULL END,
    'medicines', CASE WHEN (v_share.consented_fields->>'medicines')::boolean IS NOT FALSE THEN v_profile.current_medications ELSE NULL END,
    'emergency_contacts', CASE WHEN (v_share.consented_fields->>'emergency_contacts')::boolean IS NOT FALSE THEN v_contacts ELSE '[]'::jsonb END,
    'expires_at', v_share.expires_at,
    'generated_at', v_share.created_at
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions, pg_catalog;

GRANT EXECUTE ON FUNCTION public.get_emergency_share(text) TO anon, authenticated;

-- ============================================================================
-- 16. Private Storage Buckets Setup & Storage Policies
-- ============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('medikey-avatars', 'medikey-avatars', false),
  ('medikey-documents', 'medikey-documents', false)
ON CONFLICT (id) DO UPDATE SET public = false;

-- Avatars Storage Policies
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
CREATE POLICY "Users can upload their own avatar" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'medikey-avatars' AND
    (storage.foldername(name))[1] = (select auth.uid()::text)
  );

DROP POLICY IF EXISTS "Users can read their own avatar" ON storage.objects;
CREATE POLICY "Users can read their own avatar" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'medikey-avatars' AND
    (storage.foldername(name))[1] = (select auth.uid()::text)
  );

DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
CREATE POLICY "Users can update their own avatar" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'medikey-avatars' AND
    (storage.foldername(name))[1] = (select auth.uid()::text)
  );

DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
CREATE POLICY "Users can delete their own avatar" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'medikey-avatars' AND
    (storage.foldername(name))[1] = (select auth.uid()::text)
  );

-- Documents Storage Policies
DROP POLICY IF EXISTS "Users can upload their own documents" ON storage.objects;
CREATE POLICY "Users can upload their own documents" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'medikey-documents' AND
    (storage.foldername(name))[1] = (select auth.uid()::text)
  );

DROP POLICY IF EXISTS "Users can read their own documents" ON storage.objects;
CREATE POLICY "Users can read their own documents" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'medikey-documents' AND
    (storage.foldername(name))[1] = (select auth.uid()::text)
  );

DROP POLICY IF EXISTS "Users can update their own documents" ON storage.objects;
CREATE POLICY "Users can update their own documents" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'medikey-documents' AND
    (storage.foldername(name))[1] = (select auth.uid()::text)
  );

DROP POLICY IF EXISTS "Users can delete their own documents" ON storage.objects;
CREATE POLICY "Users can delete their own documents" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'medikey-documents' AND
    (storage.foldername(name))[1] = (select auth.uid()::text)
  );
