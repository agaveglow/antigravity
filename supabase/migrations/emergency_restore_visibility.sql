-- EMERGENCY VISIBILITY RESTORATION
-- Run this if you cannot see any students.

-- 1. Disable RLS temporarily to check if it's the cause (Optional, skipped here to keep security basic)
-- ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- 2. Drop existing restrictive policies
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Teachers can view department students" ON profiles;
DROP POLICY IF EXISTS "Students can view department peers" ON profiles;
DROP POLICY IF EXISTS "Teachers can view student profiles" ON profiles;
-- Drop any other potential conflicts
DROP POLICY IF EXISTS "Enable read access for all users" ON profiles;

-- 3. Create a permissive policy for Authenticated Users
CREATE POLICY "Emergency View All" ON profiles
FOR SELECT TO authenticated
USING (true);

-- 4. Ensure Department Defaults (Again, just in case)
UPDATE profiles SET department = 'music' WHERE department IS NULL;
