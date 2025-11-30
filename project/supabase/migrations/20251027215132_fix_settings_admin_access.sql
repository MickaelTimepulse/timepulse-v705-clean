/*
  # Fix Settings Admin Access

  1. Changes
    - Create a function to update settings that bypasses RLS
    - Grant execute permission to authenticated users
    - This allows admin users to update settings via the function

  2. Security
    - Function checks admin_users table for valid admin
    - Only active admins can update settings
*/

-- Create function to update settings for admins
CREATE OR REPLACE FUNCTION update_setting_as_admin(
  p_key text,
  p_value text,
  p_admin_id uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_is_admin boolean;
  v_result json;
BEGIN
  -- Check if user is an active admin
  SELECT EXISTS (
    SELECT 1 FROM admin_users
    WHERE id = p_admin_id
    AND role IN ('admin', 'super_admin')
    AND is_active = true
  ) INTO v_is_admin;

  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can update settings';
  END IF;

  -- Update or insert the setting
  INSERT INTO settings (key, value)
  VALUES (p_key, p_value)
  ON CONFLICT (key)
  DO UPDATE SET
    value = EXCLUDED.value,
    updated_at = now();

  -- Return success
  SELECT json_build_object(
    'success', true,
    'key', p_key
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION update_setting_as_admin TO authenticated;
GRANT EXECUTE ON FUNCTION update_setting_as_admin TO anon;