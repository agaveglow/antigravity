-- ROBUST SECURITY HARDENING: DYNAMIC FUNCTION SCAN & SECURITY FIX
-- This script dynamically identifies all SECURITY DEFINER functions and fixes their search_path.
-- It also handles extension relocation and RLS policy hardening.

DO $$
DECLARE
    v_func_rec record;
    v_sql text;
BEGIN
    -- 1. DYNAMICALLY HARDEN ALL SECURITY DEFINER FUNCTIONS IN PUBLIC SCHEMA
    -- This handles any signature (arguments) and any function name automatically.
    FOR v_func_rec IN (
        SELECT 
            n.nspname as schema_name,
            p.proname as function_name,
            pg_get_function_identity_arguments(p.oid) as arguments
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' 
          AND p.prosecdef = true  -- Only SECURITY DEFINER functions
    ) LOOP
        v_sql := format('ALTER FUNCTION %I.%I(%s) SET search_path = public, extensions', 
                        v_func_rec.schema_name, 
                        v_func_rec.function_name, 
                        v_func_rec.arguments);
        
        RAISE NOTICE 'Hardening Function: %', v_sql;
        EXECUTE v_sql;
    END LOOP;

    -- 2. MOVE EXTENSIONS TO DEDICATED SCHEMA
    -- This fixes "Extension in Public" warning safely.
    CREATE SCHEMA IF NOT EXISTS extensions;
    
    FOR v_func_rec IN (SELECT extname FROM pg_extension WHERE extname IN ('btree_gist', 'uuid-ossp', 'pgcrypto')) LOOP
        EXECUTE format('ALTER EXTENSION %I SET SCHEMA extensions', v_func_rec.extname);
        RAISE NOTICE 'Moved Extension % to extensions schema', v_func_rec.extname;
    END LOOP;

    -- 3. TIGHTEN RLS POLICIES
    -- Fixes "RLS Policy Always True" for notifications table
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can create notifications' AND tablename = 'notifications') THEN
        DROP POLICY IF EXISTS "Authenticated users can create notifications" ON notifications;
        CREATE POLICY "Authenticated users can create notifications" ON notifications
            FOR INSERT 
            TO authenticated 
            WITH CHECK (auth.uid() = user_id);
        RAISE NOTICE 'Tightened notification INSERT policy.';
    END IF;

    RAISE NOTICE 'Robust Security Hardening Complete.';
END $$;
