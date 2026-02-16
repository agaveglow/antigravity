-- Enable pgcrypto for password hashing
create extension if not exists pgcrypto;

-- Function to allow teachers/admins to reset user passwords
create or replace function admin_reset_password(target_user_id uuid, new_password text)
returns void
language plpgsql
security definer -- Runs with privileges of the creator (postgres)
as $$
declare
  caller_role text;
begin
  -- 1. Check if the caller is authorized (teacher or admin)
  select role into caller_role
  from public.profiles
  where id = auth.uid();

  if caller_role not in ('teacher', 'admin') then
    raise exception 'Unauthorized: Only teachers and admins can reset passwords.';
  end if;

  -- 2. Update the user's password in auth.users
  -- We use crypt() to hash the password securely compatible with Supabase Auth
  update auth.users
  set encrypted_password = crypt(new_password, gen_salt('bf'))
  where id = target_user_id;

  -- 3. Invalidate existing sessions (Optional but recommended)
  -- update auth.sessions set not_after = now() where user_id = target_user_id;
  
end;
$$;
