-- Emergency: Disable RLS on profiles to restore access immediately
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Also explicitly drop the policies causing issues just in case
DROP POLICY IF EXISTS "Teacher view all profiles" ON profiles;
DROP POLICY IF EXISTS "Teachers and Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Teachers can update any profile" ON profiles;

-- Keep the self-view policy for when we re-enable, but for now RLS is OFF
-- The other tables (stages, modules, etc) query profiles. 
-- Since RLS is OFF on profiles, those queries will succeed without triggering a recursive check on profiles.
