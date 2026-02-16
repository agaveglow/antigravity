-- FIX STUDENT CREATION AND DEPARTMENT HANDLING

-- 1. Ensure Department Column has a Default
ALTER TABLE profiles 
ALTER COLUMN department SET DEFAULT 'music';

-- 2. Backfill any remaining NULL departments
UPDATE profiles 
SET department = 'music' 
WHERE department IS NULL;

-- 3. Update the RPC to explicitly handle department and force a value
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
    -- Check permissions (Teacher or Admin)
    -- Note: We use a direct check here to avoid dependencies on other helper functions
    IF NOT EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role IN ('teacher', 'admin')
    ) THEN
        RAISE EXCEPTION 'Unauthorized: Only teachers and admins can create students';
    END IF;

    -- Force a department value (Default to music if null/empty)
    final_department := COALESCE(p_department, 'music');
    IF final_department = '' THEN
        final_department := 'music';
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
        p_username, -- Using username as email
        encrypted_pw,
        NOW(),
        NOW(),
        NOW(),
        '', '', '',
        '{"provider": "email", "providers": ["email"]}',
        '{}'
    );
    
    -- Insert into public.profiles
    INSERT INTO public.profiles (
        id, 
        username, 
        name, 
        cohort, 
        role, 
        xp, 
        balance, 
        department, 
        reference_password
    )
    VALUES (
        new_user_id,
        p_username,
        p_name,
        p_cohort,
        'student',
        0,
        0,
        final_department,
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
