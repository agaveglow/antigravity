-- DIAGNOSTIC: CHECK DATA INTEGRITY (FIXED)
-- Run this to see what is actually in your database.

-- 1. Count Total Profiles
SELECT 'Total Profiles' as check_name, COUNT(*) as count FROM profiles;

-- 2. Count by Role
SELECT role, COUNT(*) as count FROM profiles GROUP BY role;

-- 3. Count by Department
SELECT department, COUNT(*) as count FROM profiles GROUP BY department;

-- 4. Count Students specifically (this is what the app queries)
SELECT 'Students Query Match' as check_name, COUNT(*) as count 
FROM profiles 
WHERE role = 'student';

-- 5. Show first 5 profiles to check existence (Removed 'status' to avoid error)
SELECT id, name, username, role, department 
FROM profiles 
LIMIT 5;
