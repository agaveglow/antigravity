-- Add missing columns to submissions table if they don't exist
DO $$
BEGIN
    -- student_cohort
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'submissions' AND column_name = 'student_cohort') THEN
        ALTER TABLE submissions ADD COLUMN student_cohort TEXT;
    END IF;

    -- student_name
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'submissions' AND column_name = 'student_name') THEN
        ALTER TABLE submissions ADD COLUMN student_name TEXT;
    END IF;

    -- task_title
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'submissions' AND column_name = 'task_title') THEN
        ALTER TABLE submissions ADD COLUMN task_title TEXT;
    END IF;

    -- verification_requested
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'submissions' AND column_name = 'verification_requested') THEN
        ALTER TABLE submissions ADD COLUMN verification_requested BOOLEAN DEFAULT FALSE;
    END IF;

    -- verification_requested_at
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'submissions' AND column_name = 'verification_requested_at') THEN
        ALTER TABLE submissions ADD COLUMN verification_requested_at TIMESTAMP WITH TIME ZONE;
    END IF;

    -- Refresh schema cache (usually happens automatically but good to be safe by doing a dummy update if needed, though mostly just running this structure change is enough)
END $$;
