-- ==============================================================================
-- BLX REALTY - SUPABASE ROW LEVEL SECURITY (RLS) HARDENING SCRIPT
-- ==============================================================================
-- Run this script in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/_/sql
--
-- This script:
-- 1. Revokes anonymous/public access to staff_users, staff_sessions, and password_resets.
-- 2. Removes permissive "Public full access" policies.
-- 3. Restricts staff account operations strictly to the backend service_role key.
-- 4. Secures the properties table so only service_role can perform mutations.
-- ==============================================================================

-- 1. Revoke public/anon table privileges on sensitive authentication & staff data
REVOKE ALL ON TABLE public.staff_users FROM anon, authenticated;
REVOKE ALL ON TABLE public.staff_sessions FROM anon, authenticated;
REVOKE ALL ON TABLE public.password_resets FROM anon, authenticated;

-- 2. Remove permissive public policies
DROP POLICY IF EXISTS "Public full access to staff_users" ON public.staff_users;
DROP POLICY IF EXISTS "Public full access to staff_sessions" ON public.staff_sessions;
DROP POLICY IF EXISTS "Public full access to password_resets" ON public.password_resets;
DROP POLICY IF EXISTS "Public full access to properties" ON public.properties;

-- 3. Ensure Row Level Security is enabled on all tables
ALTER TABLE public.staff_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.password_resets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

-- 4. Create strict service_role policies (Used exclusively by Express backend)
DROP POLICY IF EXISTS "Service role full access to staff_users" ON public.staff_users;
CREATE POLICY "Service role full access to staff_users" ON public.staff_users
    FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access to staff_sessions" ON public.staff_sessions;
CREATE POLICY "Service role full access to staff_sessions" ON public.staff_sessions
    FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access to password_resets" ON public.password_resets;
CREATE POLICY "Service role full access to password_resets" ON public.password_resets
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 5. Properties: Service role has full CRUD permissions
DROP POLICY IF EXISTS "Service role full access to properties" ON public.properties;
CREATE POLICY "Service role full access to properties" ON public.properties
    FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public read-only active properties" ON public.properties;
CREATE POLICY "Public read-only active properties" ON public.properties
    FOR SELECT TO anon, authenticated
    USING (is_archived IS NULL OR is_archived = 0);

