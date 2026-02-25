-- NUCLEAR RESCUE: UNBLOCK ALL DELETIONS (GLOBAL SCAN) & REPAIR LOGIN
-- This version scans EVERY schema in the database to find hidden blockers.

DO $$
DECLARE
    v_instance_id uuid;
    v_rec record;
    v_sql text;
BEGIN
    -- 1. IDENTIFY THE PROJECT'S UNIQUE ID (STRICT CAPTURE)
    -- We look for the first non-null instance_id.
    SELECT instance_id INTO v_instance_id FROM auth.users WHERE instance_id IS NOT NULL LIMIT 1;
    
    -- If no users exist yet or no instance_id found, fallback to the default
    IF v_instance_id IS NULL THEN
        v_instance_id := '00000000-0000-0000-0000-000000000000';
    END IF;

    -- 2. GLOBAL CROSS-SCHEMA SCAN FOR DELETION BLOCKERS
    -- This searches EVERY table in EVERY schema (public, storage, auth, extensions, etc.)
    -- for any column that points to auth.users and lacks ON DELETE CASCADE.
    FOR v_rec IN (
        SELECT 
            tc.table_schema, 
            tc.table_name, 
            tc.constraint_name, 
            kcu.column_name, 
            ccu.table_schema AS foreign_table_schema,
            ccu.table_name AS foreign_table_name,
            ccu.column_name AS foreign_column_name 
        FROM 
            information_schema.table_constraints AS tc 
            JOIN information_schema.key_column_usage AS kcu
              ON tc.constraint_name = kcu.constraint_name
              AND tc.table_schema = kcu.table_schema
            JOIN information_schema.constraint_column_usage AS ccu
              ON ccu.constraint_name = tc.constraint_name
              AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY' 
          AND ccu.table_name = 'users' 
          AND ccu.table_schema = 'auth'
          -- Skip if already CASCADE or SET NULL (optional, but safer to just re-apply)
    ) LOOP
        -- Log the action
        RAISE NOTICE 'Fixing blocker: %.% (%) points to auth.users', v_rec.table_schema, v_rec.table_name, v_rec.constraint_name;

        -- Drop the existing constraint
        EXECUTE format('ALTER TABLE %I.%I DROP CONSTRAINT IF EXISTS %I', v_rec.table_schema, v_rec.table_name, v_rec.constraint_name);
        
        -- Re-add with ON DELETE CASCADE
        EXECUTE format('ALTER TABLE %I.%I ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES auth.users(id) ON DELETE CASCADE', 
            v_rec.table_schema, v_rec.table_name, v_rec.constraint_name, v_rec.column_name);
    END LOOP;

    -- 3. FIX PROFILES SPECIFICALLY (Ensures public link is solid)
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'profiles_id_fkey') THEN
        ALTER TABLE public.profiles DROP CONSTRAINT profiles_id_fkey;
    END IF;
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

    -- 4. REPAIR ALL AUTH USERS (CLEAN SLATE FOR LOGIN)
    UPDATE auth.users
    SET 
        instance_id = v_instance_id,
        aud = 'authenticated',
        role = 'authenticated',
        email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
        -- Force correct format: username@erc-learn.local
        -- We extract the "username" part from the current email (before @)
        email = split_part(email, '@', 1) || '@erc-learn.local',
        raw_app_meta_data = '{"provider": "email", "providers": ["email"]}'::jsonb,
        is_sso_user = false
    WHERE id IN (SELECT id FROM public.profiles WHERE role = 'student');

    -- Restore Name metadata
    UPDATE auth.users u
    SET raw_user_meta_data = jsonb_build_object('full_name', p.name)
    FROM public.profiles p
    WHERE u.id = p.id AND (u.raw_user_meta_data IS NULL OR u.raw_user_meta_data = '{}'::jsonb);

    -- 5. RE-DEPLOY THE CREATION RPC (WITH ROBUSTNESS)
    EXECUTE format('
        CREATE OR REPLACE FUNCTION manage_student_auth(
            p_username text, p_password text, p_name text, p_cohort text, p_department text DEFAULT ''music''
        ) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $inner$
        DECLARE
            new_user_id uuid; encrypted_pw text; final_dept text; final_email text;
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN (''teacher'', ''admin'')) THEN
                RAISE EXCEPTION ''Unauthorized'';
            END IF;
            final_dept := COALESCE(p_department, ''music'');
            final_email := lower(p_username) || ''@erc-learn.local'';
            new_user_id := gen_random_uuid();
            encrypted_pw := crypt(COALESCE(p_password, ''student123''), gen_salt(''bf''));
            INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data)
            VALUES (''%s'', new_user_id, ''authenticated'', ''authenticated'', final_email, encrypted_pw, NOW(), ''{"provider": "email", "providers": ["email"]}'', jsonb_build_object(''full_name'', p_name));
            INSERT INTO public.profiles (id, username, name, cohort, role, department, reference_password, status)
            VALUES (new_user_id, p_username, p_name, p_cohort, ''student'', final_dept, p_password, ''Active'');
            RETURN new_user_id;
        END; $inner$;', v_instance_id);

    RAISE NOTICE 'Nuclear Rescue Phase Complete. Instance ID: %', v_instance_id;
END $$;
