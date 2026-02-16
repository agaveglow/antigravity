-- FIX: ADD MISSING CONTACT COLUMNS (Phone, DOB, Address)

-- 1. Add columns if they don't exist
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS dob text,
ADD COLUMN IF NOT EXISTS address text;

-- 2. No backfill needed for these as they are usually empty for new users.

-- 3. Verify columns exist (Diagnostic)
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name IN ('phone', 'dob', 'address');
