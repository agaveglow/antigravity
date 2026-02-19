-- REVISED DEEP CLEANUP FOR "Project 1: Live Practice" (Course ID: 6e86afe3-c6db-4670-80ff-50294cd1c485)
-- Run this in the Supabase Dashboard SQL Editor to fix schema and handle dependencies.

-- 1. Ensure columns exist (fixing schema discrepancy)
ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE;
ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS module_id UUID REFERENCES public.modules(id) ON DELETE CASCADE;
ALTER TABLE public.quizzes ADD COLUMN IF NOT EXISTS course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE;
ALTER TABLE public.quizzes ADD COLUMN IF NOT EXISTS module_id UUID REFERENCES public.modules(id) ON DELETE CASCADE;

DO $$ 
DECLARE
    target_course_id UUID := '6e86afe3-c6db-4670-80ff-50294cd1c485';
    stage_ids UUID[];
    module_ids UUID[];
    content_ids UUID[];
BEGIN
    -- 2. Identify all stages for this course
    SELECT array_agg(id) INTO stage_ids FROM stages WHERE course_id = target_course_id;
    
    -- 3. Identify all modules for these stages
    SELECT array_agg(id) INTO module_ids FROM modules WHERE stage_id = ANY(stage_ids);
    
    -- 4. Identify all content (quizzes, lessons, walkthroughs) for these modules
    SELECT array_agg(id) INTO content_ids FROM (
        SELECT id FROM quizzes WHERE module_id = ANY(module_ids)
        UNION
        SELECT id FROM lessons WHERE module_id = ANY(module_ids)
        UNION
        SELECT id FROM walkthroughs WHERE module_id = ANY(module_ids)
    ) s;

    -- 5. Delete Dependencies
    IF content_ids IS NOT NULL THEN
        RAISE NOTICE 'Deleting dependencies for % items', array_length(content_ids, 1);
        DELETE FROM content_completion WHERE content_id = ANY(content_ids);
        DELETE FROM calendar_events WHERE related_id = ANY(content_ids);
    END IF;

    -- 6. Delete Content
    IF module_ids IS NOT NULL THEN
        RAISE NOTICE 'Deleting content for % modules', array_length(module_ids, 1);
        DELETE FROM quizzes WHERE module_id = ANY(module_ids);
        DELETE FROM lessons WHERE module_id = ANY(module_ids);
        DELETE FROM walkthroughs WHERE module_id = ANY(module_ids);
    END IF;

    -- 7. Delete Modules and Stages
    IF stage_ids IS NOT NULL THEN
        RAISE NOTICE 'Deleting % stages and their modules', array_length(stage_ids, 1);
        DELETE FROM modules WHERE stage_id = ANY(stage_ids);
        DELETE FROM stages WHERE id = ANY(stage_ids);
    END IF;

    RAISE NOTICE 'Cleanup completed successfully.';
END $$;
