-- ============================================================================
-- MediKey Database Migration: 20261125000002_grant_public_permissions.sql
-- Description: Explicit public schema table & sequence grants for authenticated role
-- ============================================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO authenticated;

-- Ensure public access to consented emergency share function
GRANT EXECUTE ON FUNCTION public.get_emergency_share(text) TO anon, authenticated;

-- Revoke direct anonymous/authenticated execution of the internal signup trigger
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;

-- Default privileges for future schema objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO authenticated;
