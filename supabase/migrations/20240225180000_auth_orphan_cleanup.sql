-- SECURITY SHIELD: AUTH ORPHAN CLEANUP (REAPER)
-- This script finds users in auth.users who no longer have a profile
-- and removes them to keep the dashboard clean.

DO $$
DECLARE
    v_count integer;
BEGIN
    -- 1. Identify and remove orphans
    -- We delete users from auth.users who do NOT have a record in public.profiles
    -- AND are not the current user (just a safety precaution)
    
    WITH orphans AS (
        SELECT id 
        FROM auth.users 
        WHERE id NOT IN (SELECT id FROM public.profiles)
        AND id != auth.uid()
    )
    DELETE FROM auth.users 
    WHERE id IN (SELECT id FROM orphans);

    GET DIAGNOSTICS v_count = ROW_COUNT;
    
    RAISE NOTICE 'CLEANUP COMPLETE. Removed % orphaned auth accounts.', v_count;
END $$;
