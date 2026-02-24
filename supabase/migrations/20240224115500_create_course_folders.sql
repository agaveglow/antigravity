-- Create Course Folders table
CREATE TABLE IF NOT EXISTS public.course_folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  color text,
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Add folder_id to courses table
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS folder_id uuid REFERENCES public.course_folders(id) ON DELETE SET NULL;

-- Enable RLS
ALTER TABLE public.course_folders ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Folders are viewable by everyone" ON public.course_folders;
CREATE POLICY "Folders are viewable by everyone" ON public.course_folders 
FOR SELECT USING (true);

DROP POLICY IF EXISTS "Teachers and Admins can manage folders" ON public.course_folders;
CREATE POLICY "Teachers and Admins can manage folders" ON public.course_folders 
FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('teacher', 'admin'))
);
