-- Add published column to courses table (default to false to be safe, or true? Let's default to false for new courses, but maybe backfill existing as true?)
-- Let's default to true for existing courses so they don't disappear, but false for new ones is better for "Draft" flow.
-- Actually, let's default to false, but update existing rows to true.

ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS published BOOLEAN DEFAULT false;

-- Backfill existing courses to be published
UPDATE public.courses SET published = true WHERE published IS FALSE;

-- Update RLS Policy to respect published status for students
DROP POLICY IF EXISTS "View courses based on cohort and department" ON courses;

CREATE POLICY "View courses based on cohort and department" ON courses
FOR SELECT USING (
  (auth.role() = 'authenticated' AND (
    -- Teachers and Admins can view all courses
    EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND role IN ('teacher', 'admin')
    )
    OR
    -- Students can only view PUBLISHED courses that match their cohort and department
    (
        published = true
        AND
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND (courses.level IS NULL OR courses.level = profiles.cohort)
            AND (courses.subject IS NULL OR courses.subject = profiles.department)
        )
    )
  ))
);
