-- FIX VISIBILITY RULES (CORRECTED)
-- Admins=All, Teachers/Students=Department Only

-- 1. DATA FIX: Ensure everyone has a department (Default to 'music')
UPDATE profiles 
SET department = 'music' 
WHERE department IS NULL;

-- 2. HELPER FUNCTIONS (Safe from recursion)
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

-- 3. RESET POLICIES (Start Fresh)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- DROP ALL POSSIBLE POLICIES TO AVOID CONFLICTS
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Teachers can view department students" ON profiles;
DROP POLICY IF EXISTS "Students can view department peers" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Teachers can update department students" ON profiles;

-- Drop any old/legacy policies
DROP POLICY IF EXISTS "Teachers can view student profiles" ON profiles;
DROP POLICY IF EXISTS "Teachers and Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Teachers and Admins can update any profile" ON profiles;
DROP POLICY IF EXISTS "Teachers can update student profiles" ON profiles;


-- 4. CREATE NEW POLICIES

-- A. ADMINS: See EVERYONE (No filters)
CREATE POLICY "Admins can view all profiles" ON profiles
FOR SELECT TO authenticated
USING (
    get_safe_auth_role() = 'admin'
);

-- B. TEACHERS: See STUDENTS in their OWN Department
CREATE POLICY "Teachers can view department students" ON profiles
FOR SELECT TO authenticated
USING (
    get_safe_auth_role() = 'teacher' 
    AND role = 'student'
    AND department = get_safe_auth_department()
);

-- C. STUDENTS: See PEERS (Students) in their OWN Department
CREATE POLICY "Students can view department peers" ON profiles
FOR SELECT TO authenticated
USING (
    get_safe_auth_role() = 'student' 
    AND role = 'student'
    AND department = get_safe_auth_department()
);

-- D. SELF: Everyone can see THEMSELVES (Always important)
CREATE POLICY "Users can view own profile" ON profiles
FOR SELECT TO authenticated
USING (
    auth.uid() = id
);

-- E. UPDATES (Editing)
-- Admins can edit ALL
CREATE POLICY "Admins can update all profiles" ON profiles
FOR UPDATE TO authenticated
USING (get_safe_auth_role() = 'admin')
WITH CHECK (get_safe_auth_role() = 'admin');

-- Teachers can edit STUDENTS in their Department
CREATE POLICY "Teachers can update department students" ON profiles
FOR UPDATE TO authenticated
USING (
    get_safe_auth_role() = 'teacher' 
    AND role = 'student'
    AND department = get_safe_auth_department()
);
