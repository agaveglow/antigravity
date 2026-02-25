-- SUPER RESCUE: UNBLOCK ALL DELETIONS AND FIX LOGIN
-- This script dynamically finds EVERY foreign key that might be blocking deletions and fixes it.

DO $$
DECLARE
    v_instance_id uuid;
    v_rec record;
BEGIN
    -- 1. IDENTIFY THE PROJECT'S INSTANCE ID
    SELECT instance_id INTO v_instance_id FROM auth.users WHERE instance_id IS NOT NULL LIMIT 1;
    IF v_instance_id IS NULL THEN
        -- Fallback if no users exist with an instance_id
        v_instance_id := '00000000-0000-0000-0000-000000000000';
    END IF;

    -- 2. DYNAMICALLY FIX EVERY FOREIGN KEY BLOCKING DELETIONS
    FOR v_rec IN (
        SELECT 
            tc.table_schema, 
            tc.table_name, 
            tc.constraint_name, 
            kcu.column_name, 
            ccu.table_name AS foreign_table_name,
            ccu.column_name AS foreign_column_name 
        FROM 
            information_schema.table_constraints AS tc 
            JOIN information_schema.key_column_usage AS kcu
              ON tc.constraint_name = kcu.constraint_name
              AND tc.table_schema = kcu.table_schema
            JOIN information_schema.constraint_column_usage AS ccu
              ON ccu.constraint_name = tc.constraint_name
              AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY' 
          AND ccu.table_name IN ('users', 'profiles') -- Points to auth.users or public.profiles
          AND tc.table_schema = 'public'
    ) LOOP
        -- Drop the existing constraint
        EXECUTE format('ALTER TABLE %I.%I DROP CONSTRAINT IF EXISTS %I', v_rec.table_schema, v_rec.table_name, v_rec.constraint_name);
        
        -- Re-add with ON DELETE CASCADE
        EXECUTE format('ALTER TABLE %I.%I ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES %s(%I) ON DELETE CASCADE', 
            v_rec.table_schema, v_rec.table_name, v_rec.constraint_name, v_rec.column_name, 
            CASE WHEN v_rec.foreign_table_name = 'users' THEN 'auth.users' ELSE 'public.profiles' END,
            v_rec.foreign_column_name);
            
        RAISE NOTICE 'Fixed constraint % on table % (pointing to %)', v_rec.constraint_name, v_rec.table_name, v_rec.foreign_table_name;
    END LOOP;

    -- 3. REPAIR ALL AUTH USERS (LOGIN FIX)
    UPDATE auth.users
    SET 
        instance_id = v_instance_id,
        aud = 'authenticated',
        role = 'authenticated',
        email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
        email = CASE 
            WHEN email NOT LIKE '%@%' THEN email || '@erc-learn.local'
            WHEN email LIKE '%@erc-learn.local' THEN email
            ELSE email
        END
    WHERE id IN (SELECT id FROM public.profiles WHERE role = 'student');

    -- Restore any missing display names
    UPDATE auth.users u
    SET raw_user_meta_data = jsonb_build_object('full_name', p.name)
    FROM public.profiles p
    WHERE u.id = p.id 
    AND (u.raw_user_meta_data IS NULL OR u.raw_user_meta_data = '{}'::jsonb);

    RAISE NOTICE 'Super Rescue Complete. Instance ID: %', v_instance_id;
END $$;
