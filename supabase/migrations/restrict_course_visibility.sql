-- Drop existing select policy
DROP POLICY IF EXISTS "Anyone can view courses" ON courses;

-- Create new strict visibility policy
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
    -- Students can only view courses that match their cohort and department
    -- Or courses that are "Global" (NULL level/subject)
    EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND (courses.level IS NULL OR courses.level = profiles.cohort)
        AND (courses.subject IS NULL OR courses.subject = profiles.department)
    )
  ))
);
