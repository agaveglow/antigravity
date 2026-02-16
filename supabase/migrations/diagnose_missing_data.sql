-- DIAGNOSTIC: CHECK FOR DATA EXISTENCE
-- Run this to see where the data went.

DO $$
DECLARE
    auth_count integer;
    profile_count integer;
    student_role_count integer;
    orphaned_count integer;
BEGIN
    -- 1. Count Auth Users (The "Real" accounts)
    SELECT COUNT(*) INTO auth_count FROM auth.users;
    
    -- 2. Count Profiles (The application data)
    SELECT COUNT(*) INTO profile_count FROM public.profiles;
    
    -- 3. Count "Students" specifically in Profiles
    SELECT COUNT(*) INTO student_role_count FROM public.profiles WHERE role = 'student';
    
    -- 4. Check for Orphans (Auth users without a profile)
    SELECT COUNT(*) INTO orphaned_count 
    FROM auth.users u
    LEFT JOIN public.profiles p ON u.id = p.id
    WHERE p.id IS NULL;

    RAISE NOTICE '=========================================';
    RAISE NOTICE 'DIAGNOSTIC RESULTS:';
    RAISE NOTICE 'Auth Users (Logins): %', auth_count;
    RAISE NOTICE 'Public Profiles: %', profile_count;
    RAISE NOTICE 'Student Profiles: %', student_role_count;
    RAISE NOTICE 'Orphaned Users (No Profile): %', orphaned_count;
    RAISE NOTICE '=========================================';
    
    IF auth_count > 0 AND profile_count = 0 THEN
        RAISE WARNING 'CRITICAL: Profiles table is empty, but Auth users exist. We can restore profiles from Auth backup.';
    ELSIF student_role_count = 0 THEN
        RAISE WARNING 'Profiles exist, but no "students". Check if `role` column was cleared?';
    END IF;
END $$;

-- 5. List the first 5 profiles to see what they look like (if any)
SELECT * FROM profiles LIMIT 5;
