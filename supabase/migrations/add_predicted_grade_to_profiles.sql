-- Add predicted_grade column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS predicted_grade TEXT CHECK (predicted_grade IN ('Distinction', 'Merit', 'Pass', 'Fail', 'Referred'));

-- Update RLS policies to allow teachers to update this field if not already allowed
-- (Assuming existing policies allow updates to profiles based on role)
