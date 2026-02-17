-- Create badges table
CREATE TABLE IF NOT EXISTS badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    icon TEXT,  -- emoji or icon name
    image_url TEXT,  -- optional custom image
    color TEXT DEFAULT '#6366f1',  -- hex color for badge background
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create badge_attachments table
-- Links badges to entities (achievements, tasks, projects, modules, stages)
CREATE TABLE IF NOT EXISTS badge_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    badge_id UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
    entity_type TEXT NOT NULL CHECK (entity_type IN ('achievement', 'task', 'project', 'module', 'stage')),
    entity_id UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(badge_id, entity_type, entity_id)
);

-- Create student_badges table
-- Tracks which students have earned which badges
CREATE TABLE IF NOT EXISTS student_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    badge_id UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
    earned_at TIMESTAMPTZ DEFAULT NOW(),
    awarded_by UUID REFERENCES profiles(id),  -- NULL if auto-awarded
    UNIQUE(student_id, badge_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_badges_created_by ON badges(created_by);
CREATE INDEX IF NOT EXISTS idx_badge_attachments_badge_id ON badge_attachments(badge_id);
CREATE INDEX IF NOT EXISTS idx_badge_attachments_entity ON badge_attachments(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_student_badges_student_id ON student_badges(student_id);
CREATE INDEX IF NOT EXISTS idx_student_badges_badge_id ON student_badges(badge_id);

-- Enable RLS
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE badge_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_badges ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Teachers can manage badges" ON badges;
DROP POLICY IF EXISTS "Students can view badges" ON badges;
DROP POLICY IF EXISTS "Teachers can manage attachments" ON badge_attachments;
DROP POLICY IF EXISTS "Students can view attachments" ON badge_attachments;
DROP POLICY IF EXISTS "Students can view own badges" ON student_badges;
DROP POLICY IF EXISTS "Teachers can manage student badges" ON student_badges;

-- RLS Policies for badges
CREATE POLICY "Teachers can manage badges"
    ON badges
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('teacher', 'admin')
        )
    );

CREATE POLICY "Students can view badges"
    ON badges
    FOR SELECT
    TO authenticated
    USING (true);

-- RLS Policies for badge_attachments
CREATE POLICY "Teachers can manage attachments"
    ON badge_attachments
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('teacher', 'admin')
        )
    );

CREATE POLICY "Students can view attachments"
    ON badge_attachments
    FOR SELECT
    TO authenticated
    USING (true);

-- RLS Policies for student_badges
CREATE POLICY "Students can view own badges"
    ON student_badges
    FOR SELECT
    TO authenticated
    USING (student_id = auth.uid());

CREATE POLICY "Teachers can manage student badges"
    ON student_badges
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('teacher', 'admin')
        )
    );
