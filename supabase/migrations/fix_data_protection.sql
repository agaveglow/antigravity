-- 1. Secure system_settings
-- Helper to prevent RLS recursion
CREATE OR REPLACE FUNCTION get_auth_role()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN (SELECT role FROM profiles WHERE id = auth.uid());
END;
$$;

ALTER TABLE IF EXISTS system_settings ENABLE ROW LEVEL SECURITY;

-- Remove valid public/authenticated access if any exists (RLS will handle it, but being explicit is good)
-- We rely on RLS policies below.

-- Policy: Only Admins can SELECT/UPDATE system_settings
DROP POLICY IF EXISTS "Admins can view system_settings" ON system_settings;
CREATE POLICY "Admins can view system_settings" ON system_settings
FOR SELECT TO authenticated
USING (
    get_auth_role() = 'admin'
);

DROP POLICY IF EXISTS "Admins can update system_settings" ON system_settings;
CREATE POLICY "Admins can update system_settings" ON system_settings
FOR UPDATE TO authenticated
USING (
    get_auth_role() = 'admin'
)
WITH CHECK (
    get_auth_role() = 'admin'
);


-- 2. Split Profiles RLS to protect Admin data
DROP POLICY IF EXISTS "Teachers and Admins can view all profiles" ON profiles;

-- Policy A: Users can view their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles
FOR SELECT TO authenticated
USING (
    auth.uid() = id
);

-- Policy B: Teachers can view Student profiles (but NOT other Teachers or Admins)
DROP POLICY IF EXISTS "Teachers can view student profiles" ON profiles;
CREATE POLICY "Teachers can view student profiles" ON profiles
FOR SELECT TO authenticated
USING (
    get_auth_role() = 'teacher' 
    AND role = 'student'
);

-- Policy C: Admins can view ALL profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles" ON profiles
FOR SELECT TO authenticated
USING (
    get_auth_role() = 'admin'
);

-- Policy D: Teachers and Admins can UPDATE Student/All profiles
DROP POLICY IF EXISTS "Teachers and Admins can update any profile" ON profiles;

DROP POLICY IF EXISTS "Teachers can update student profiles" ON profiles;
CREATE POLICY "Teachers can update student profiles" ON profiles
FOR UPDATE TO authenticated
USING (
    get_auth_role() = 'teacher' 
    AND role = 'student'
)
WITH CHECK (
     get_auth_role() = 'teacher' 
    AND role = 'student'
);

DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
CREATE POLICY "Admins can update all profiles" ON profiles
FOR UPDATE TO authenticated
USING (
    get_auth_role() = 'admin'
)
WITH CHECK (
    get_auth_role() = 'admin'
);


-- 3. Server-side Master Password Verification
DROP FUNCTION IF EXISTS verify_master_password(text);
CREATE OR REPLACE FUNCTION verify_master_password(attempt text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Check if the password matches
    RETURN EXISTS (
        SELECT 1 FROM system_settings
        WHERE key = 'master_password' AND value = attempt
    );
END;
$$;


-- 4. Secure Access to Sensitive Data via RPC
DROP FUNCTION IF EXISTS get_sensitive_student_data(uuid, text);
CREATE OR REPLACE FUNCTION get_sensitive_student_data(student_id uuid, master_pwd_attempt text)
RETURNS TABLE (password text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- 1. Verify Master Password
    IF NOT EXISTS (SELECT 1 FROM system_settings WHERE key = 'master_password' AND value = master_pwd_attempt) THEN
        RAISE EXCEPTION 'Invalid Master Password';
    END IF;

    -- 2. Verify Caller is Teacher or Admin
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('teacher', 'admin')) THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;

    -- 3. Return Data
    RETURN QUERY SELECT reference_password FROM profiles WHERE id = student_id;
END;
$$;
