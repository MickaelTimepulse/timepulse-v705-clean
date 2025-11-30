/*
  # Fix is_super_admin Function - Complete Rebuild

  1. Problem
    - is_super_admin() function was causing RLS recursion
    - Need to rebuild function without RLS interference
  
  2. Solution
    - Drop function with CASCADE to remove dependent policies
    - Recreate function with SQL language (faster, no RLS issues)
    - Recreate all RLS policies
  
  3. Security
    - Function bypasses RLS using SECURITY DEFINER
    - Only returns boolean value
    - All policies still require authentication
*/

-- =====================================================
-- Step 1: Drop function with CASCADE (removes policies)
-- =====================================================

DROP FUNCTION IF EXISTS is_super_admin() CASCADE;

-- =====================================================
-- Step 2: Recreate function with proper configuration
-- =====================================================

CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.admin_users au
    INNER JOIN public.admin_roles ar ON au.role_id = ar.id
    WHERE au.id = auth.uid()
    AND ar.is_super_admin = true
    AND au.is_active = true
  );
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION is_super_admin() TO authenticated;

-- =====================================================
-- Step 3: Recreate RLS policies
-- =====================================================

-- ADMIN ROLES
CREATE POLICY "Super admins can read all admin roles"
  ON admin_roles FOR SELECT
  TO authenticated
  USING (is_super_admin());

CREATE POLICY "Super admins can insert admin roles"
  ON admin_roles FOR INSERT
  TO authenticated
  WITH CHECK (is_super_admin());

CREATE POLICY "Super admins can update admin roles"
  ON admin_roles FOR UPDATE
  TO authenticated
  USING (is_super_admin());

CREATE POLICY "Super admins can delete admin roles"
  ON admin_roles FOR DELETE
  TO authenticated
  USING (is_super_admin());

-- ADMIN PERMISSIONS
CREATE POLICY "Super admins can read all admin permissions"
  ON admin_permissions FOR SELECT
  TO authenticated
  USING (is_super_admin());

CREATE POLICY "Super admins can insert admin permissions"
  ON admin_permissions FOR INSERT
  TO authenticated
  WITH CHECK (is_super_admin());

CREATE POLICY "Super admins can update admin permissions"
  ON admin_permissions FOR UPDATE
  TO authenticated
  USING (is_super_admin());

-- ADMIN USER PERMISSIONS
CREATE POLICY "Super admins can read admin user permissions"
  ON admin_user_permissions FOR SELECT
  TO authenticated
  USING (is_super_admin());

CREATE POLICY "Super admins can insert admin user permissions"
  ON admin_user_permissions FOR INSERT
  TO authenticated
  WITH CHECK (is_super_admin());

CREATE POLICY "Super admins can update admin user permissions"
  ON admin_user_permissions FOR UPDATE
  TO authenticated
  USING (is_super_admin());

CREATE POLICY "Super admins can delete admin user permissions"
  ON admin_user_permissions FOR DELETE
  TO authenticated
  USING (is_super_admin());

-- ADMIN LOGIN SESSIONS
CREATE POLICY "Admins can read own login sessions"
  ON admin_login_sessions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR is_super_admin());

-- ADMIN ACTIVITY LOGS
CREATE POLICY "Admins can read admin activity logs"
  ON admin_activity_logs FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR is_super_admin());
