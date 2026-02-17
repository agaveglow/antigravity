-- Create walkthroughs table
CREATE TABLE IF NOT EXISTS walkthroughs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    module_id UUID REFERENCES modules(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    steps JSONB DEFAULT '[]'::jsonb,
    "order" INTEGER DEFAULT 0,
    type TEXT DEFAULT 'walkthrough',
    xp_reward INTEGER DEFAULT 0,
    dowdbucks_reward INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_walkthroughs_course ON walkthroughs(course_id);
CREATE INDEX IF NOT EXISTS idx_walkthroughs_module ON walkthroughs(module_id);

-- Add comment for documentation
COMMENT ON TABLE walkthroughs IS 'Interactive step-by-step walkthroughs for courses';

-- Note: RLS policies will be added in a separate migration once user table structure is confirmed

