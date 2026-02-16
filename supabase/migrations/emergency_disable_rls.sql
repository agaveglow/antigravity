-- EMERGENCY VISIBILITY RESTORE
-- Run this to immediately make all profiles visible to everyone.
-- This confirms the data exists and wasn't deleted.

-- 1. Disable RLS on profiles table
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- 2. Verify Data Counts (Output will show in "Results" tab)
DO $$
DECLARE
    student_count integer;
    teacher_count integer;
BEGIN
    SELECT COUNT(*) INTO student_count FROM profiles WHERE role = 'student';
    SELECT COUNT(*) INTO teacher_count FROM profiles WHERE role = 'teacher';
    
    RAISE NOTICE '---------------------------------------------------';
    RAISE NOTICE 'DATA VERIFICATION:';
    RAISE NOTICE 'Total Students Found: %', student_count;
    RAISE NOTICE 'Total Teachers Found: %', teacher_count;
    RAISE NOTICE '---------------------------------------------------';
    
    IF student_count = 0 THEN
        RAISE WARNING '⚠️ No students found! They might have been deleted or the role is wrong.';
    ELSE
        RAISE NOTICE '✅ Students exist. Disabling RLS should make them visible in the app now.';
    END IF;
END $$;
