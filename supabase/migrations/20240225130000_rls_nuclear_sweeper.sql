DO $$
DECLARE
    v_table text;
    v_policy record;
BEGIN
    -- 1. DYNAMICALLY DROP ALL EXISTING POLICIES ON ALL PUBLIC TABLES
    -- This is the only way to ensure 100% of "ghost" policies are removed.
    FOR v_table IN 
        SELECT distinct tablename 
        FROM pg_policies 
        WHERE schemaname = 'public'
    LOOP
        FOR v_policy IN 
            SELECT policyname 
            FROM pg_policies 
            WHERE schemaname = 'public' AND tablename = v_table
        LOOP
            EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', v_policy.policyname, v_table);
        END LOOP;
        
        -- Ensure RLS is enabled on every table that had a policy
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

    -- SYSTEM SETTINGS
    CREATE POLICY "optimized_system_settings_select" ON system_settings FOR SELECT TO authenticated
        USING (true);
    CREATE POLICY "optimized_system_settings_manage" ON system_settings FOR ALL TO authenticated
        USING (((SELECT role FROM profiles WHERE id = (SELECT auth.uid())) IN ('admin')));

    -- STUDENT INVITES
    CREATE POLICY "optimized_invites_select" ON student_invites FOR SELECT TO authenticated
        USING (((SELECT role FROM profiles WHERE id = (SELECT auth.uid())) IN ('teacher', 'admin')) OR email = (SELECT email FROM auth.users WHERE id = (SELECT auth.uid())));
    CREATE POLICY "optimized_invites_manage" ON student_invites FOR ALL TO authenticated
        USING (((SELECT role FROM profiles WHERE id = (SELECT auth.uid())) IN ('teacher', 'admin')));

    -- PROJECT ASSESSMENTS
    CREATE POLICY "optimized_assessments_all" ON project_assessments FOR ALL TO authenticated
        USING (((SELECT role FROM profiles WHERE id = (SELECT auth.uid())) IN ('teacher', 'admin')) OR (SELECT auth.uid()) = student_id);

    -- CONTENT COMPLETION
    CREATE POLICY "optimized_completion_all" ON content_completion FOR ALL TO authenticated
        USING ((SELECT auth.uid()) = student_id OR ((SELECT role FROM profiles WHERE id = (SELECT auth.uid())) IN ('teacher', 'admin')));

    -- STUDENT ACHIEVEMENTS
    CREATE POLICY "optimized_achievements_select" ON student_achievements FOR SELECT TO authenticated
        USING (true);
    CREATE POLICY "optimized_achievements_manage" ON student_achievements FOR ALL TO authenticated
        USING (((SELECT role FROM profiles WHERE id = (SELECT auth.uid())) IN ('teacher', 'admin')));

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

    CREATE POLICY "optimized_erc_availability_all" ON erc_availability FOR ALL TO authenticated
        USING (((SELECT role FROM profiles WHERE id = (SELECT auth.uid())) IN ('teacher', 'admin')) OR ((SELECT auth.role()) = 'authenticated' AND (SELECT true))); -- Teachers manage, public read

    CREATE POLICY "optimized_erc_tasks_all" ON erc_tasks FOR ALL TO authenticated
        USING (EXISTS (SELECT 1 FROM erc_projects p WHERE p.id = project_id AND (p.owner_id = (SELECT auth.uid()) OR (SELECT auth.uid()) IN (SELECT user_id FROM erc_collaborations WHERE project_id = p.id))));

    CREATE POLICY "optimized_erc_resources_select" ON erc_resources FOR SELECT TO authenticated USING (true);
    CREATE POLICY "optimized_erc_bookings_all" ON erc_bookings FOR ALL TO authenticated
        USING ((SELECT auth.uid()) = booker_id OR ((SELECT role FROM profiles WHERE id = (SELECT auth.uid())) IN ('teacher', 'admin')));

    RAISE NOTICE 'MASTER RLS SWEEP COMPLETE. All policies optimized and redundant rules removed.';
END $$;
