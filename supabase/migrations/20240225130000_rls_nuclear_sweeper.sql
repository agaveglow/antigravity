-- SECURITY SHIELD: MASTER RLS SWEEPER
-- This script dynamically drops all existing policies on core tables
-- and replaces them with single, optimized, and performance-tuned rules.

DO $$
DECLARE
    v_target_tables text[] := ARRAY[
        'profiles', 'courses', 'stages', 'modules', 'lessons', 
        'quizzes', 'walkthroughs', 'units', 'student_progress', 
        'curriculum_projects', 'curriculum_tasks', 'notifications', 
        'submissions', 'calendar_events', 'badges', 'student_badges', 
        'course_folders', 'erc_projects', 'erc_collaborations', 'erc_tracks'
    ];
    v_table text;
    v_policy record;
BEGIN
    -- 1. DROP ALL EXISTING POLICIES ON TARGET TABLES
    FOREACH v_table IN ARRAY v_target_tables LOOP
        FOR v_policy IN 
            SELECT policyname 
            FROM pg_policies 
            WHERE schemaname = 'public' AND tablename = v_table
        LOOP
            EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', v_policy.policyname, v_table);
        END LOOP;
        
        -- Ensure RLS is enabled
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', v_table);
    END LOOP;

    -- ==========================================
    -- 2. RECREATE OPTIMIZED POLICIES
    -- ==========================================

    -- PROFILES
    CREATE POLICY "optimized_profiles_select" ON profiles FOR SELECT TO authenticated
        USING ((SELECT auth.uid()) = id OR ((SELECT role FROM profiles WHERE id = (SELECT auth.uid())) IN ('teacher', 'admin')) OR (role IN ('teacher', 'admin')));
    CREATE POLICY "optimized_profiles_update" ON profiles FOR UPDATE TO authenticated
        USING (((SELECT role FROM profiles WHERE id = (SELECT auth.uid())) IN ('teacher', 'admin')));

    -- COURSES
    CREATE POLICY "optimized_courses_select" ON courses FOR SELECT TO authenticated
        USING (((SELECT role FROM profiles WHERE id = (SELECT auth.uid())) IN ('teacher', 'admin')) OR EXISTS (SELECT 1 FROM profiles WHERE id = (SELECT auth.uid()) AND (courses.level IS NULL OR courses.level = cohort) AND (courses.subject IS NULL OR courses.subject = department)));

    -- STAGES
    CREATE POLICY "optimized_stages_select" ON stages FOR SELECT TO authenticated
        USING (((SELECT role FROM profiles WHERE id = (SELECT auth.uid())) IN ('teacher', 'admin')) OR EXISTS (SELECT 1 FROM courses c JOIN profiles p ON p.id = (SELECT auth.uid()) WHERE c.id = stages.course_id AND (c.level IS NULL OR c.level = p.cohort) AND (c.subject IS NULL OR c.subject = p.department)));

    -- MODULES
    CREATE POLICY "optimized_modules_select" ON modules FOR SELECT TO authenticated
        USING (((SELECT role FROM profiles WHERE id = (SELECT auth.uid())) IN ('teacher', 'admin')) OR EXISTS (SELECT 1 FROM stages s JOIN courses c ON c.id = s.course_id JOIN profiles p ON p.id = (SELECT auth.uid()) WHERE s.id = modules.stage_id AND (c.level IS NULL OR c.level = p.cohort) AND (c.subject IS NULL OR c.subject = p.department)));

    -- CONTENT (Lessons, Quizzes, Walkthroughs)
    CREATE POLICY "optimized_lessons_select" ON lessons FOR SELECT TO authenticated USING (true);
    CREATE POLICY "optimized_quizzes_select" ON quizzes FOR SELECT TO authenticated USING (true);
    CREATE POLICY "optimized_walkthroughs_select" ON walkthroughs FOR SELECT TO authenticated USING (true);
    
    -- STAFF MANAGEMENT FOR CONTENT
    EXECUTE 'CREATE POLICY "optimized_content_manage" ON lessons FOR ALL TO authenticated USING ((SELECT role FROM profiles WHERE id = (SELECT auth.uid())) IN (''teacher'', ''admin''))';
    EXECUTE 'CREATE POLICY "optimized_content_manage" ON quizzes FOR ALL TO authenticated USING ((SELECT role FROM profiles WHERE id = (SELECT auth.uid())) IN (''teacher'', ''admin''))';
    EXECUTE 'CREATE POLICY "optimized_content_manage" ON walkthroughs FOR ALL TO authenticated USING ((SELECT role FROM profiles WHERE id = (SELECT auth.uid())) IN (''teacher'', ''admin''))';

    -- STUDENT PROGRESS
    CREATE POLICY "optimized_progress_all" ON student_progress FOR ALL TO authenticated
        USING ((SELECT auth.uid()) = student_id OR ((SELECT role FROM profiles WHERE id = (SELECT auth.uid())) IN ('teacher', 'admin')));

    -- CURRICULUM PROJECTS & TASKS
    CREATE POLICY "optimized_curriculum_projects_select" ON curriculum_projects FOR SELECT TO authenticated
        USING (((SELECT role FROM profiles WHERE id = (SELECT auth.uid())) IN ('teacher', 'admin')) OR EXISTS (SELECT 1 FROM profiles WHERE id = (SELECT auth.uid()) AND (curriculum_projects.cohort IS NULL OR curriculum_projects.cohort = profiles.cohort) AND (curriculum_projects.subject IS NULL OR curriculum_projects.subject = profiles.department)));
    
    CREATE POLICY "optimized_curriculum_tasks_select" ON curriculum_tasks FOR SELECT TO authenticated
        USING (((SELECT role FROM profiles WHERE id = (SELECT auth.uid())) IN ('teacher', 'admin')) OR EXISTS (SELECT 1 FROM curriculum_projects cp JOIN profiles p ON p.id = (SELECT auth.uid()) WHERE cp.id = curriculum_tasks.project_id AND (cp.cohort IS NULL OR cp.cohort = p.cohort) AND (cp.subject IS NULL OR cp.subject = p.department)));

    -- NOTIFICATIONS
    CREATE POLICY "optimized_notifications_select" ON notifications FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id);
    CREATE POLICY "optimized_notifications_insert" ON notifications FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) = user_id OR ((SELECT role FROM profiles WHERE id = (SELECT auth.uid())) IN ('teacher', 'admin')));

    -- SUBMISSIONS
    CREATE POLICY "optimized_submissions_all" ON submissions FOR ALL TO authenticated
        USING ((SELECT auth.uid()) = student_id OR ((SELECT role FROM profiles WHERE id = (SELECT auth.uid())) IN ('teacher', 'admin')));

    -- CALENDAR EVENTS
    CREATE POLICY "optimized_calendar_select" ON calendar_events FOR SELECT TO authenticated USING (true);
    CREATE POLICY "optimized_calendar_manage" ON calendar_events FOR ALL TO authenticated USING (((SELECT role FROM profiles WHERE id = (SELECT auth.uid())) IN ('teacher', 'admin')));

    -- BADGES
    CREATE POLICY "optimized_badges_select" ON badges FOR SELECT TO authenticated USING (true);
    CREATE POLICY "optimized_badges_manage" ON badges FOR ALL TO authenticated USING (((SELECT role FROM profiles WHERE id = (SELECT auth.uid())) IN ('teacher', 'admin')));
    CREATE POLICY "optimized_student_badges_select" ON student_badges FOR SELECT TO authenticated USING (true);
    CREATE POLICY "optimized_student_badges_manage" ON student_badges FOR ALL TO authenticated USING (((SELECT role FROM profiles WHERE id = (SELECT auth.uid())) IN ('teacher', 'admin')));

    -- COURSE FOLDERS
    CREATE POLICY "optimized_folders_all" ON course_folders FOR ALL TO authenticated
        USING (((SELECT role FROM profiles WHERE id = (SELECT auth.uid())) IN ('teacher', 'admin')));

    -- ERC SYSTEM
    CREATE POLICY "optimized_erc_projects_select" ON erc_projects FOR SELECT TO authenticated
        USING ((SELECT auth.uid()) = owner_id OR (SELECT auth.uid()) IN (SELECT user_id FROM erc_collaborations WHERE project_id = id));
    CREATE POLICY "optimized_erc_projects_manage" ON erc_projects FOR ALL TO authenticated
        USING ((SELECT auth.uid()) = owner_id);
    
    CREATE POLICY "optimized_erc_collaborations_all" ON erc_collaborations FOR ALL TO authenticated
        USING ((SELECT auth.uid()) = user_id OR EXISTS (SELECT 1 FROM erc_projects WHERE id = project_id AND owner_id = (SELECT auth.uid())));

    CREATE POLICY "optimized_erc_tracks_all" ON erc_tracks FOR ALL TO authenticated
        USING (EXISTS (SELECT 1 FROM erc_projects p WHERE p.id = project_id AND (p.owner_id = (SELECT auth.uid()) OR (SELECT auth.uid()) IN (SELECT user_id FROM erc_collaborations WHERE project_id = p.id))));

    RAISE NOTICE 'MASTER RLS SWEEP COMPLETE. All policies optimized and redundant rules removed.';
END $$;
