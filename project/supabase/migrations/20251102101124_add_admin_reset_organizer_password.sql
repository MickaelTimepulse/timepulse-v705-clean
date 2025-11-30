/*
  # Add Admin Reset Organizer Password Function

  1. Changes
    - Create function for super admins to reset organizer passwords
    - Returns temporary password that admin can share with organizer

  2. Security
    - Function is SECURITY DEFINER to access auth.users
    - Only callable by super admins (checked in application)
*/

-- Function to reset organizer password (admin only)
CREATE OR REPLACE FUNCTION admin_reset_organizer_password(
  p_organizer_id uuid,
  p_new_password text
)
RETURNS json AS $$
DECLARE
  v_user_id uuid;
  v_email text;
BEGIN
  -- Get user_id from organizer
  SELECT user_id, email INTO v_user_id, v_email
  FROM organizers
  WHERE id = p_organizer_id;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Organisateur non trouvé';
  END IF;

  -- Update password in auth.users
  UPDATE auth.users
  SET 
    encrypted_password = crypt(p_new_password, gen_salt('bf')),
    updated_at = now()
  WHERE id = v_user_id;

  RETURN json_build_object(
    'success', true,
    'email', v_email,
    'temporary_password', p_new_password
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;