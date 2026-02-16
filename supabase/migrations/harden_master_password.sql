-- Enable pgcrypto if not already enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Create a secure function to SET the master password (hashed)
-- This replaces the direct client-side UPDATE
CREATE OR REPLACE FUNCTION set_master_password(new_password text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
    -- Only Admins can set the master password
    -- (We double-check here even though RLS also protects the table)
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin') THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;

    -- Update with hash
    UPDATE system_settings
    SET value = crypt(new_password, gen_salt('bf'))
    WHERE key = 'master_password';

    -- Insert if not exists (upsert logic for safety)
    IF NOT FOUND THEN
        INSERT INTO system_settings (key, value)
        VALUES ('master_password', crypt(new_password, gen_salt('bf')));
    END IF;

    RETURN true;
END;
$$;

-- 2. Update the verification function to check HASHES
CREATE OR REPLACE FUNCTION verify_master_password(attempt text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
    stored_hash text;
BEGIN
    SELECT value INTO stored_hash
    FROM system_settings
    WHERE key = 'master_password';

    IF stored_hash IS NULL THEN
        RETURN FALSE;
    END IF;

    -- Check if the stored value is already a hash (starts with $2)
    -- If it isn't (legacy plain text), we do a plain text comparison TEMPORARILY
    -- or fail safe. Ideally, we migrate data first (step 3).
    -- But strict crypt() check is safer:
    RETURN (stored_hash = crypt(attempt, stored_hash));
END;
$$;

-- 3. One-time Migration: Hash the existing plain-text password
-- Only run if the current value doesn't look like a bcrypt hash (starting with $2)
DO $$
DECLARE
    current_val text;
BEGIN
    SELECT value INTO current_val FROM system_settings WHERE key = 'master_password';
    
    -- If it exists and is NOT a hash (doesn't start with $2)
    IF current_val IS NOT NULL AND current_val NOT LIKE '$2%' THEN
        UPDATE system_settings
        SET value = crypt(current_val, gen_salt('bf'))
        WHERE key = 'master_password';
        
        RAISE NOTICE 'Migrated plain-text master password to hash.';
    END IF;
END $$;
