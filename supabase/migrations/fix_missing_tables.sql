-- 1. Create Notifications Table (if not exists)
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('info', 'warning', 'success', 'deadline', 'verification')),
    link TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Notifications Policies
CREATE POLICY "Users can view own notifications" ON notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications (mark read)" ON notifications
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can create notifications" ON notifications
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 2. Ensure submissions table exists (re-applying fix)
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

-- Enable RLS for submissions
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view own submissions" ON submissions;
DROP POLICY IF EXISTS "Teachers can view all submissions" ON submissions;
DROP POLICY IF EXISTS "Users can create own submissions" ON submissions;
DROP POLICY IF EXISTS "Users can update own submissions" ON submissions;
DROP POLICY IF EXISTS "Teachers can update all submissions" ON submissions;
DROP POLICY IF EXISTS "Users can delete own submissions" ON submissions;
DROP POLICY IF EXISTS "Teachers can delete any submission" ON submissions;

-- Submissions Policies
CREATE POLICY "Users can view own submissions" ON submissions
    FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Teachers can view all submissions" ON submissions
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('teacher', 'admin'))
    );

CREATE POLICY "Users can create own submissions" ON submissions
    FOR INSERT WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Users can update own submissions" ON submissions
    FOR UPDATE USING (auth.uid() = student_id);

CREATE POLICY "Teachers can update all submissions" ON submissions
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('teacher', 'admin'))
    );

CREATE POLICY "Users can delete own submissions" ON submissions
    FOR DELETE USING (auth.uid() = student_id);

CREATE POLICY "Teachers can delete any submission" ON submissions
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('teacher', 'admin'))
    );
