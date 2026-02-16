-- FIX: SYNC AUTH METADATA (Display Name & Provider)

-- 1. Update the RPC to save metadata correctly for FUTURE students
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
    -- Check permissions
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('teacher', 'admin')) THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;

    -- Defaults
    final_department := COALESCE(p_department, 'music');
    if final_department = '' then final_department := 'music'; end if;
    
    new_user_id := gen_random_uuid();
    encrypted_pw := crypt(COALESCE(p_password, 'student123'), gen_salt('bf'));

    -- Insert into auth.users WITH METADATA
    INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, 
        created_at, updated_at, confirmation_token, email_change_token_new, recovery_token,
        raw_app_meta_data, 
        raw_user_meta_data -- <--- This populates "Display Name"
    ) VALUES (
        '00000000-0000-0000-0000-000000000000', new_user_id, 'authenticated', 'authenticated', 
        p_username, encrypted_pw, NOW(), NOW(), NOW(), '', '', '',
        '{"provider": "email", "providers": ["email"]}', 
        jsonb_build_object('full_name', p_name) -- <--- Sync Name
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


-- 2. BACKFILL: Fix EXISTING accounts that have missing metadata
-- This updates auth.users by reading from public.profiles

UPDATE auth.users u
SET 
    -- Fix Display Name
    raw_user_meta_data = 
        COALESCE(u.raw_user_meta_data, '{}'::jsonb) || 
        jsonb_build_object('full_name', p.name),
        
    -- Fix Provider (if missing)
    raw_app_meta_data = 
        COALESCE(u.raw_app_meta_data, '{}'::jsonb) || 
        '{"provider": "email", "providers": ["email"]}'::jsonb
FROM profiles p
WHERE u.id = p.id;
