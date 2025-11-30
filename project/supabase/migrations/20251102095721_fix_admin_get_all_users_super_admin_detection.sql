/*
  # Fix admin_get_all_users to detect super_admin correctly

  ## Changes
  - Update admin_get_all_users function to check both admin_roles.is_super_admin and admin_users.role = 'super_admin'
  - Ensures users with role='super_admin' are correctly flagged as is_super_admin=true even without a role_id

  ## Security
  - Maintains SECURITY DEFINER for admin access
  - No changes to permissions or RLS
*/

CREATE OR REPLACE FUNCTION admin_get_all_users()
RETURNS jsonb SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_agg(user_data ORDER BY user_data->>'created_at' DESC)
  INTO result
  FROM (
    SELECT jsonb_build_object(
      'id', au.id,
      'email', au.email,
      'name', au.name,
      'role', au.role,
      'role_id', au.role_id,
      'role_name', ar.name,
      'role_description', ar.description,
      'is_super_admin', COALESCE(ar.is_super_admin, au.role = 'super_admin'),
      'created_at', au.created_at,
      'last_login', (
        SELECT MAX(logged_in_at) 
        FROM admin_login_sessions 
        WHERE user_id = au.id
      ),
      'total_sessions', (
        SELECT COUNT(*) 
        FROM admin_login_sessions 
        WHERE user_id = au.id
      )
    ) as user_data
    FROM admin_users au
    LEFT JOIN admin_roles ar ON ar.id = au.role_id
  ) users_subquery;

  RETURN COALESCE(result, '[]'::jsonb);
END;
$$ LANGUAGE plpgsql;
