-- Add level and subject columns to courses table
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS level text;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS subject text;
