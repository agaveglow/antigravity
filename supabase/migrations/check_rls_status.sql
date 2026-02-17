-- Check RLS status for all tables
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- List ALL policies to see what is still active
SELECT schemaname, tablename, policyname, cmd, roles, qual 
FROM pg_policies 
WHERE schemaname = 'public';

-- Check for any functions that might be involved
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname IN ('is_privileged_user', 'get_user_role');
