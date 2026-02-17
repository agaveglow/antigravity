-- Add color column to courses table if it doesn't exist
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS color text DEFAULT '#6366f1';

-- Verify other potential missing columns from Course interface
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS image_url text;
