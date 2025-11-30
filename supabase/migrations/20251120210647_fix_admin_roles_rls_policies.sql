/*
  # Fix Admin Roles and Permissions RLS Policies
  
  1. Changes
    - Add RLS policies for admin_roles table
    - Add RLS policies for admin_permissions table
    - Add RLS policies for admin_user_permissions table
    - Add RLS policies for admin_login_sessions table
    - Add RLS policies for admin_activity_logs table
  
  2. Security
    - Super admins can read all roles, permissions, and manage user permissions
    - All admins can read their own activity logs and sessions
    - Only super admins can create/update/delete roles and permissions
*/

-- =====================================================
-- ADMIN ROLES - Super admins can manage, all admins can read
-- =====================================================

DROP POLICY IF EXISTS "Super admins can read all admin roles" ON admin_roles;
CREATE POLICY "Super admins can read all admin roles"
  ON admin_roles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      JOIN admin_roles ar ON au.role_id = ar.id
      WHERE au.id = auth.uid()
      AND ar.is_super_admin = true
    )
  );

DROP POLICY IF EXISTS "Super admins can insert admin roles" ON admin_roles;
CREATE POLICY "Super admins can insert admin roles"
  ON admin_roles FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users au
      JOIN admin_roles ar ON au.role_id = ar.id
      WHERE au.id = auth.uid()
      AND ar.is_super_admin = true
    )
  );

DROP POLICY IF EXISTS "Super admins can update admin roles" ON admin_roles;
CREATE POLICY "Super admins can update admin roles"
  ON admin_roles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      JOIN admin_roles ar ON au.role_id = ar.id
      WHERE au.id = auth.uid()
      AND ar.is_super_admin = true
    )
  );

DROP POLICY IF EXISTS "Super admins can delete admin roles" ON admin_roles;
CREATE POLICY "Super admins can delete admin roles"
  ON admin_roles FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      JOIN admin_roles ar ON au.role_id = ar.id
      WHERE au.id = auth.uid()
      AND ar.is_super_admin = true
    )
  );

-- =====================================================
-- ADMIN PERMISSIONS - Super admins can manage, all admins can read
-- =====================================================

DROP POLICY IF EXISTS "Super admins can read all admin permissions" ON admin_permissions;
CREATE POLICY "Super admins can read all admin permissions"
  ON admin_permissions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      JOIN admin_roles ar ON au.role_id = ar.id
      WHERE au.id = auth.uid()
      AND ar.is_super_admin = true
    )
  );

DROP POLICY IF EXISTS "Super admins can insert admin permissions" ON admin_permissions;
CREATE POLICY "Super admins can insert admin permissions"
  ON admin_permissions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users au
      JOIN admin_roles ar ON au.role_id = ar.id
      WHERE au.id = auth.uid()
      AND ar.is_super_admin = true
    )
  );

DROP POLICY IF EXISTS "Super admins can update admin permissions" ON admin_permissions;
CREATE POLICY "Super admins can update admin permissions"
  ON admin_permissions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      JOIN admin_roles ar ON au.role_id = ar.id
      WHERE au.id = auth.uid()
      AND ar.is_super_admin = true
    )
  );

-- =====================================================
-- ADMIN USER PERMISSIONS - Super admins can manage
-- =====================================================

DROP POLICY IF EXISTS "Super admins can read admin user permissions" ON admin_user_permissions;
CREATE POLICY "Super admins can read admin user permissions"
  ON admin_user_permissions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      JOIN admin_roles ar ON au.role_id = ar.id
      WHERE au.id = auth.uid()
      AND ar.is_super_admin = true
    )
  );

DROP POLICY IF EXISTS "Super admins can insert admin user permissions" ON admin_user_permissions;
CREATE POLICY "Super admins can insert admin user permissions"
  ON admin_user_permissions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users au
      JOIN admin_roles ar ON au.role_id = ar.id
      WHERE au.id = auth.uid()
      AND ar.is_super_admin = true
    )
  );

DROP POLICY IF EXISTS "Super admins can update admin user permissions" ON admin_user_permissions;
CREATE POLICY "Super admins can update admin user permissions"
  ON admin_user_permissions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      JOIN admin_roles ar ON au.role_id = ar.id
      WHERE au.id = auth.uid()
      AND ar.is_super_admin = true
    )
  );

DROP POLICY IF EXISTS "Super admins can delete admin user permissions" ON admin_user_permissions;
CREATE POLICY "Super admins can delete admin user permissions"
  ON admin_user_permissions FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      JOIN admin_roles ar ON au.role_id = ar.id
      WHERE au.id = auth.uid()
      AND ar.is_super_admin = true
    )
  );

-- =====================================================
-- ADMIN LOGIN SESSIONS - Admins can read own sessions, super admins can read all
-- =====================================================

DROP POLICY IF EXISTS "Admins can read own login sessions" ON admin_login_sessions;
CREATE POLICY "Admins can read own login sessions"
  ON admin_login_sessions FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM admin_users au
      JOIN admin_roles ar ON au.role_id = ar.id
      WHERE au.id = auth.uid()
      AND ar.is_super_admin = true
    )
  );

DROP POLICY IF EXISTS "Admins can insert own login sessions" ON admin_login_sessions;
CREATE POLICY "Admins can insert own login sessions"
  ON admin_login_sessions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can update own login sessions" ON admin_login_sessions;
CREATE POLICY "Admins can update own login sessions"
  ON admin_login_sessions FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- =====================================================
-- ADMIN ACTIVITY LOGS - Admins can read own logs, super admins can read all
-- =====================================================

DROP POLICY IF EXISTS "Admins can read admin activity logs" ON admin_activity_logs;
CREATE POLICY "Admins can read admin activity logs"
  ON admin_activity_logs FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM admin_users au
      JOIN admin_roles ar ON au.role_id = ar.id
      WHERE au.id = auth.uid()
      AND ar.is_super_admin = true
    )
  );

DROP POLICY IF EXISTS "Admins can insert activity logs" ON admin_activity_logs;
CREATE POLICY "Admins can insert activity logs"
  ON admin_activity_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.id = auth.uid()
    )
  );
