-- STUDENT RESCUE PHASE: FIX DELETION AND LOGIN
-- This script fixes all foreign key issues and ensures login compatibility.

DO $$
DECLARE
    v_instance_id uuid;
BEGIN
    -- 1. DYNAMICALLY CAPTURE INSTANCE ID
    -- This ensures we match whatever your specific Supabase project is using.
    SELECT instance_id INTO v_instance_id FROM auth.users LIMIT 1;
    IF v_instance_id IS NULL THEN
        v_instance_id := '00000000-0000-0000-0000-000000000000';
    END IF;

    -- 2. FIX DELETION BLOCKS (CASCADING DELETES)
    
    -- Fix profiles -> auth.users link (The most likely blocker)
    -- We ensure profiles are wiped when the user is deleted from the Auth tab.
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'profiles_id_fkey') THEN
        ALTER TABLE public.profiles DROP CONSTRAINT profiles_id_fkey;
    END IF;
    ALTER TABLE public.profiles 
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

    -- Fix verified_by in submissions (If a teacher is deleted)
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'submissions_verified_by_fkey') THEN
        ALTER TABLE public.submissions DROP CONSTRAINT submissions_verified_by_fkey;
    END IF;
    ALTER TABLE public.submissions 
    ADD CONSTRAINT submissions_verified_by_fkey FOREIGN KEY (verified_by) REFERENCES auth.users(id) ON DELETE SET NULL;

    -- Fix badges created_by/awarded_by
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'badges_created_by_fkey') THEN
        ALTER TABLE public.badges DROP CONSTRAINT badges_created_by_fkey;
    END IF;
    ALTER TABLE public.badges 
    ADD CONSTRAINT badges_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'student_badges_awarded_by_fkey') THEN
        ALTER TABLE public.student_badges DROP CONSTRAINT student_badges_awarded_by_fkey;
    END IF;
    ALTER TABLE public.student_badges 
    ADD CONSTRAINT student_badges_awarded_by_fkey FOREIGN KEY (awarded_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

    -- 3. ROBUST RPC FOR FUTURE STUDENTS
    -- This version uses the caught instance_id and cleans up meta data.
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
            final_email := p_username || ''@erc-learn.local'';
            new_user_id := gen_random_uuid();
            encrypted_pw := crypt(COALESCE(p_password, ''student123''), gen_salt(''bf''));
            INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data)
            VALUES (''%s'', new_user_id, ''authenticated'', ''authenticated'', final_email, encrypted_pw, NOW(), ''{"provider": "email", "providers": ["email"]}'', jsonb_build_object(''full_name'', p_name));
            INSERT INTO public.profiles (id, username, name, cohort, role, department, reference_password, status)
            VALUES (new_user_id, p_username, p_name, p_cohort, ''student'', final_dept, p_password, ''Active'');
            RETURN new_user_id;
        END; $inner$;', v_instance_id);

    -- 4. BACKFILL AND RESET (The "Try Again" Button)
    -- This forces all existing student emails to match the domain and uses the correct instance_id.
    UPDATE auth.users
    SET 
        email = split_part(email, '@', 1) || '@erc-learn.local',
        instance_id = v_instance_id,
        aud = 'authenticated',
        role = 'authenticated',
        email_confirmed_at = COALESCE(email_confirmed_at, NOW())
    WHERE id IN (SELECT id FROM public.profiles WHERE role = 'student');

    RAISE NOTICE 'Rescue phase complete. Instance ID used: %', v_instance_id;
END $$;
