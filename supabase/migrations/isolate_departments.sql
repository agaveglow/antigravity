-- 1. Add Department Column to Profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS department text NOT NULL DEFAULT 'music' 
CHECK (department IN ('music', 'performing_arts'));

-- 2. Update RLS Policies for Department Isolation

-- Helper function (already exists, but ensuring it's available)
-- get_auth_role() returns the role of the current user

-- Helper to get current user's department
CREATE OR REPLACE FUNCTION get_auth_department()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN (SELECT department FROM profiles WHERE id = auth.uid());
END;
$$;


-- Policy B: Teachers can view Student profiles (ONLY from their department)
DROP POLICY IF EXISTS "Teachers can view student profiles" ON profiles;
CREATE POLICY "Teachers can view student profiles" ON profiles
FOR SELECT TO authenticated
USING (
    get_auth_role() = 'teacher' 
    AND role = 'student'
    AND department = get_auth_department() -- Isolation Logic
);

-- Policy D: Teachers can update Student profiles (ONLY from their department)
DROP POLICY IF EXISTS "Teachers can update student profiles" ON profiles;
CREATE POLICY "Teachers can update student profiles" ON profiles
FOR UPDATE TO authenticated
USING (
    get_auth_role() = 'teacher' 
    AND role = 'student'
    AND department = get_auth_department() -- Isolation Logic
)
WITH CHECK (
     get_auth_role() = 'teacher' 
    AND role = 'student'
    AND department = get_auth_department()
);

-- Note: Admin policies remain global ("Admins can view all profiles")


-- 3. Update Auth Management RPCs to support Department

-- Enable pgcrypto for password hashing if not already
create extension if not exists pgcrypto;

-- manage_student_auth
DROP FUNCTION IF EXISTS manage_student_auth(text, text, text, text);
DROP FUNCTION IF EXISTS manage_student_auth(text, text, text, text, text);

CREATE OR REPLACE FUNCTION manage_student_auth(
    p_username text,
    p_password text,
    p_name text,
    p_cohort text,
    p_department text DEFAULT 'music'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
    new_user_id uuid;
    encrypted_pw text;
BEGIN
    -- Check permissions (Teacher or Admin)
    IF get_auth_role() NOT IN ('teacher', 'admin') THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;

    -- Generate ID
    new_user_id := gen_random_uuid();
    
    -- Hash password (default if null)
    encrypted_pw := crypt(COALESCE(p_password, 'student123'), gen_salt('bf'));

    -- Insert into auth.users
    INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        created_at,
        updated_at,
        confirmation_token,
        email_change_token_new,
        recovery_token,
        raw_app_meta_data,
        raw_user_meta_data
    ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        new_user_id,
        'authenticated',
        'authenticated',
        p_username, -- Using username as email for simplicity as per existing pattern
        encrypted_pw,
        NOW(),
        NOW(),
        NOW(),
        '', '', '',
        '{"provider": "email", "providers": ["email"]}',
        '{}'
    );
    
    -- Insert into public.profiles
    INSERT INTO public.profiles (id, username, name, cohort, role, xp, balance, department, reference_password)
    VALUES (
        new_user_id,
        p_username,
        p_name,
        p_cohort,
        'student',
        0,
        0,
        p_department,
        p_password
    )
    ON CONFLICT (id) DO UPDATE SET
        username = EXCLUDED.username,
        name = EXCLUDED.name,
        cohort = EXCLUDED.cohort,
        department = EXCLUDED.department,
        reference_password = EXCLUDED.reference_password;

    RETURN new_user_id;
END;
$$;


-- manage_staff_auth
DROP FUNCTION IF EXISTS manage_staff_auth(uuid, text, text, text, text);
DROP FUNCTION IF EXISTS manage_staff_auth(uuid, text, text, text, text, text);

CREATE OR REPLACE FUNCTION manage_staff_auth(
    p_user_id uuid, -- If null, create new
    p_email text,
    p_password text,
    p_name text,
    p_role text,
    p_department text DEFAULT 'music'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
    target_id uuid;
    encrypted_pw text;
BEGIN
    -- Only Admins can manage staff
    IF get_auth_role() != 'admin' THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;

    IF p_user_id IS NOT NULL THEN
        -- Update existing
        UPDATE profiles 
        SET name = p_name, role = p_role, department = p_department
        WHERE id = p_user_id;
        
        -- Update reference password if provided
        IF p_password IS NOT NULL AND p_password != '' THEN
            UPDATE profiles SET reference_password = p_password WHERE id = p_user_id;
            
            -- Update auth.users password
            UPDATE auth.users 
            SET encrypted_password = crypt(p_password, gen_salt('bf'))
            WHERE id = p_user_id;
        END IF;
    ELSE
        -- Create new 
        target_id := gen_random_uuid();
        encrypted_pw := crypt(COALESCE(p_password, 'staff123'), gen_salt('bf'));
        
        -- Insert into auth.users
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            created_at,
            updated_at,
            confirmation_token,
            email_change_token_new,
            recovery_token,
            raw_app_meta_data,
            raw_user_meta_data
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            target_id,
            'authenticated',
            'authenticated',
            p_email,
            encrypted_pw,
            NOW(),
            NOW(),
            NOW(),
            '', '', '',
            '{"provider": "email", "providers": ["email"]}',
            '{}'
        );
        
        -- Insert into public.profiles
        INSERT INTO public.profiles (id, username, name, role, department, reference_password)
        VALUES (target_id, p_email, p_name, p_role, p_department, p_password)
        ON CONFLICT (id) DO UPDATE SET
            username = EXCLUDED.username,
            name = EXCLUDED.name,
            role = EXCLUDED.role,
            department = EXCLUDED.department,
            reference_password = EXCLUDED.reference_password;
            
    END IF;
END;
$$;
