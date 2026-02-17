-- Fix infinite recursion by using a SECURITY DEFINER function
-- This allows checking the user's role without triggering the RLS policy recursively

CREATE OR REPLACE FUNCTION public.is_privileged_user()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('teacher', 'admin')
  );
$$;

-- Drop the recursive policy
DROP POLICY IF EXISTS "Teachers and Admins can view all profiles" ON profiles;

-- Create the safe policy
CREATE POLICY "Teachers and Admins can view all profiles" ON profiles
    FOR SELECT USING (
        is_privileged_user()
    );

-- Ensure users can always see their own profile (this was already there but good to ensure)
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
CREATE POLICY "Users can view their own profile" ON profiles
    FOR SELECT USING (
        auth.uid() = id
    );
