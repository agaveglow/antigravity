-- Migration: Fix Notifications & Sync
-- Run this in the Supabase SQL Editor to ensure notifications work correctly.

-- 1. Notifications Table Structure
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL, -- info, success, warning, deadline, verification, task_verified, etc.
    link TEXT,
    entity_id TEXT,
    entity_type TEXT,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Enable Real-Time for Notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- 3. Row Level Security Policies
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Allow users to see only their own notifications
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "Users can view their own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

-- Allow any authenticated user to insert notifications for others (needed for staff-student sync)
DROP POLICY IF EXISTS "Authenticated users can insert notifications" ON public.notifications;
CREATE POLICY "Authenticated users can insert notifications" ON public.notifications
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow users to update their own notifications (e.g. mark as read)
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
CREATE POLICY "Users can update their own notifications" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- Allow users to delete their own notifications
DROP POLICY IF EXISTS "Users can delete their own notifications" ON public.notifications;
CREATE POLICY "Users can delete their own notifications" ON public.notifications
    FOR DELETE USING (auth.uid() = user_id);

-- 4. Fix profile visibility for teacher discovery
-- Ensure students can read teacher profile names and IDs for notification routing
DROP POLICY IF EXISTS "Allow public read-access for teacher/admin profiles" ON public.profiles;
CREATE POLICY "Allow public read-access for teacher/admin profiles" ON public.profiles
    FOR SELECT USING (role IN ('teacher', 'admin') OR auth.uid() = id);

-- Notifications and Profile RLS fixed.
