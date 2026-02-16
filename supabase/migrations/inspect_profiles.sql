-- INSPECT PROFILES (FINAL ATTEMPT)
-- Run this to see the properties of the users who DO exist.

-- 1. All Profiles (Only selecting guaranteed columns)
SELECT 
    id, 
    username, 
    name, 
    role, 
    department
FROM profiles;

-- 2. Orphaned Auth Users
-- (Users who have a login but NO profile - your missing student might be here)
SELECT 
    id, 
    email, 
    created_at, 
    last_sign_in_at 
FROM auth.users 
WHERE id NOT IN (SELECT id FROM profiles);
