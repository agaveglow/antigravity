-- 1. Ensure order_index exists on all hierarchy tables
ALTER TABLE courses ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0;
ALTER TABLE stages ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0;
ALTER TABLE modules ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0;
ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0;
ALTER TABLE walkthroughs ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0;
ALTER TABLE curriculum_projects ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0;

-- 2. Fix Profiles RLS to ensure teachers can be verified
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
CREATE POLICY "Users can view their own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Teachers and Admins can view all profiles" ON profiles;
CREATE POLICY "Teachers and Admins can view all profiles" ON profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles as p
            WHERE p.id = auth.uid()
            AND p.role IN ('teacher', 'admin')
        )
    );

-- 3. Relax specific RLS for creation if strictly needed (debug step)
-- Ensure 'stages' and 'modules' policies use a safe lookup
DROP POLICY IF EXISTS "Teachers can manage all stages" ON stages;
CREATE POLICY "Teachers can manage all stages" ON stages
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('teacher', 'admin')
        )
    );

DROP POLICY IF EXISTS "Teachers can manage all modules" ON modules;
CREATE POLICY "Teachers can manage all modules" ON modules
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('teacher', 'admin')
        )
    );
