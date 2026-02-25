-- FIX: STUDENT LOGIN IDENTIFIER MISMATCH
-- The login page appends '@erc-learn.local' to usernames, but manage_student_auth was saving only the raw username.

-- 1. Update the RPC to append the domain for all NEW students
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
    final_email text;
BEGIN
    -- Check permissions
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('teacher', 'admin')) THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;

    -- Defaults
    final_department := COALESCE(p_department, 'music');
    if final_department = '' then final_department := 'music'; end if;
    
    -- Format email to match Login.tsx
    final_email := p_username || '@erc-learn.local';
    
    new_user_id := gen_random_uuid();
    encrypted_pw := crypt(COALESCE(p_password, 'student123'), gen_salt('bf'));

    -- Insert into auth.users WITH CORRECT EMAIL FORMAT
    INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, 
        created_at, updated_at, confirmation_token, email_change_token_new, recovery_token,
        raw_app_meta_data, raw_user_meta_data
    ) VALUES (
        '00000000-0000-0000-0000-000000000000', new_user_id, 'authenticated', 'authenticated', 
        final_email, encrypted_pw, NOW(), NOW(), NOW(), '', '', '',
        '{"provider": "email", "providers": ["email"]}', 
        jsonb_build_object('full_name', p_name)
    );
    
    -- Insert into public.profiles
    INSERT INTO public.profiles (
        id, username, name, cohort, role, xp, balance, department, reference_password, status
    ) VALUES (
        new_user_id, p_username, p_name, p_cohort, 'student', 0, 0, final_department, p_password, 'Active'
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

-- 2. BACKFILL: Fix EXISTING student emails that are missing the domain
-- This allows students who were just created to log in.
UPDATE auth.users
SET email = email || '@erc-learn.local'
WHERE email NOT LIKE '%@%'
AND id IN (SELECT id FROM profiles WHERE role = 'student');
