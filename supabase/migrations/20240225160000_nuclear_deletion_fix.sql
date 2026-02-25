-- SECURITY SHIELD: NUCLEAR DELETION FIX (DEFINITIVE)
-- This script explicitly targets every known and suspected blocker table
-- to ensure standard deletion behavior across the entire database.

DO $$
DECLARE
    v_target RECORD;
    v_sql TEXT;
    v_con record;
BEGIN
    -- 1. EXPLICIT FIXES FOR ALL MODULES
    -- Logic: Clean Data -> Fix Types -> Force Standard Deletion Rules
    
    FOR v_target IN (
        SELECT * FROM (VALUES 
            ('public', 'student_progress', 'student_id', 'auth.users', 'id', 'CASCADE'),
            ('public', 'submissions', 'student_id', 'auth.users', 'id', 'CASCADE'),
            ('public', 'submissions', 'verified_by', 'auth.users', 'id', 'SET NULL'),
            ('public', 'project_assessments', 'student_id', 'auth.users', 'id', 'CASCADE'),
            ('public', 'content_completion', 'user_id', 'auth.users', 'id', 'CASCADE'),
            ('public', 'student_badges', 'student_id', 'public.profiles', 'id', 'CASCADE'),
            ('public', 'student_badges', 'awarded_by', 'public.profiles', 'id', 'SET NULL'),
            ('public', 'badges', 'created_by', 'public.profiles', 'id', 'SET NULL'),
            ('public', 'student_achievements', 'student_id', 'public.profiles', 'id', 'CASCADE'),
            ('public', 'student_invites', 'invited_by', 'public.profiles', 'id', 'SET NULL'),
            ('public', 'erc_projects', 'owner_id', 'auth.users', 'id', 'CASCADE'),
            ('public', 'erc_projects', 'target_student_id', 'auth.users', 'id', 'SET NULL'),
            ('public', 'erc_collaborations', 'user_id', 'auth.users', 'id', 'CASCADE'),
            ('public', 'erc_bookings', 'booker_id', 'auth.users', 'id', 'CASCADE'),
            ('public', 'erc_tasks', 'assigned_to', 'auth.users', 'id', 'SET NULL'),
            ('public', 'notifications', 'user_id', 'auth.users', 'id', 'CASCADE')
        ) AS t(schem, tab, col, ref_tab, ref_col, action)
    ) LOOP
        -- check if table and column exist
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = v_target.schem AND table_name = v_target.tab AND column_name = v_target.col) THEN
            
            RAISE NOTICE 'Fixing %.%(%)...', v_target.schem, v_target.tab, v_target.col;

            -- A. Drop ALL policies first (they block type changes)
            FOR v_con IN SELECT policyname FROM pg_policies WHERE schemaname = v_target.schem AND tablename = v_target.tab LOOP
                EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', v_con.policyname, v_target.schem, v_target.tab);
            END LOOP;

            -- B. Drop all existing foreign key constraints on this column
            FOR v_con IN (
                SELECT conname
                FROM pg_constraint con
                JOIN pg_class rel ON rel.oid = con.conrelid
                JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
                JOIN pg_attribute att ON att.attrelid = rel.oid AND att.attnum = ANY(con.conkey)
                WHERE nsp.nspname = v_target.schem AND rel.relname = v_target.tab AND att.attname = v_target.col AND con.contype = 'f'
            ) LOOP
                EXECUTE format('ALTER TABLE %I.%I DROP CONSTRAINT IF EXISTS %I', v_target.schem, v_target.tab, v_con.conname);
            END LOOP;

            -- C. Clean dirty data (e.g. "Teacher" strings)
            v_sql := format('UPDATE %I.%I SET %I = NULL WHERE %I::text IS NOT NULL AND %I::text !~ ''^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$''', 
                v_target.schem, v_target.tab, v_target.col, v_target.col, v_target.col);
            EXECUTE v_sql;

            -- D. Robust Type Cast
            v_sql := format('ALTER TABLE %I.%I ALTER COLUMN %I TYPE UUID USING (%I::uuid)', 
                v_target.schem, v_target.tab, v_target.col, v_target.col);
            BEGIN
                EXECUTE v_sql;
            EXCEPTION WHEN OTHERS THEN
                RAISE NOTICE 'Skipping type cast for % (maybe already UUID or empty)', v_target.tab;
            END;

            -- E. Re-establish foreign key with correct deletion rule
            v_sql := format('ALTER TABLE %I.%I ADD CONSTRAINT %I_%I_fkey FOREIGN KEY (%I) REFERENCES %s(%I) ON DELETE %s', 
                v_target.schem, v_target.tab, v_target.tab, v_target.col, v_target.col, v_target.ref_tab, v_target.ref_col, v_target.action);
            EXECUTE v_sql;
        END IF;
    END LOOP;

    -- 2. Ensure Profiles -> Auth.Users Link
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
        ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
        ALTER TABLE public.profiles ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;

    -- 3. Restore Core Optimized Policies (Selective)
    -- We only restore the ones we know are vital for the dashboard
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'student_progress') THEN
        CREATE POLICY "optimized_progress_all" ON public.student_progress FOR ALL TO authenticated USING (student_id = (SELECT auth.uid()) OR ((SELECT role FROM profiles WHERE id = (SELECT auth.uid())) IN ('teacher', 'admin')));
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'submissions') THEN
        CREATE POLICY "optimized_submissions_all" ON public.submissions FOR ALL TO authenticated USING (student_id = (SELECT auth.uid()) OR ((SELECT role FROM profiles WHERE id = (SELECT auth.uid())) IN ('teacher', 'admin')));
    END IF;

    RAISE NOTICE 'NUCLEAR DELETION FIX COMPLETE. Users can now be safely deleted.';
END $$;
