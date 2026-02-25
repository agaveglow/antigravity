-- PASSWORD & SYNC RESCUE: FIX STUDENT UPDATES
-- This script upgrades the manage_student_auth function to handle UPDATES correctly.

DO $$
DECLARE
    v_instance_id uuid;
BEGIN
    -- 1. CAPTURE PROJECT ID
    SELECT instance_id INTO v_instance_id FROM auth.users WHERE instance_id IS NOT NULL LIMIT 1;
    IF v_instance_id IS NULL THEN v_instance_id := '00000000-0000-0000-0000-000000000000'; END IF;

    -- 2. CREATE SMART UPSERT FUNCTION
    EXECUTE format('
        CREATE OR REPLACE FUNCTION manage_student_auth(
            p_username text, 
            p_password text, 
            p_name text, 
            p_cohort text, 
            p_department text DEFAULT ''music'',
            p_user_id uuid DEFAULT NULL  -- Added optional ID for updates
        ) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $inner$
        DECLARE
            v_user_id uuid; 
            v_encrypted_pw text; 
            v_final_dept text; 
            v_final_email text;
            v_instance_id uuid := ''%s'';
        BEGIN
            -- Check permissions
            IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN (''teacher'', ''admin'')) THEN
                RAISE EXCEPTION ''Unauthorized'';
            END IF;

            v_final_dept := COALESCE(p_department, ''music'');
            v_final_email := lower(p_username) || ''@erc-learn.local'';
            
            -- Find user if p_user_id not provided
            IF p_user_id IS NOT NULL THEN
                v_user_id := p_user_id;
            ELSE
                SELECT id INTO v_user_id FROM auth.users WHERE email = v_final_email;
            END IF;

            -- If user exists, update
            IF v_user_id IS NOT NULL THEN
                -- Update auth.users
                UPDATE auth.users SET
                    email = v_final_email,
                    raw_user_meta_data = jsonb_build_object(''full_name'', p_name),
                    updated_at = NOW()
                WHERE id = v_user_id;

                -- Update password if provided
                IF p_password IS NOT NULL AND p_password != '''' THEN
                    v_encrypted_pw := crypt(p_password, gen_salt(''bf''));
                    UPDATE auth.users SET encrypted_password = v_encrypted_pw WHERE id = v_user_id;
                END IF;

                -- Update profile
                INSERT INTO public.profiles (id, username, name, cohort, role, department, reference_password, status)
                VALUES (v_user_id, p_username, p_name, p_cohort, ''student'', v_final_dept, p_password, ''Active'')
                ON CONFLICT (id) DO UPDATE SET
                    username = EXCLUDED.username,
                    name = EXCLUDED.name,
                    cohort = EXCLUDED.cohort,
                    department = EXCLUDED.department,
                    reference_password = CASE WHEN p_password != '''' THEN EXCLUDED.reference_password ELSE profiles.reference_password END,
                    status = ''Active'';

                RETURN v_user_id;
            ELSE
                -- NEW USER CREATION
                v_user_id := gen_random_uuid();
                v_encrypted_pw := crypt(COALESCE(p_password, ''student123''), gen_salt(''bf''));
                
                INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data)
                VALUES (v_instance_id, v_user_id, ''authenticated'', ''authenticated'', v_final_email, v_encrypted_pw, NOW(), ''{"provider": "email", "providers": ["email"]}'', jsonb_build_object(''full_name'', p_name));
                
                INSERT INTO public.profiles (id, username, name, cohort, role, department, reference_password, status)
                VALUES (v_user_id, p_username, p_name, p_cohort, ''student'', v_final_dept, p_password, ''Active'');
                
                RETURN v_user_id;
            END IF;
        END; $inner$;', v_instance_id);

    RAISE NOTICE 'Password & Sync Rescue Complete.';
END $$;
