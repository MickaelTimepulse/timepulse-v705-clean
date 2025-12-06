/*
  # Allow admin to update their own user_id

  1. Changes
    - Add policy to allow updating user_id during login
    - This is needed for linking admin_users to Supabase Auth

  2. Security
    - Function is SECURITY DEFINER to bypass RLS during login
*/

-- Create function to update admin user_id (bypass RLS)
CREATE OR REPLACE FUNCTION update_admin_user_id(
  p_admin_id uuid,
  p_auth_user_id uuid
)
RETURNS void AS $$
BEGIN
  UPDATE admin_users
  SET user_id = p_auth_user_id
  WHERE id = p_admin_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION update_admin_user_id TO authenticated;
GRANT EXECUTE ON FUNCTION update_admin_user_id TO anon;
