-- Verify profiles table accessibility
SELECT count(*) FROM profiles;
SELECT id, email, role FROM profiles LIMIT 5;
