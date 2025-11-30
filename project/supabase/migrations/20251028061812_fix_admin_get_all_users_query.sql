/*
  # Fix admin_get_all_users Query

  1. Changes
    - Fix SQL query to avoid GROUP BY issues
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
      'is_super_admin', COALESCE(ar.is_super_admin, false),
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
    LEFT JOIN admin_roles ar ON au.role_id = ar.id
  ) subquery;

  RETURN COALESCE(result, '[]'::jsonb);
END;
$$ LANGUAGE plpgsql;
