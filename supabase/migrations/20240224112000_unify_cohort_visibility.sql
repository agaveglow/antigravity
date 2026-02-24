-- 1. Ensure columns exist on curriculum_projects
ALTER TABLE curriculum_projects ADD COLUMN IF NOT EXISTS subject TEXT;
ALTER TABLE curriculum_projects ADD COLUMN IF NOT EXISTS cohort TEXT;

-- 2. Harmonize Course and Project levels with Profile cohorts
-- We assume 'Level 2', 'Level 3A', 'Level 3B' are the standard values in profiles.cohort
UPDATE courses SET level = 'Level 2' WHERE level = 'level_2';
UPDATE courses SET level = 'Level 3A' WHERE level = 'level_3a';
UPDATE courses SET level = 'Level 3B' WHERE level = 'level_3b';

-- 2. Update Courses RLS
DROP POLICY IF EXISTS "View courses based on cohort and department" ON courses;
CREATE POLICY "View courses based on cohort and department" ON courses
FOR SELECT USING (
  auth.role() = 'authenticated' AND (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('teacher', 'admin'))
    OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND (courses.level IS NULL OR courses.level = profiles.cohort)
      AND (courses.subject IS NULL OR courses.subject = profiles.department)
    )
  )
);

-- 3. Update Stages and Modules RLS (Ensure they inherit visibility from parent course)
DROP POLICY IF EXISTS "Students can only see stages of their courses" ON stages;
CREATE POLICY "Students can only see stages of their courses" ON stages
FOR SELECT USING (
  auth.role() = 'authenticated' AND (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('teacher', 'admin'))
    OR
    EXISTS (
      SELECT 1 FROM courses c
      JOIN profiles p ON p.id = auth.uid()
      WHERE c.id = stages.course_id
      AND (c.level IS NULL OR c.level = p.cohort)
      AND (c.subject IS NULL OR c.subject = p.department)
    )
  )
);

DROP POLICY IF EXISTS "Students can only see modules of their courses" ON modules;
CREATE POLICY "Students can only see modules of their courses" ON modules
FOR SELECT USING (
  auth.role() = 'authenticated' AND (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('teacher', 'admin'))
    OR
    EXISTS (
        SELECT 1 FROM stages s
        JOIN courses c ON c.id = s.course_id
        JOIN profiles p ON p.id = auth.uid()
        WHERE s.id = modules.stage_id
        AND (c.level IS NULL OR c.level = p.cohort)
        AND (c.subject IS NULL OR c.subject = p.department)
    )
  )
);

-- 4. Projects RLS
ALTER TABLE curriculum_projects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Students can only see their cohort projects" ON curriculum_projects;
CREATE POLICY "Students can only see their cohort projects" ON curriculum_projects
FOR SELECT USING (
  auth.role() = 'authenticated' AND (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('teacher', 'admin'))
    OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND (curriculum_projects.cohort IS NULL OR curriculum_projects.cohort = profiles.cohort)
      AND (curriculum_projects.subject IS NULL OR curriculum_projects.subject = profiles.department)
    )
  )
);

-- 5. Project Tasks RLS
ALTER TABLE curriculum_tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Students can only see tasks of their projects" ON curriculum_tasks;
CREATE POLICY "Students can only see tasks of their projects" ON curriculum_tasks
FOR SELECT USING (
  auth.role() = 'authenticated' AND (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('teacher', 'admin'))
    OR
    EXISTS (
      SELECT 1 FROM curriculum_projects cp
      JOIN profiles p ON p.id = auth.uid()
      WHERE cp.id = curriculum_tasks.project_id
      AND (cp.cohort IS NULL OR cp.cohort = p.cohort)
      AND (cp.subject IS NULL OR cp.subject = p.department)
    )
  )
);
