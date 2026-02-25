-- SECURITY SHIELD PHASE 4: PERFORMANCE & CONSOLIDATION
-- 1. Fixes 'auth_rls_initplan' by wrapping auth functions in (SELECT ...)
-- 2. Fixes 'multiple_permissive_policies' by merging redundant definitions.

DO $$
DECLARE
    v_table_name text;
    v_policy_name text;
    v_role text;
    v_action text;
    v_condition text;
BEGIN
    -- ==========================================
    -- 1. CONSOLIDATE REDUNDANT POLICIES
    -- ==========================================

    -- Table: calendar_events (Clean up anon and multiple teacher policies)
    DROP POLICY IF EXISTS "Teachers and admins manage calendar" ON calendar_events;
    DROP POLICY IF EXISTS "Public read on calendar" ON calendar_events;
    DROP POLICY IF EXISTS "Teacher full access calendar" ON calendar_events;
    DROP POLICY IF EXISTS "Teachers and admins full access calendar" ON calendar_events;
    DROP POLICY IF EXISTS "Allow public read on calendar" ON calendar_events;
    
    CREATE POLICY "Teachers and admins manage calendar" ON calendar_events
        FOR ALL TO authenticated
        USING ((SELECT role FROM profiles WHERE id = (SELECT auth.uid())) IN ('teacher', 'admin'));
        
    CREATE POLICY "Public read on calendar" ON calendar_events
        FOR SELECT TO authenticated
        USING (true);

    -- Table: badges
    DROP POLICY IF EXISTS "Shared badges access" ON badges;
    DROP POLICY IF EXISTS "Admin manage badges" ON badges;
    DROP POLICY IF EXISTS "Students can view badges" ON badges;
    DROP POLICY IF EXISTS "Teachers can manage badges" ON badges;
    CREATE POLICY "Shared badges access" ON badges
        FOR SELECT TO authenticated USING (true);
    CREATE POLICY "Admin manage badges" ON badges
        FOR ALL TO authenticated 
        USING ((SELECT role FROM profiles WHERE id = (SELECT auth.uid())) IN ('teacher', 'admin'));

    -- Table: badge_attachments
    DROP POLICY IF EXISTS "Shared attachments access" ON badge_attachments;
    DROP POLICY IF EXISTS "Admin manage attachments" ON badge_attachments;
    DROP POLICY IF EXISTS "Students can view attachments" ON badge_attachments;
    DROP POLICY IF EXISTS "Teachers can manage attachments" ON badge_attachments;
    CREATE POLICY "Shared attachments access" ON badge_attachments
        FOR SELECT TO authenticated USING (true);
    CREATE POLICY "Admin manage attachments" ON badge_attachments
        FOR ALL TO authenticated 
        USING ((SELECT role FROM profiles WHERE id = (SELECT auth.uid())) IN ('teacher', 'admin'));

    -- Table: submissions (Consolidate student vs teacher SELECT)
    DROP POLICY IF EXISTS "Submissions select access" ON submissions;
    DROP POLICY IF EXISTS "Users can view own submissions" ON submissions;
    DROP POLICY IF EXISTS "Students can view own submissions" ON submissions;
    DROP POLICY IF EXISTS "Teachers can view all submissions" ON submissions;
    DROP POLICY IF EXISTS "Teachers and admins can view all submissions" ON submissions;
    
    CREATE POLICY "Submissions select access" ON submissions
        FOR SELECT TO authenticated 
        USING (
            (SELECT auth.uid()) = student_id OR 
            ((SELECT role FROM profiles WHERE id = (SELECT auth.uid())) IN ('teacher', 'admin'))
        );

    -- Table: profiles (Consolidate view policies)
    DROP POLICY IF EXISTS "Profiles select policy" ON profiles;
    DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
    DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
    DROP POLICY IF EXISTS "Authenticated users can view profiles" ON profiles;
    DROP POLICY IF EXISTS "Teachers and Admins can view all profiles" ON profiles;
    DROP POLICY IF EXISTS "Allow public read-access for teacher/admin profiles" ON profiles;
    
    CREATE POLICY "Profiles select policy" ON profiles
        FOR SELECT TO authenticated
        USING (
            (SELECT auth.uid()) = id OR 
            ((SELECT role FROM profiles WHERE id = (SELECT auth.uid())) IN ('teacher', 'admin')) OR
            (role IN ('teacher', 'admin')) -- Allow viewing staff profiles
        );

    -- ==========================================
    -- 2. OPTIMIZE PERFORMANCE (auth_rls_initplan)
    -- ==========================================
    
    -- We'll manually re-create the most critical ones found in lint report with (SELECT auth.uid())
    
    -- Table: student_progress
    DROP POLICY IF EXISTS "Students can view own progress" ON student_progress;
    CREATE POLICY "Students can view own progress" ON student_progress
        FOR SELECT TO authenticated USING ((SELECT auth.uid()) = student_id);

    DROP POLICY IF EXISTS "Teachers can view all progress" ON student_progress;
    CREATE POLICY "Teachers can view all progress" ON student_progress
        FOR SELECT TO authenticated USING (
            EXISTS (SELECT 1 FROM profiles WHERE id = (SELECT auth.uid()) AND role IN ('teacher', 'admin'))
        );

    -- Table: courses
    DROP POLICY IF EXISTS "View courses based on cohort and department" ON courses;
    CREATE POLICY "View courses based on cohort and department" ON courses
    FOR SELECT TO authenticated USING (
        ((SELECT role FROM profiles WHERE id = (SELECT auth.uid())) IN ('teacher', 'admin'))
        OR
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE id = (SELECT auth.uid()) 
          AND (courses.level IS NULL OR courses.level = profiles.cohort)
          AND (courses.subject IS NULL OR courses.subject = profiles.department)
        )
    );

    -- Table: walkthroughs
    DROP POLICY IF EXISTS "Teachers can manage walkthroughs" ON walkthroughs;
    CREATE POLICY "Teachers can manage walkthroughs" ON walkthroughs
        FOR ALL TO authenticated USING (
            EXISTS (SELECT 1 FROM profiles WHERE id = (SELECT auth.uid()) AND role IN ('teacher', 'admin'))
        );

    -- Table: notifications
    DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
    CREATE POLICY "Users can view own notifications" ON notifications
        FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id);

    -- Table: curriculum_projects
    DROP POLICY IF EXISTS "Students can only see their cohort projects" ON curriculum_projects;
    CREATE POLICY "Students can only see their cohort projects" ON curriculum_projects
    FOR SELECT TO authenticated USING (
        ((SELECT role FROM profiles WHERE id = (SELECT auth.uid())) IN ('teacher', 'admin'))
        OR
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE id = (SELECT auth.uid()) 
          AND (curriculum_projects.cohort IS NULL OR curriculum_projects.cohort = profiles.cohort)
          AND (curriculum_projects.subject IS NULL OR curriculum_projects.subject = profiles.department)
        )
    );

    -- Table: course_folders
    DROP POLICY IF EXISTS "Teachers and Admins can manage folders" ON course_folders;
    CREATE POLICY "Teachers and Admins can manage folders" ON course_folders
        FOR ALL TO authenticated USING (
            ((SELECT role FROM profiles WHERE id = (SELECT auth.uid())) IN ('teacher', 'admin'))
        );

    -- Table: erc_projects
    DROP POLICY IF EXISTS "ERC projects view policy" ON erc_projects;
    DROP POLICY IF EXISTS "Users can view their own, collaborated or assigned projects" ON erc_projects;
    DROP POLICY IF EXISTS "Users can view their own or collaborated projects" ON erc_projects;
    CREATE POLICY "ERC projects view policy" ON erc_projects
        FOR SELECT TO authenticated 
        USING (
            (SELECT auth.uid()) = owner_id OR 
            (SELECT auth.uid()) IN (SELECT user_id FROM erc_collaborations WHERE project_id = id)
        );

    RAISE NOTICE 'RLS Performance Optimization & Consolidation Complete.';
END $$;
