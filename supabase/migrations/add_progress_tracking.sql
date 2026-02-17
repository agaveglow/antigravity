-- Add reward fields to course hierarchy tables
ALTER TABLE stages ADD COLUMN IF NOT EXISTS xp_reward INTEGER DEFAULT 0;
ALTER TABLE stages ADD COLUMN IF NOT EXISTS dowdbucks_reward INTEGER DEFAULT 0;

ALTER TABLE modules ADD COLUMN IF NOT EXISTS xp_reward INTEGER DEFAULT 0;
ALTER TABLE modules ADD COLUMN IF NOT EXISTS dowdbucks_reward INTEGER DEFAULT 0;

-- Note: walkthroughs table includes reward fields in its creation (see create_walkthroughs.sql)

-- Create student progress tracking table
CREATE TABLE IF NOT EXISTS student_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL,
    content_type TEXT NOT NULL CHECK (content_type IN ('lesson', 'quiz', 'walkthrough', 'module', 'stage', 'course')),
    content_id UUID NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP,
    xp_awarded INTEGER DEFAULT 0,
    dowdbucks_awarded INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(student_id, content_type, content_id)
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_student_progress_student ON student_progress(student_id);
CREATE INDEX IF NOT EXISTS idx_student_progress_content ON student_progress(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_student_progress_completed ON student_progress(student_id, completed);

-- Add comment for documentation
COMMENT ON TABLE student_progress IS 'Tracks student completion status and rewards for all course content';
COMMENT ON COLUMN student_progress.content_type IS 'Type of content: lesson, quiz, walkthrough, module, stage, or course';
COMMENT ON COLUMN student_progress.xp_awarded IS 'XP awarded when this content was completed';
COMMENT ON COLUMN student_progress.dowdbucks_awarded IS 'DowdBucks awarded when this content was completed';
