-- 1. Drop ALL existing policies on profiles to ensure a clean slate
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Teachers and Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Anyone can view profiles" ON profiles;
DROP POLICY IF EXISTS "Public profiles" ON profiles;
DROP POLICY IF EXISTS "Authenticated users can see all profiles" ON profiles;

-- 2. Ensure RLS is enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 3. Create a safely isolated function to check roles (using SECURITY DEFINER to bypass RLS)
CREATE OR REPLACE FUNCTION get_user_role(user_id uuid)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT role FROM profiles WHERE id = user_id;
$$;

-- 4. Create the policies
-- Policy A: Users can always see their own profile (Non-recursive: checks ID mismatch only)
CREATE POLICY "Users can view their own profile" 
ON profiles 
FOR SELECT 
USING (auth.uid() = id);

-- Policy B: Teachers/Admins can see ALL profiles
-- We use the SECURITY DEFINER function to check the *requesting user's* role avoids the recursion loop
CREATE POLICY "Teachers and Admins can view all profiles" 
ON profiles 
FOR SELECT 
USING (
  get_user_role(auth.uid()) IN ('teacher', 'admin')
);

-- Policy C: Allow UPDATE/INSERT for self (for profile editing)
CREATE POLICY "Users can update their own profile" 
ON profiles 
FOR UPDATE 
USING (auth.uid() = id);

-- Policy D: Allow Teachers/Admin update/delete (Optional, for management)
CREATE POLICY "Teachers can update any profile" 
ON profiles 
FOR UPDATE 
USING (
  get_user_role(auth.uid()) IN ('teacher', 'admin')
);
