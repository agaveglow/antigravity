-- Enable RLS for notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to ensure clean slate
DROP POLICY IF EXISTS "Authenticated users can create notifications" ON notifications;
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;

-- 1. INSERT: Allow ANY authenticated user to insert a notification
-- This is crucial for students to notify teachers.
CREATE POLICY "Authenticated users can create notifications" ON notifications
    FOR INSERT 
    TO authenticated 
    WITH CHECK (true);

-- 2. SELECT: Users can only see their OWN notifications
CREATE POLICY "Users can view own notifications" ON notifications
    FOR SELECT 
    TO authenticated 
    USING (auth.uid() = user_id);

-- 3. UPDATE: Users can mark THEIR OWN notifications as read
CREATE POLICY "Users can update own notifications" ON notifications
    FOR UPDATE 
    TO authenticated 
    USING (auth.uid() = user_id);
