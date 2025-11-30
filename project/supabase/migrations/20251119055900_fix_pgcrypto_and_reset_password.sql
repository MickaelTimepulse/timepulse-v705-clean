/*
  # Fix pgcrypto extension and reset admin password

  1. Changes
    - Ensure pgcrypto extension is available
    - Reset super admin password to 'Admin2025!'
    
  2. Security
    - Only affects admin authentication
*/

-- Ensure pgcrypto is enabled in extensions schema
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- Update the function to use the correct schema path
CREATE OR REPLACE FUNCTION update_admin_password(p_user_id uuid, p_new_password text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  UPDATE admin_users
  SET 
    hashed_password = crypt(p_new_password, gen_salt('bf')),
    updated_at = now()
  WHERE id = p_user_id;
END;
$$;

-- Reset super admin password to 'Admin2025!'
SELECT update_admin_password(
  '387a243b-be3b-4d59-bd3c-31d95a6f89fb'::uuid,
  'Admin2025!'
);
