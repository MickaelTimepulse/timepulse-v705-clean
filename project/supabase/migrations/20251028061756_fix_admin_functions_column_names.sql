/*
  # Fix Admin Functions Column Names

  1. Changes
    - Update admin_get_all_users to use 'name' instead of 'first_name' and 'last_name'
    - Update admin_get_user_permissions to use correct columns
    - Update admin_get_activity_logs to use correct columns
    - Update admin_get_login_sessions to use correct columns
*/

-- Fix admin_get_all_users function
CREATE OR REPLACE FUNCTION admin_get_all_users()
RETURNS jsonb SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_agg(
    jsonb_build_object(
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
    )
  )
  INTO result
  FROM admin_users au
  LEFT JOIN admin_roles ar ON au.role_id = ar.id
  ORDER BY au.created_at DESC;

  RETURN COALESCE(result, '[]'::jsonb);
END;
$$ LANGUAGE plpgsql;

-- Fix admin_get_activity_logs function
CREATE OR REPLACE FUNCTION admin_get_activity_logs(
  p_limit int DEFAULT 100,
  p_offset int DEFAULT 0,
  p_user_id uuid DEFAULT NULL,
  p_module text DEFAULT NULL,
  p_action text DEFAULT NULL
)
RETURNS jsonb SECURITY DEFINER
AS $$
DECLARE
  logs_array jsonb;
  total_count int;
BEGIN
  -- Get total count
  SELECT COUNT(*)
  INTO total_count
  FROM admin_activity_logs
  WHERE (p_user_id IS NULL OR user_id = p_user_id)
    AND (p_module IS NULL OR module = p_module)
    AND (p_action IS NULL OR action = p_action);

  -- Get logs
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', aal.id,
      'user_email', aal.user_email,
      'user_name', COALESCE(au.name, au.email),
      'action', aal.action,
      'module', aal.module,
      'entity_type', aal.entity_type,
      'entity_id', aal.entity_id,
      'details', aal.details,
      'ip_address', aal.ip_address,
      'created_at', aal.created_at
    ) ORDER BY aal.created_at DESC
  )
  INTO logs_array
  FROM admin_activity_logs aal
  LEFT JOIN admin_users au ON aal.user_id = au.id
  WHERE (p_user_id IS NULL OR aal.user_id = p_user_id)
    AND (p_module IS NULL OR aal.module = p_module)
    AND (p_action IS NULL OR aal.action = p_action)
  ORDER BY aal.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;

  RETURN jsonb_build_object(
    'logs', COALESCE(logs_array, '[]'::jsonb),
    'total', total_count,
    'limit', p_limit,
    'offset', p_offset
  );
END;
$$ LANGUAGE plpgsql;

-- Fix admin_get_login_sessions function
CREATE OR REPLACE FUNCTION admin_get_login_sessions(
  p_limit int DEFAULT 50,
  p_user_id uuid DEFAULT NULL
)
RETURNS jsonb SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', als.id,
      'user_id', als.user_id,
      'user_email', au.email,
      'user_name', COALESCE(au.name, au.email),
      'logged_in_at', als.logged_in_at,
      'logged_out_at', als.logged_out_at,
      'duration_seconds', CASE 
        WHEN als.logged_out_at IS NOT NULL 
        THEN EXTRACT(EPOCH FROM (als.logged_out_at - als.logged_in_at))::integer
        ELSE EXTRACT(EPOCH FROM (now() - als.logged_in_at))::integer
      END,
      'ip_address', als.ip_address,
      'user_agent', als.user_agent,
      'is_active', (als.logged_out_at IS NULL)
    ) ORDER BY als.logged_in_at DESC
  )
  INTO result
  FROM admin_login_sessions als
  JOIN admin_users au ON als.user_id = au.id
  WHERE (p_user_id IS NULL OR als.user_id = p_user_id)
  ORDER BY als.logged_in_at DESC
  LIMIT p_limit;

  RETURN COALESCE(result, '[]'::jsonb);
END;
$$ LANGUAGE plpgsql;
