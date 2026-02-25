-- SECURITY SHIELD PHASE 3: POLICY ENFORCEMENT
-- Defines missing RLS policies for student_progress, walkthroughs, and units.

DO $$
BEGIN
    -- 1. POLICIES FOR student_progress
    -- Students should see their own progress, teachers see all.
    -- Students can mark their own progress as complete (update).
    DROP POLICY IF EXISTS "Students can view own progress" ON student_progress;
    CREATE POLICY "Students can view own progress" ON student_progress
        FOR SELECT TO authenticated USING (auth.uid() = student_id);

    DROP POLICY IF EXISTS "Teachers can view all progress" ON student_progress;
    CREATE POLICY "Teachers can view all progress" ON student_progress
        FOR SELECT TO authenticated USING (
            EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('teacher', 'admin'))
        );

    DROP POLICY IF EXISTS "Students can create own progress" ON student_progress;
    CREATE POLICY "Students can create own progress" ON student_progress
        FOR INSERT TO authenticated WITH CHECK (auth.uid() = student_id);

    DROP POLICY IF EXISTS "Students can update own progress" ON student_progress;
    CREATE POLICY "Students can update own progress" ON student_progress
        FOR UPDATE TO authenticated USING (auth.uid() = student_id);

    DROP POLICY IF EXISTS "Teachers can manage all progress" ON student_progress;
    CREATE POLICY "Teachers can manage all progress" ON student_progress
        FOR ALL TO authenticated USING (
            EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('teacher', 'admin'))
        );

    -- 2. POLICIES FOR walkthroughs
    -- Standard curriculum content: Everyone views, Teachers manage.
    DROP POLICY IF EXISTS "Authenticated users can view walkthroughs" ON walkthroughs;
    CREATE POLICY "Authenticated users can view walkthroughs" ON walkthroughs
        FOR SELECT TO authenticated USING (true);

    DROP POLICY IF EXISTS "Teachers can manage walkthroughs" ON walkthroughs;
    CREATE POLICY "Teachers can manage walkthroughs" ON walkthroughs
        FOR ALL TO authenticated USING (
            EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('teacher', 'admin'))
        );

    -- 3. POLICIES FOR units (if table exists)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'units') THEN
        DROP POLICY IF EXISTS "Authenticated users can view units" ON units;
        EXECUTE 'CREATE POLICY "Authenticated users can view units" ON units FOR SELECT TO authenticated USING (true)';
        
        DROP POLICY IF EXISTS "Teachers can manage units" ON units;
        EXECUTE 'CREATE POLICY "Teachers can manage units" ON units FOR ALL TO authenticated USING (
            EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN (''teacher'', ''admin''))
        )';
    END IF;

    RAISE NOTICE 'Security Shield Phase 3 Complete.';
END $$;
