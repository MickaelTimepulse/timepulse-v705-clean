/*
  # Fix Admin Roles Infinite Recursion

  1. Problem
    - RLS policies on admin_roles were causing infinite recursion
    - The policy checked admin_roles while accessing admin_roles
  
  2. Solution
    - Create a SECURITY DEFINER function to check super admin status
    - Use this function in RLS policies to break the recursion
    - The function bypasses RLS and accesses data directly
  
  3. Security
    - Function is SECURITY DEFINER but only returns boolean
    - No sensitive data exposed, only admin status check
    - All operations still require authentication
*/

-- =====================================================
-- Helper function to check if current user is super admin
-- This breaks the RLS recursion by using SECURITY DEFINER
-- =====================================================

CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_users au
    JOIN admin_roles ar ON au.role_id = ar.id
    WHERE au.id = auth.uid()
    AND ar.is_super_admin = true
  );
END;
$$;

-- =====================================================
-- ADMIN ROLES - Use helper function to avoid recursion
-- =====================================================

DROP POLICY IF EXISTS "Super admins can read all admin roles" ON admin_roles;
CREATE POLICY "Super admins can read all admin roles"
  ON admin_roles FOR SELECT
  TO authenticated
  USING (is_super_admin());

DROP POLICY IF EXISTS "Super admins can insert admin roles" ON admin_roles;
CREATE POLICY "Super admins can insert admin roles"
  ON admin_roles FOR INSERT
  TO authenticated
  WITH CHECK (is_super_admin());

DROP POLICY IF EXISTS "Super admins can update admin roles" ON admin_roles;
CREATE POLICY "Super admins can update admin roles"
  ON admin_roles FOR UPDATE
  TO authenticated
  USING (is_super_admin());

DROP POLICY IF EXISTS "Super admins can delete admin roles" ON admin_roles;
CREATE POLICY "Super admins can delete admin roles"
  ON admin_roles FOR DELETE
  TO authenticated
  USING (is_super_admin());

-- =====================================================
-- ADMIN PERMISSIONS - Use helper function
-- =====================================================

DROP POLICY IF EXISTS "Super admins can read all admin permissions" ON admin_permissions;
CREATE POLICY "Super admins can read all admin permissions"
  ON admin_permissions FOR SELECT
  TO authenticated
  USING (is_super_admin());

DROP POLICY IF EXISTS "Super admins can insert admin permissions" ON admin_permissions;
CREATE POLICY "Super admins can insert admin permissions"
  ON admin_permissions FOR INSERT
  TO authenticated
  WITH CHECK (is_super_admin());

DROP POLICY IF EXISTS "Super admins can update admin permissions" ON admin_permissions;
CREATE POLICY "Super admins can update admin permissions"
  ON admin_permissions FOR UPDATE
  TO authenticated
  USING (is_super_admin());

-- =====================================================
-- ADMIN USER PERMISSIONS - Use helper function
-- =====================================================

DROP POLICY IF EXISTS "Super admins can read admin user permissions" ON admin_user_permissions;
CREATE POLICY "Super admins can read admin user permissions"
  ON admin_user_permissions FOR SELECT
  TO authenticated
  USING (is_super_admin());

DROP POLICY IF EXISTS "Super admins can insert admin user permissions" ON admin_user_permissions;
CREATE POLICY "Super admins can insert admin user permissions"
  ON admin_user_permissions FOR INSERT
  TO authenticated
  WITH CHECK (is_super_admin());

DROP POLICY IF EXISTS "Super admins can update admin user permissions" ON admin_user_permissions;
CREATE POLICY "Super admins can update admin user permissions"
  ON admin_user_permissions FOR UPDATE
  TO authenticated
  USING (is_super_admin());

DROP POLICY IF EXISTS "Super admins can delete admin user permissions" ON admin_user_permissions;
CREATE POLICY "Super admins can delete admin user permissions"
  ON admin_user_permissions FOR DELETE
  TO authenticated
  USING (is_super_admin());

-- =====================================================
-- ADMIN LOGIN SESSIONS - Use helper function
-- =====================================================

DROP POLICY IF EXISTS "Admins can read own login sessions" ON admin_login_sessions;
CREATE POLICY "Admins can read own login sessions"
  ON admin_login_sessions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR is_super_admin());

-- =====================================================
-- ADMIN ACTIVITY LOGS - Use helper function
-- =====================================================

DROP POLICY IF EXISTS "Admins can read admin activity logs" ON admin_activity_logs;
CREATE POLICY "Admins can read admin activity logs"
  ON admin_activity_logs FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR is_super_admin());
