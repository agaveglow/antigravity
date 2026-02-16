-- FIX: ADD MISSING EMAIL COLUMN

-- 1. Add email column if missing
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS email text;

-- 2. Backfill from auth.users
-- (This copies the email/username from the auth system to the profile)
UPDATE profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id;

-- 3. Update the RPC to save email in future
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
    final_department text;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('teacher', 'admin')) THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;

    final_department := COALESCE(p_department, 'music');
    if final_department = '' then final_department := 'music'; end if;
    
    new_user_id := gen_random_uuid();
    encrypted_pw := crypt(COALESCE(p_password, 'student123'), gen_salt('bf'));

    INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, 
        created_at, updated_at, confirmation_token, raw_app_meta_data, raw_user_meta_data
    ) VALUES (
        '00000000-0000-0000-0000-000000000000', new_user_id, 'authenticated', 'authenticated', 
        p_username, encrypted_pw, NOW(), NOW(), NOW(), '', 
        '{"provider": "email", "providers": ["email"]}', 
        jsonb_build_object('full_name', p_name)
    );
    
    INSERT INTO public.profiles (
        id, username, name, cohort, role, xp, balance, department, reference_password, status, email
    ) VALUES (
        new_user_id, p_username, p_name, p_cohort, 'student', 0, 0, final_department, p_password, 'Active', p_username
    )
    ON CONFLICT (id) DO UPDATE SET
        username = EXCLUDED.username,
        name = EXCLUDED.name,
        cohort = EXCLUDED.cohort,
        department = EXCLUDED.department,
        reference_password = EXCLUDED.reference_password,
        email = EXCLUDED.email;

    RETURN new_user_id;
END;
$$;
