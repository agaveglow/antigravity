-- Add created_at column to courses table if it doesn't exist
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

-- Verify other potential missing columns
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
