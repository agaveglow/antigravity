-- 1. Check if order_index column exists on all tables
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE column_name = 'order_index' 
AND table_name IN ('courses', 'stages', 'modules', 'lessons', 'quizzes', 'walkthroughs', 'curriculum_projects');

-- 2. Check active RLS policies for these tables
SELECT schemaname, tablename, policyname, cmd, roles, qual, with_check 
FROM pg_policies 
WHERE tablename IN ('courses', 'stages', 'modules', 'lessons', 'quizzes', 'walkthroughs', 'curriculum_projects', 'profiles');

-- 3. Check for any "orphan" content (modules without stages, etc.)
SELECT count(*) as orphan_modules FROM modules WHERE stage_id NOT IN (SELECT id FROM stages);
SELECT count(*) as orphan_lessons FROM lessons WHERE module_id NOT IN (SELECT id FROM modules) AND course_id NOT IN (SELECT id FROM courses);
