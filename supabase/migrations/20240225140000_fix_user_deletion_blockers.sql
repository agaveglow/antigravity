-- SECURITY SHIELD: USER DELETION BLOCKER REMOVAL
-- This script ensures that all tables referencing auth.users or public.profiles
-- have correct ON DELETE actions to prevent 500 errors during user deletion.

DO $$
DECLARE
    v_table text;
    v_constraint text;
    v_column text;
    v_ref_table text;
    v_sql text;
BEGIN
    -- 1. SPECIFIC FIXES FOR KNOWN BLOCKERS
    
    -- Tables that should be wiped when a student is deleted (CASCADE)
    -- student_progress, submissions, project_assessments, content_completion, student_badges
    
    -- We'll use a helper logic to drop and recreate constraints for reliability
    
    -- Table: student_progress
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'student_progress') THEN
        ALTER TABLE student_progress DROP CONSTRAINT IF EXISTS student_progress_student_id_fkey;
        ALTER TABLE student_progress ADD CONSTRAINT student_progress_student_id_fkey 
            FOREIGN KEY (student_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;

    -- Table: submissions
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'submissions') THEN
        ALTER TABLE submissions DROP CONSTRAINT IF EXISTS submissions_student_id_fkey;
        ALTER TABLE submissions ADD CONSTRAINT submissions_student_id_fkey 
            FOREIGN KEY (student_id) REFERENCES auth.users(id) ON DELETE CASCADE;
            
        ALTER TABLE submissions DROP CONSTRAINT IF EXISTS submissions_verified_by_fkey;
        ALTER TABLE submissions ADD CONSTRAINT submissions_verified_by_fkey 
            FOREIGN KEY (verified_by) REFERENCES auth.users(id) ON DELETE SET NULL;
    END IF;

    -- Table: project_assessments
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'project_assessments') THEN
        ALTER TABLE project_assessments DROP CONSTRAINT IF EXISTS project_assessments_student_id_fkey;
        ALTER TABLE project_assessments ADD CONSTRAINT project_assessments_student_id_fkey 
            FOREIGN KEY (student_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;

    -- Table: content_completion
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'content_completion') THEN
        ALTER TABLE content_completion DROP CONSTRAINT IF EXISTS content_completion_user_id_fkey;
        ALTER TABLE content_completion ADD CONSTRAINT content_completion_user_id_fkey 
            FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;

    -- Table: student_badges
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'student_badges') THEN
        ALTER TABLE student_badges DROP CONSTRAINT IF EXISTS student_badges_student_id_fkey;
        ALTER TABLE student_badges ADD CONSTRAINT student_badges_student_id_fkey 
            FOREIGN KEY (student_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
            
        ALTER TABLE student_badges DROP CONSTRAINT IF EXISTS student_badges_awarded_by_fkey;
        ALTER TABLE student_badges ADD CONSTRAINT student_badges_awarded_by_fkey 
            FOREIGN KEY (awarded_by) REFERENCES public.profiles(id) ON DELETE SET NULL;
    END IF;

    -- Table: badges (Staff-linked)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'badges') THEN
        ALTER TABLE badges DROP CONSTRAINT IF EXISTS badges_created_by_fkey;
        ALTER TABLE badges ADD CONSTRAINT badges_created_by_fkey 
            FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;
    END IF;

    -- 2. DYNAMIC CASCADE ENFORCER (Safety Net)
    -- This block finds any other foreign keys pointing to auth.users or public.profiles
    -- that don't have a deletion action and sets them to CASCADE or SET NULL.
    
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
        -- Determine strategy: CASCADE for student/user data, SET NULL for metadata/audit
        IF v_column IN ('student_id', 'user_id', 'id', 'owner_id', 'booker_id') THEN
            v_sql := format('ALTER TABLE public.%I DROP CONSTRAINT %I, ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES %s(%s) ON DELETE CASCADE', 
                v_table, v_constraint, v_constraint, v_column, 
                CASE WHEN v_ref_table = 'users' THEN 'auth.users' ELSE 'public.profiles' END,
                'id');
        ELSE
            v_sql := format('ALTER TABLE public.%I DROP CONSTRAINT %I, ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES %s(%s) ON DELETE SET NULL', 
                v_table, v_constraint, v_constraint, v_column, 
                CASE WHEN v_ref_table = 'users' THEN 'auth.users' ELSE 'public.profiles' END,
                'id');
        END IF;
        
        RAISE NOTICE 'Enforcing deletion rule on %: %', v_table, v_sql;
        EXECUTE v_sql;
    END LOOP;

    RAISE NOTICE 'USER DELETION BLOCKERS REMOVED. You can now delete users safely.';
END $$;
