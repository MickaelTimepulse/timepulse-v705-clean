/*
  # Create Admin Management Functions

  1. Purpose
    - Admin users authenticate via custom admin_users table (not Supabase Auth)
    - Create SECURITY DEFINER functions to bypass RLS for admin operations

  2. Functions Created
    - admin_get_all_users: Get all admin users with their roles and permissions
    - admin_get_user_permissions: Get permissions for a specific user
    - admin_update_user_permissions: Update permissions for a user
    - admin_get_activity_logs: Get activity logs with filters
    - admin_get_login_sessions: Get login sessions with time tracking
    - admin_log_activity: Log an admin action

  3. Security
    - Functions are SECURITY DEFINER (bypass RLS)
    - Frontend auth layer ensures only admins can access
*/

-- Function to get all admin users with their roles
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
      'first_name', au.first_name,
      'last_name', au.last_name,
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

-- Function to get permissions for a specific user
CREATE OR REPLACE FUNCTION admin_get_user_permissions(p_user_id uuid)
RETURNS jsonb SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'user', jsonb_build_object(
      'id', au.id,
      'email', au.email,
      'role_name', ar.name,
      'is_super_admin', COALESCE(ar.is_super_admin, false)
    ),
    'permissions', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', ap.id,
          'module', ap.module,
          'permission', ap.permission,
          'label', ap.label,
          'description', ap.description,
          'granted', COALESCE(aup.granted, false),
          'custom', (aup.id IS NOT NULL)
        )
      )
      FROM admin_permissions ap
      LEFT JOIN admin_user_permissions aup 
        ON ap.id = aup.permission_id 
        AND aup.user_id = p_user_id
      ORDER BY ap.module, ap.permission
    )
  )
  INTO result
  FROM admin_users au
  LEFT JOIN admin_roles ar ON au.role_id = ar.id
  WHERE au.id = p_user_id;

  RETURN COALESCE(result, '{}'::jsonb);
END;
$$ LANGUAGE plpgsql;

-- Function to update user permissions
CREATE OR REPLACE FUNCTION admin_update_user_permissions(
  p_user_id uuid,
  p_permission_id uuid,
  p_granted boolean,
  p_granted_by_email text
)
RETURNS jsonb SECURITY DEFINER
AS $$
DECLARE
  v_granted_by_id uuid;
  result jsonb;
BEGIN
  -- Get the ID of the admin making the change
  SELECT id INTO v_granted_by_id
  FROM admin_users
  WHERE email = p_granted_by_email;

  -- Insert or update permission
  INSERT INTO admin_user_permissions (user_id, permission_id, granted, granted_by)
  VALUES (p_user_id, p_permission_id, p_granted, v_granted_by_id)
  ON CONFLICT (user_id, permission_id)
  DO UPDATE SET 
    granted = p_granted,
    granted_by = v_granted_by_id,
    created_at = now();

  -- Log the activity
  INSERT INTO admin_activity_logs (
    user_id, 
    user_email, 
    action, 
    module, 
    entity_type, 
    entity_id,
    details
  )
  SELECT 
    v_granted_by_id,
    p_granted_by_email,
    'update',
    'users',
    'permission',
    p_user_id,
    jsonb_build_object(
      'permission_id', p_permission_id,
      'granted', p_granted
    );

  result := jsonb_build_object('success', true);
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to get activity logs with optional filters
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
      'user_name', COALESCE(au.first_name || ' ' || au.last_name, au.email),
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

-- Function to get login sessions with time tracking
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
      'user_name', COALESCE(au.first_name || ' ' || au.last_name, au.email),
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

-- Function to log admin activity
CREATE OR REPLACE FUNCTION admin_log_activity(
  p_user_email text,
  p_action text,
  p_module text,
  p_entity_type text DEFAULT NULL,
  p_entity_id uuid DEFAULT NULL,
  p_details jsonb DEFAULT NULL,
  p_ip_address text DEFAULT NULL,
  p_user_agent text DEFAULT NULL
)
RETURNS uuid SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_log_id uuid;
BEGIN
  -- Get user ID
  SELECT id INTO v_user_id
  FROM admin_users
  WHERE email = p_user_email;

  -- Insert log
  INSERT INTO admin_activity_logs (
    user_id,
    user_email,
    action,
    module,
    entity_type,
    entity_id,
    details,
    ip_address,
    user_agent
  )
  VALUES (
    v_user_id,
    p_user_email,
    p_action,
    p_module,
    p_entity_type,
    p_entity_id,
    p_details,
    p_ip_address,
    p_user_agent
  )
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql;

-- Function to create login session
CREATE OR REPLACE FUNCTION admin_create_login_session(
  p_user_email text,
  p_ip_address text DEFAULT NULL,
  p_user_agent text DEFAULT NULL
)
RETURNS uuid SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_session_id uuid;
BEGIN
  -- Get user ID
  SELECT id INTO v_user_id
  FROM admin_users
  WHERE email = p_user_email;

  -- Create session
  INSERT INTO admin_login_sessions (
    user_id,
    ip_address,
    user_agent
  )
  VALUES (
    v_user_id,
    p_ip_address,
    p_user_agent
  )
  RETURNING id INTO v_session_id;

  -- Log activity
  PERFORM admin_log_activity(
    p_user_email,
    'login',
    'auth',
    'session',
    v_session_id,
    NULL,
    p_ip_address,
    p_user_agent
  );

  RETURN v_session_id;
END;
$$ LANGUAGE plpgsql;

-- Function to close login session
CREATE OR REPLACE FUNCTION admin_close_login_session(
  p_session_id uuid
)
RETURNS boolean SECURITY DEFINER
AS $$
BEGIN
  UPDATE admin_login_sessions
  SET logged_out_at = now()
  WHERE id = p_session_id
    AND logged_out_at IS NULL;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION admin_get_all_users() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION admin_get_user_permissions(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION admin_update_user_permissions(uuid, uuid, boolean, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION admin_get_activity_logs(int, int, uuid, text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION admin_get_login_sessions(int, uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION admin_log_activity(text, text, text, text, uuid, jsonb, text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION admin_create_login_session(text, text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION admin_close_login_session(uuid) TO anon, authenticated;
