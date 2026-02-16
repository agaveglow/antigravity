-- FIX: ADD MISSING STATUS COLUMN

-- 1. Add the column if it doesn't exist
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS status text DEFAULT 'Active';

-- 2. Backfill existing NULLs
UPDATE profiles 
SET status = 'Active' 
WHERE status IS NULL;

-- 3. Verify it exists (optional check)
SELECT id, status FROM profiles LIMIT 1;
