-- DIAGNOSE: INSPECT MY USER AND STUDENTS
-- Run this to see exactly what the database sees.

-- 1. Get MY User Details (The one running the query)
SELECT 
    'Current User' as type,
    id, 
    email, 
    role, 
    raw_user_meta_data 
FROM auth.users 
WHERE id = auth.uid();

-- 2. Get MY Profile Details
SELECT 
    'Current Profile' as type,
    id, 
    name, 
    role, 
    department 
FROM profiles 
WHERE id = auth.uid();

-- 3. Get ALL Students (ignoring RLS if run by admin/postgres, but subject to RLS if run by user)
SELECT 
    'Student' as type,
    id, 
    name, 
    email, 
    role, 
    department, 
    status
FROM profiles 
WHERE role = 'student'
LIMIT 20;

-- 4. Count Totals
SELECT count(*) as total_students FROM profiles WHERE role = 'student';
