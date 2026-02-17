-- Create stages table for course hierarchy
CREATE TABLE IF NOT EXISTS stages (
    id UUID PRIMARY KEY,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create modules table for course hierarchy
CREATE TABLE IF NOT EXISTS modules (
    id UUID PRIMARY KEY,
    stage_id UUID NOT NULL REFERENCES stages(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_stages_course_id ON stages(course_id);
CREATE INDEX IF NOT EXISTS idx_stages_order ON stages(order_index);
CREATE INDEX IF NOT EXISTS idx_modules_stage_id ON modules(stage_id);
CREATE INDEX IF NOT EXISTS idx_modules_order ON modules(order_index);

-- Enable RLS
ALTER TABLE stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Teachers can manage all stages" ON stages;
DROP POLICY IF EXISTS "Students can view stages for their courses" ON stages;
DROP POLICY IF EXISTS "Teachers can manage all modules" ON modules;
DROP POLICY IF EXISTS "Students can view modules for their stages" ON modules;

-- RLS Policies for stages
CREATE POLICY "Teachers can manage all stages"
    ON stages
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('teacher', 'admin')
        )
    );

CREATE POLICY "Students can view stages for their courses"
    ON stages
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM courses
            JOIN profiles ON profiles.id = auth.uid()
            WHERE courses.id = stages.course_id
            AND courses.published = true
            AND (
                (profiles.cohort = 'Level 2' AND courses.level = 'level_2') OR
                (profiles.cohort = 'Level 3A' AND courses.level = 'level_3a') OR
                (profiles.cohort = 'Level 3B' AND courses.level = 'level_3b')
            )
            AND (
                courses.subject IS NULL OR
                profiles.department = courses.subject
            )
        )
    );

-- RLS Policies for modules
CREATE POLICY "Teachers can manage all modules"
    ON modules
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('teacher', 'admin')
        )
    );

CREATE POLICY "Students can view modules for their stages"
    ON modules
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM stages
            JOIN courses ON courses.id = stages.course_id
            JOIN profiles ON profiles.id = auth.uid()
            WHERE stages.id = modules.stage_id
            AND courses.published = true
            AND (
                (profiles.cohort = 'Level 2' AND courses.level = 'level_2') OR
                (profiles.cohort = 'Level 3A' AND courses.level = 'level_3a') OR
                (profiles.cohort = 'Level 3B' AND courses.level = 'level_3b')
            )
            AND (
                courses.subject IS NULL OR
                profiles.department = courses.subject
            )
        )
    );
