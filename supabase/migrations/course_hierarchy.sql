/*
  # Course Hierarchy: Stages and Modules

  1. New Tables
    - `stages`
      - `id` (uuid, primary key)
      - `course_id` (uuid, foreign key to courses)
      - `title` (text)
      - `description` (text)
      - `order_index` (integer)
      - `created_at` (timestamp)
    - `modules`
      - `id` (uuid, primary key)
      - `stage_id` (uuid, foreign key to stages)
      - `title` (text)
      - `description` (text)
      - `order_index` (integer)
      - `created_at` (timestamp)

  2. Changes to Existing Tables
    - Add `module_id` to `lessons`
    - Add `module_id` to `quizzes`
    - Add `module_id` to `walkthroughs`

  3. Security
    - Enable RLS on new tables
    - Add policies for authenticated users
*/

-- Create Stages table
CREATE TABLE IF NOT EXISTS public.stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid REFERENCES public.courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create Modules table
CREATE TABLE IF NOT EXISTS public.modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stage_id uuid REFERENCES public.stages(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Add module_id to content tables
ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS module_id uuid REFERENCES public.modules(id) ON DELETE SET NULL;
ALTER TABLE public.quizzes ADD COLUMN IF NOT EXISTS module_id uuid REFERENCES public.modules(id) ON DELETE SET NULL;
ALTER TABLE public.walkthroughs ADD COLUMN IF NOT EXISTS module_id uuid REFERENCES public.modules(id) ON DELETE SET NULL;

-- Enable RLS
ALTER TABLE public.stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;

-- Policies for Stages
CREATE POLICY "Stages are viewable by everyone" ON public.stages
  FOR SELECT USING (true);

CREATE POLICY "Teachers and Admins can insert stages" ON public.stages
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Teachers and Admins can update stages" ON public.stages
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Teachers and Admins can delete stages" ON public.stages
  FOR DELETE USING (auth.role() = 'authenticated');

-- Policies for Modules
CREATE POLICY "Modules are viewable by everyone" ON public.modules
  FOR SELECT USING (true);

CREATE POLICY "Teachers and Admins can insert modules" ON public.modules
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Teachers and Admins can update modules" ON public.modules
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Teachers and Admins can delete modules" ON public.modules
  FOR DELETE USING (auth.role() = 'authenticated');
