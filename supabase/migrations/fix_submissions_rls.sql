-- Ensure submissions table exists
CREATE TABLE IF NOT EXISTS submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL,
    project_id UUID NOT NULL,
    student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    student_name TEXT,
    student_cohort TEXT,
    status TEXT NOT NULL DEFAULT 'Pending Mark',
    evidence JSONB DEFAULT '[]'::jsonb,
    task_title TEXT,
    feedback TEXT,
    grade TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    verified_by UUID REFERENCES auth.users(id),
    verified_at TIMESTAMP WITH TIME ZONE,
    verification_requested BOOLEAN DEFAULT FALSE,
    verification_requested_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view own submissions" ON submissions;
DROP POLICY IF EXISTS "Teachers can view all submissions" ON submissions;
DROP POLICY IF EXISTS "Users can create own submissions" ON submissions;
DROP POLICY IF EXISTS "Teachers can create any submission" ON submissions;
DROP POLICY IF EXISTS "Teachers can delete any submission" ON submissions;
DROP POLICY IF EXISTS "Users can update own submissions" ON submissions;
DROP POLICY IF EXISTS "Teachers can update all submissions" ON submissions;
DROP POLICY IF EXISTS "Users can delete own submissions" ON submissions;

-- 1. SELECT
CREATE POLICY "Users can view own submissions" ON submissions
    FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Teachers can view all submissions" ON submissions
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('teacher', 'admin'))
    );

-- 2. INSERT
CREATE POLICY "Users can create own submissions" ON submissions
    FOR INSERT WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Teachers can create any submission" ON submissions
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('teacher', 'admin'))
    );

-- 3. UPDATE
CREATE POLICY "Users can update own submissions" ON submissions
    FOR UPDATE USING (auth.uid() = student_id);

CREATE POLICY "Teachers can update all submissions" ON submissions
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('teacher', 'admin'))
    );

-- 4. DELETE
CREATE POLICY "Users can delete own submissions" ON submissions
    FOR DELETE USING (auth.uid() = student_id);

CREATE POLICY "Teachers can delete any submission" ON submissions
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('teacher', 'admin'))
    );
