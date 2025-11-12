/*
  # Add password update function

  1. Functions
    - `update_admin_password` - Allows users to update their password
*/

-- Function to update password
CREATE OR REPLACE FUNCTION update_admin_password(
  p_user_id uuid,
  p_new_password text
)
RETURNS void AS $$
BEGIN
  UPDATE admin_users
  SET 
    hashed_password = crypt(p_new_password, gen_salt('bf')),
    updated_at = now()
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;