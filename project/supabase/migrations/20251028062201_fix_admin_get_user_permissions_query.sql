/*
  # Fix admin_get_user_permissions Query

  1. Changes
    - Fix SQL query structure to avoid GROUP BY issues
*/

CREATE OR REPLACE FUNCTION admin_get_user_permissions(p_user_id uuid)
RETURNS jsonb SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
  permissions_data jsonb;
BEGIN
  -- Get permissions first
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', ap.id,
      'module', ap.module,
      'permission', ap.permission,
      'label', ap.label,
      'description', ap.description,
      'granted', COALESCE(aup.granted, false),
      'custom', (aup.id IS NOT NULL)
    ) ORDER BY ap.module, ap.permission
  )
  INTO permissions_data
  FROM admin_permissions ap
  LEFT JOIN admin_user_permissions aup 
    ON ap.id = aup.permission_id 
    AND aup.user_id = p_user_id;

  -- Build result with user data
  SELECT jsonb_build_object(
    'user', jsonb_build_object(
      'id', au.id,
      'email', au.email,
      'role_name', ar.name,
      'is_super_admin', COALESCE(ar.is_super_admin, false)
    ),
    'permissions', COALESCE(permissions_data, '[]'::jsonb)
  )
  INTO result
  FROM admin_users au
  LEFT JOIN admin_roles ar ON au.role_id = ar.id
  WHERE au.id = p_user_id;

  RETURN COALESCE(result, '{}'::jsonb);
END;
$$ LANGUAGE plpgsql;
