-- Enable RLS on profiles if not already enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 1. Allow Teachers and Admins to UPDATE any student profile
-- This is crucial for awarding XP/Balance and managing student details.
CREATE POLICY "Teachers and Admins can update any profile" ON profiles
    FOR UPDATE
    TO authenticated
    USING (
        auth.uid() IN (SELECT id FROM profiles WHERE role IN ('teacher', 'admin'))
    )
    WITH CHECK (
        auth.uid() IN (SELECT id FROM profiles WHERE role IN ('teacher', 'admin'))
    );

-- 2. Allow Teachers and Admins to SELECT any profile (already likely true, but ensuring it)
CREATE POLICY "Teachers and Admins can view all profiles" ON profiles
    FOR SELECT
    TO authenticated
    USING (
        auth.uid() IN (SELECT id FROM profiles WHERE role IN ('teacher', 'admin'))
        OR auth.uid() = id -- Users can view their own profile
    );

-- 3. Ensure students can only update their own profile (if needed, usually handled by separate policy)
-- Existing policies might cover this, but this is a safe addition/overlay.
