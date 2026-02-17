-- Emergency: Disable RLS on profiles to restore access
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Drop the potentially broken policy and function for now
DROP POLICY IF EXISTS "Teachers and Admins can view all profiles" ON profiles;
DROP FUNCTION IF EXISTS public.is_privileged_user();

-- Ensure basic self-view policy exists when we re-enable (but we are disabling for now)
-- ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Users can view their own profile" ON profiles FOR SELECT USING (auth.uid() = id);
