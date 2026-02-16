-- FIX STUDENT VISIBILITY & RLS CONFLICTS

-- 1. Ensure all profiles have a department (Backfill NULLs)
UPDATE profiles 
SET department = 'music' 
WHERE department IS NULL;

-- 2. Define SAFEE helper functions (Security Definer bypasses RLS)
-- We rename them to ensure we are using the fresh, correct versions
CREATE OR REPLACE FUNCTION get_safe_auth_role()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN (SELECT role FROM profiles WHERE id = auth.uid());
END;
$$;

CREATE OR REPLACE FUNCTION get_safe_auth_department()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN (SELECT COALESCE(department, 'music') FROM profiles WHERE id = auth.uid());
END;
$$;

-- 3. Reset RLS Policies on Profiles (Clean Slate)
DROP POLICY IF EXISTS "Teachers and Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Teachers can view student profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Teachers and Admins can update any profile" ON profiles;
DROP POLICY IF EXISTS "Teachers can update student profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 4. Re-create Optimized Policies

-- A. VIEWING (SELECT)

-- Everyone can see their own profile
CREATE POLICY "Users can view own profile" ON profiles
FOR SELECT TO authenticated
USING (auth.uid() = id);

-- Admins can see EVERYTHING
CREATE POLICY "Admins can view all profiles" ON profiles
FOR SELECT TO authenticated
USING (get_safe_auth_role() = 'admin');

-- Teachers can see STUDENTS (Filtered by Department)
CREATE POLICY "Teachers can view department students" ON profiles
FOR SELECT TO authenticated
USING (
    get_safe_auth_role() = 'teacher' 
    AND role = 'student'
    AND department = get_safe_auth_department()
);

-- B. EDITING (UPDATE)

-- Admins can update ANY profile
CREATE POLICY "Admins can update all profiles" ON profiles
FOR UPDATE TO authenticated
USING (get_safe_auth_role() = 'admin')
WITH CHECK (get_safe_auth_role() = 'admin');

-- Teachers can update STUDENTS (Filtered by Department)
CREATE POLICY "Teachers can update department students" ON profiles
FOR UPDATE TO authenticated
USING (
    get_safe_auth_role() = 'teacher' 
    AND role = 'student'
    AND department = get_safe_auth_department()
)
WITH CHECK (
    get_safe_auth_role() = 'teacher' 
    AND role = 'student'
    AND department = get_safe_auth_department()
);
