/*
  # Create function to update admin user

  1. Functions
    - admin_update_user: Update admin user name and email with service role permissions
  
  2. Security
    - Only callable by authenticated admins
    - Uses SECURITY DEFINER to bypass RLS
*/

-- Drop existing policy that causes issues
DROP POLICY IF EXISTS "Admins can update admin users" ON admin_users;

-- Create function to update admin user
CREATE OR REPLACE FUNCTION admin_update_user(
  p_user_id uuid,
  p_name text,
  p_email text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_email text;
BEGIN
  -- Get caller's email from auth.users
  SELECT email INTO v_caller_email
  FROM auth.users
  WHERE id = auth.uid();

  -- Check if caller is an admin
  IF NOT EXISTS (
    SELECT 1 FROM admin_users
    WHERE email = v_caller_email
  ) THEN
    RAISE EXCEPTION 'Permission denied: caller is not an admin';
  END IF;

  -- Update the admin user
  UPDATE admin_users
  SET 
    name = p_name,
    email = p_email,
    updated_at = now()
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION admin_update_user TO authenticated;
