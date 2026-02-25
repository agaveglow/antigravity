-- SECURITY SHIELD: MANAGED DELETION RPC
-- This migration provides secure functions to delete users from auth.users
-- which then cascades to public.profiles and all related data.

-- 1. Function to delete a student (Callable by Teachers/Admins)
CREATE OR REPLACE FUNCTION delete_managed_user(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
BEGIN
    -- Permission Check: Caller must be a teacher or admin
    IF NOT EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role IN ('teacher', 'admin')
    ) THEN
        RAISE EXCEPTION 'Unauthorized: Only staff can delete students';
    END IF;

    -- Safety Check: Don't allow teachers to delete other staff via this function
    -- (Though auth.users delete will happen eventually, we keep it explicit)
    IF EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = p_user_id 
        AND role IN ('teacher', 'admin')
        AND (SELECT role FROM profiles WHERE id = auth.uid()) = 'teacher'
    ) THEN
        RAISE EXCEPTION 'Unauthorized: Teachers cannot delete other staff members';
    END IF;

    -- Perform the deletion from the source of truth (Auth)
    -- This will cascade to profiles due to our previously fixed FK constraints.
    DELETE FROM auth.users WHERE id = p_user_id;
END;
$$;

-- 2. Function to delete staff (Callable ONLY by Admins)
CREATE OR REPLACE FUNCTION delete_staff_auth(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
BEGIN
    -- Permission Check: Caller must be an admin
    IF NOT EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Unauthorized: Only admins can delete staff';
    END IF;

    -- Prevent self-deletion
    IF p_user_id = auth.uid() THEN
        RAISE EXCEPTION 'Self-deletion is not permitted via this function';
    END IF;

    -- Perform deletion
    DELETE FROM auth.users WHERE id = p_user_id;
END;
$$;

RAISE NOTICE 'Managed Deletion RPCs deployed.';
