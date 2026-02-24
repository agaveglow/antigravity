-- 1. Add DELETE policy to profiles
-- Allow teachers and admins to delete student profiles
CREATE POLICY "Teachers and admins can delete profiles"
ON public.profiles
FOR DELETE
USING (
  get_user_role(auth.uid()) IN ('teacher', 'admin')
);

-- 2. Add foreign key to student_progress with ON DELETE CASCADE
-- This ensures that progress records are removed when a student is deleted
-- We first need to clean up any orphaned records if they exist (shouldn't, but good practice)
DELETE FROM public.student_progress 
WHERE student_id NOT IN (SELECT id FROM auth.users);

-- Now add the constraint. Note: we use student_id REFERENCES auth.users(id) 
-- because students are basically users. 
ALTER TABLE public.student_progress
DROP CONSTRAINT IF EXISTS student_progress_student_id_fkey,
ADD CONSTRAINT student_progress_student_id_fkey 
FOREIGN KEY (student_id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;

-- 3. Ensure other related tables have CASCADE if missing
-- Notifications already has it (from create_notifications_system.sql)
-- Student Badges already has it (from create_badges_system.sql)
-- Submissions already has it (from fix_submissions_rls.sql)
