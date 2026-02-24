-- REPAIR MISSING PROFILES
-- This script finds all users in auth.users who are missing a record in public.profiles
-- and creates a default profile for them so they can log in.

INSERT INTO public.profiles (
    id, 
    username, 
    name, 
    role, 
    department, 
    xp, 
    balance, 
    status, 
    email,
    is_first_login,
    cohort
)
SELECT 
    u.id,
    COALESCE(u.email, 'user_' || substr(u.id::text, 1, 8)),
    COALESCE(u.raw_user_meta_data->>'full_name', u.email, 'New User'),
    'student', -- Default to student role, can be changed in dashboard later
    'music',   -- Default department
    0, 
    0, 
    'Active',
    u.email,
    true,
    'Level 3A' -- Default cohort
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Log the number of repairs
DO $$
DECLARE
    repair_count int;
BEGIN
    SELECT count(*) INTO repair_count FROM auth.users u LEFT JOIN public.profiles p ON u.id = p.id WHERE p.id IS NULL;
    RAISE NOTICE 'Found % users still missing profiles.', repair_count;
END $$;
