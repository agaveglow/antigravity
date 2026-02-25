-- SECURITY SHIELD: ENABLE RLS ON ALL TABLES
-- This script fixes the "Policy Exists RLS Disabled" error.

DO $$
DECLARE
    v_table_name text;
BEGIN
    -- 1. ENABLE RLS ON KNOWN TABLES
    -- We list specific common tables to ensure they are covered.
    FOR v_table_name IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename IN (
            'profiles', 'units', 'student_progress', 'walkthroughs', 
            'submissions', 'modules', 'stages', 'notifications', 
            'courses', 'badge_attachments', 'badges', 'student_badges',
            'erc_availability', 'erc_bookings', 'erc_collaborations', 
            'erc_projects', 'erc_resources', 'erc_tasks', 'erc_tracks',
            'course_folders'
        )
    LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', v_table_name);
        RAISE NOTICE 'RLS enabled on table: %', v_table_name;
    END LOOP;

    -- 2. DYNAMICALLY ENABLE RLS ON ANY TABLE WITH POLICIES
    -- This ensures we don't miss anything that has a policy but RLS is off.
    FOR v_table_name IN 
        SELECT DISTINCT tablename 
        FROM pg_policies 
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', v_table_name);
        RAISE NOTICE 'Dynamic RLS check: ensured enabled on %', v_table_name;
    END LOOP;

END $$;
