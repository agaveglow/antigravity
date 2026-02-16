-- FIX INFINITE RECURSION IN RLS POLICIES

-- 1. Drop the problematic recursive policies
DROP POLICY IF EXISTS "Teachers and Admins can update any profile" ON profiles;
DROP POLICY IF EXISTS "Teachers and Admins can view all profiles" ON profiles;

-- 2. Create a SECURITY DEFINER function to check roles safely
-- This bypasses RLS to avoid the infinite loop when querying profiles
CREATE OR REPLACE FUNCTION public.is_teacher_or_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('teacher', 'admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Re-create policies using the safe function

-- UPDATE Policy
CREATE POLICY "Teachers and Admins can update any profile" ON profiles
    FOR UPDATE
    TO authenticated
    USING ( is_teacher_or_admin() )
    WITH CHECK ( is_teacher_or_admin() );

-- SELECT Policy
CREATE POLICY "Teachers and Admins can view all profiles" ON profiles
    FOR SELECT
    TO authenticated
    USING (
        is_teacher_or_admin() 
        OR auth.uid() = id -- Users can always view their own profile
    );
