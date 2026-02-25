-- SECURITY SHIELD: PERFORMANCE INDEXING
-- This script adds missing indexes to foreign keys as identified by the Supabase Linter.
-- Optimizes query plans and speeds up cascaded deletions.

DO $$
BEGIN
    -- 1. EDUCATIONAL CONTENT (Courses, Modules, Lessons, Quizzes, Units)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'courses') THEN
        CREATE INDEX IF NOT EXISTS idx_courses_folder_id ON public.courses(folder_id);
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lessons') THEN
        CREATE INDEX IF NOT EXISTS idx_lessons_course_id ON public.lessons(course_id);
        CREATE INDEX IF NOT EXISTS idx_lessons_module_id ON public.lessons(module_id);
        CREATE INDEX IF NOT EXISTS idx_lessons_unit_id ON public.lessons(unit_id);
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'quizzes') THEN
        CREATE INDEX IF NOT EXISTS idx_quizzes_course_id ON public.quizzes(course_id);
        CREATE INDEX IF NOT EXISTS idx_quizzes_lesson_id ON public.quizzes(lesson_id);
        CREATE INDEX IF NOT EXISTS idx_quizzes_module_id ON public.quizzes(module_id);
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'units') THEN
        CREATE INDEX IF NOT EXISTS idx_units_course_id ON public.units(course_id);
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'stages') THEN
        CREATE INDEX IF NOT EXISTS idx_stages_course_id ON public.stages(course_id);
    END IF;

    -- 2. ERC MODULE (Availability, Bookings, Collaborations, Tasks, Projects)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'erc_availability') THEN
        CREATE INDEX IF NOT EXISTS idx_erc_availability_teacher_id ON public.erc_availability(teacher_id);
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'erc_bookings') THEN
        CREATE INDEX IF NOT EXISTS idx_erc_bookings_booker_id ON public.erc_bookings(booker_id);
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'erc_collaborations') THEN
        CREATE INDEX IF NOT EXISTS idx_erc_collaborations_user_id ON public.erc_collaborations(user_id);
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'erc_projects') THEN
        CREATE INDEX IF NOT EXISTS idx_erc_projects_owner_id ON public.erc_projects(owner_id);
        CREATE INDEX IF NOT EXISTS idx_erc_projects_target_student_id ON public.erc_projects(target_student_id);
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'erc_tasks') THEN
        CREATE INDEX IF NOT EXISTS idx_erc_tasks_assigned_to ON public.erc_tasks(assigned_to);
        CREATE INDEX IF NOT EXISTS idx_erc_tasks_project_id ON public.erc_tasks(project_id);
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'erc_tracks') THEN
        CREATE INDEX IF NOT EXISTS idx_erc_tracks_project_id ON public.erc_tracks(project_id);
    END IF;

    -- 3. USER DATA & ADMIN (Submissions, Achievements, Badges, Invites)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'submissions') THEN
        CREATE INDEX IF NOT EXISTS idx_submissions_task_id ON public.submissions(task_id);
        CREATE INDEX IF NOT EXISTS idx_submissions_verified_by ON public.submissions(verified_by);
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'project_assessments') THEN
        CREATE INDEX IF NOT EXISTS idx_project_assessments_project_id ON public.project_assessments(project_id);
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'student_achievements') THEN
        CREATE INDEX IF NOT EXISTS idx_student_achievements_achievement_id ON public.student_achievements(achievement_id);
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'student_badges') THEN
        CREATE INDEX IF NOT EXISTS idx_student_badges_awarded_by ON public.student_badges(awarded_by);
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'student_invites') THEN
        CREATE INDEX IF NOT EXISTS idx_student_invites_invited_by ON public.student_invites(invited_by);
    END IF;

    RAISE NOTICE 'PERFORMANCE INDEXING COMPLETE. All foreign keys are now covered.';
END $$;
