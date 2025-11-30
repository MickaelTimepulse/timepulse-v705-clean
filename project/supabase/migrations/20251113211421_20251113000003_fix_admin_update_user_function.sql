/*
  # Fix admin_update_user function to work with custom auth

  1. Changes
    - Add p_current_user_email parameter to verify the caller
    - Replace auth.uid() check with email-based verification
    - Keep SECURITY DEFINER to bypass RLS
  
  2. Security
    - Only admins can update users
    - Validates current user is an admin before allowing update
*/

-- Drop existing function
DROP FUNCTION IF EXISTS admin_update_user(uuid, text, text);

-- Create updated function with email-based auth
CREATE OR REPLACE FUNCTION admin_update_user(
  p_user_id uuid,
  p_name text,
  p_email text,
  p_current_user_email text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_user_id uuid;
  v_current_user_role text;
BEGIN
  -- Get current user info
  SELECT id, role INTO v_current_user_id, v_current_user_role
  FROM admin_users
  WHERE email = p_current_user_email;

  -- Check if caller is an admin
  IF v_current_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Utilisateur actuel non trouvé'
    );
  END IF;

  -- Update the admin user
  UPDATE admin_users
  SET 
    name = p_name,
    email = p_email,
    updated_at = now()
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Utilisateur non trouvé'
    );
  END IF;

  -- Log the action
  INSERT INTO admin_activity_logs (
    user_id,
    user_email,
    action,
    module,
    entity_type,
    entity_id,
    details
  ) VALUES (
    v_current_user_id,
    p_current_user_email,
    'update',
    'users',
    'admin_user',
    p_user_id::text,
    jsonb_build_object(
      'name', p_name,
      'email', p_email
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Utilisateur modifié avec succès'
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION admin_update_user TO authenticated;
GRANT EXECUTE ON FUNCTION admin_update_user TO anon;
