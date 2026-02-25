-- SECURITY HARDENING: FIX SEARCH PATHS, EXTENSIONS, AND POLICIES
-- Addresses linting errors: function_search_path_mutable, extension_in_public, rls_policy_always_true

DO $$
BEGIN
    -- 1. HARDEN FUNCTIONS (SET SEARCH_PATH)
    -- This prevents role-mutable search path vulnerabilities.
    
    -- list of functions from lint report
    EXECUTE 'ALTER FUNCTION public.handle_new_user() SET search_path = public, extensions';
    EXECUTE 'ALTER FUNCTION public.admin_reset_password(uuid, text) SET search_path = public, extensions';
    EXECUTE 'ALTER FUNCTION public.manage_staff_auth(uuid, text, text, text, text, text) SET search_path = public, extensions';
    EXECUTE 'ALTER FUNCTION public.recover_staff_profiles() SET search_path = public, extensions';
    EXECUTE 'ALTER FUNCTION public.delete_staff_auth(uuid) SET search_path = public, extensions';
    EXECUTE 'ALTER FUNCTION public.save_project_atomically(uuid, text, jsonb, jsonb, jsonb, jsonb) SET search_path = public, extensions';
    EXECUTE 'ALTER FUNCTION public.check_profile_stats() SET search_path = public, extensions';
    EXECUTE 'ALTER FUNCTION public.award_student_rewards(uuid, integer, integer) SET search_path = public, extensions';
    EXECUTE 'ALTER FUNCTION public.update_master_password_hash(text) SET search_path = public, extensions';

    -- 2. MOVE EXTENSIONS TO DEDICATED SCHEMA
    -- This fixes "Extension in Public" warning.
    CREATE SCHEMA IF NOT EXISTS extensions;
    
    -- We use IF EXISTS because we don't know which ones are currently in public
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'btree_gist') THEN
        ALTER EXTENSION "btree_gist" SET SCHEMA extensions;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'uuid-ossp') THEN
        ALTER EXTENSION "uuid-ossp" SET SCHEMA extensions;
    END IF;

    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pgcrypto') THEN
        ALTER EXTENSION pgcrypto SET SCHEMA extensions;
    END IF;

    -- 3. TIGHTEN RLS POLICIES
    -- Fixes "RLS Policy Always True" for notifications table
    DROP POLICY IF EXISTS "Authenticated users can create notifications" ON notifications;
    CREATE POLICY "Authenticated users can create notifications" ON notifications
        FOR INSERT 
        TO authenticated 
        WITH CHECK (auth.uid() = user_id); -- Only create notifications for yourself

    RAISE NOTICE 'Security Hardening Phase 2 Complete.';
END $$;
