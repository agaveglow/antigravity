-- SECURITY SHIELD: USER DELETION BLOCKER REMOVAL (FINAL BULLETPROOF VERSION)
-- This script ensures that all tables referencing auth.users or public.profiles
-- have correct ON DELETE actions and compatible UUID types, handling dirty data safely.

DO $$
DECLARE
    v_table text;
    v_policy record;
    v_constraint text;
    v_column text;
    v_ref_table text;
    v_sql text;
BEGIN
    -- 1. CLEANSING & ROBUST FIXES
    -- This loops through progress, submissions, and assessments tables
    FOR v_table IN VALUES ('student_progress'), ('submissions'), ('project_assessments'), ('content_completion') LOOP
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = v_table) THEN
            
            -- A. Drop ALL policies on this table (they block column type changes)
            FOR v_policy IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = v_table LOOP
                EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', v_policy.policyname, v_table);
            END LOOP;
            
            -- B. Clean Data & Fix Types (Safely NULL anything that isn't a UUID)
            -- We cast to ::text for the regex check to support tables that are already UUID
            IF v_table = 'content_completion' THEN
                UPDATE public.content_completion 
                SET user_id = NULL 
                WHERE user_id::text IS NOT NULL AND user_id::text !~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$';
                
                ALTER TABLE public.content_completion ALTER COLUMN user_id TYPE UUID USING (user_id::uuid);
            ELSE
                -- All others use 'student_id'
                EXECUTE format('UPDATE public.%I SET student_id = NULL WHERE student_id::text IS NOT NULL AND student_id::text !~ ''^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$''', v_table);
                EXECUTE format('ALTER TABLE public.%I ALTER COLUMN student_id TYPE UUID USING (student_id::uuid)', v_table);
                
                IF v_table = 'submissions' THEN
                    -- Special handling for verified_by
                    UPDATE public.submissions 
                    SET verified_by = NULL 
                    WHERE verified_by::text IS NOT NULL AND verified_by::text !~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$';
                    
                    ALTER TABLE public.submissions ALTER COLUMN verified_by TYPE UUID USING (verified_by::uuid);
                END IF;
            END IF;
            
            -- C. Restore Constraints (CASCADE)
            IF v_table = 'content_completion' THEN
               ALTER TABLE public.content_completion DROP CONSTRAINT IF EXISTS content_completion_user_id_fkey;
               ALTER TABLE public.content_completion ADD CONSTRAINT content_completion_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
            ELSE
               EXECUTE format('ALTER TABLE public.%I DROP CONSTRAINT IF EXISTS %I_student_id_fkey', v_table, v_table);
               EXECUTE format('ALTER TABLE public.%I ADD CONSTRAINT %I_student_id_fkey FOREIGN KEY (student_id) REFERENCES auth.users(id) ON DELETE CASCADE', v_table, v_table);
               
               IF v_table = 'submissions' THEN
                  ALTER TABLE public.submissions DROP CONSTRAINT IF EXISTS submissions_verified_by_fkey;
                  ALTER TABLE public.submissions ADD CONSTRAINT submissions_verified_by_fkey FOREIGN KEY (verified_by) REFERENCES auth.users(id) ON DELETE SET NULL;
               END IF;
            END IF;
        END IF;
    END LOOP;

    -- 2. Restore All Optimized Policies
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'student_progress') THEN
        CREATE POLICY "optimized_progress_all" ON public.student_progress FOR ALL TO authenticated USING (student_id = (SELECT auth.uid()) OR ((SELECT role FROM profiles WHERE id = (SELECT auth.uid())) IN ('teacher', 'admin')));
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'submissions') THEN
        CREATE POLICY "optimized_submissions_all" ON public.submissions FOR ALL TO authenticated USING (student_id = (SELECT auth.uid()) OR ((SELECT role FROM profiles WHERE id = (SELECT auth.uid())) IN ('teacher', 'admin')));
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'project_assessments') THEN
        CREATE POLICY "optimized_assessments_all" ON public.project_assessments FOR ALL TO authenticated USING (((SELECT role FROM profiles WHERE id = (SELECT auth.uid())) IN ('teacher', 'admin')) OR (SELECT auth.uid()) = student_id);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'content_completion') THEN
        CREATE POLICY "optimized_completion_all" ON public.content_completion FOR ALL TO authenticated USING ((SELECT auth.uid()) = user_id OR ((SELECT role FROM profiles WHERE id = (SELECT auth.uid())) IN ('teacher', 'admin')));
    END IF;

    -- 3. DYNAMIC SAFETY NET for any other foreign keys
    FOR v_table, v_constraint, v_column, v_ref_table IN 
        SELECT 
            tc.table_name, 
            tc.constraint_name, 
            kcu.column_name, 
            ccu.table_name AS referenced_table_name
        FROM 
            information_schema.table_constraints AS tc 
            JOIN information_schema.key_column_usage AS kcu
              ON tc.constraint_name = kcu.constraint_name
              AND tc.table_schema = kcu.table_schema
            JOIN information_schema.constraint_column_usage AS ccu
              ON ccu.constraint_name = tc.constraint_name
              AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY' 
          AND tc.table_schema = 'public'
          AND (ccu.table_name = 'users' AND ccu.table_schema = 'auth' OR ccu.table_name = 'profiles' AND ccu.table_schema = 'public')
          AND NOT EXISTS (
              SELECT 1 FROM information_schema.referential_constraints rc
              WHERE rc.constraint_name = tc.constraint_name
              AND rc.delete_rule != 'NO ACTION'
          )
    LOOP
        v_sql := format('ALTER TABLE public.%I DROP CONSTRAINT %I, ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES %s(id) ON DELETE CASCADE', 
            v_table, v_constraint, v_constraint, v_column, CASE WHEN v_ref_table = 'users' THEN 'auth.users' ELSE 'public.profiles' END);
        EXECUTE v_sql;
    END LOOP;

    RAISE NOTICE 'DEFINITIVE BLOCKER-KILLER COMPLETE.';
END $$;
