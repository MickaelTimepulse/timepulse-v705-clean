/*
  # Fix is_super_admin - Avoid auth.users Permission Issues

  1. Problem
    - Function is_super_admin() uses auth.uid() in a JOIN
    - This causes PostgreSQL to try to access auth.users table
    - auth.users is a system table with restricted access
  
  2. Solution
    - Rewrite function to get auth.uid() value first
    - Use it as a variable, not in the query itself
    - This avoids permission checks on auth.users
  
  3. Technical Details
    - Use PL/pgSQL instead of SQL
    - Store auth.uid() in a variable
    - Use the variable in the WHERE clause
*/

-- Drop and recreate with PL/pgSQL
DROP FUNCTION IF EXISTS is_super_admin() CASCADE;

CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  current_user_id uuid;
  is_admin boolean;
BEGIN
  -- Get current user ID (this doesn't query auth.users table)
  current_user_id := auth.uid();
  
  -- If no user is authenticated, return false
  IF current_user_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Check if user is super admin
  SELECT EXISTS (
    SELECT 1 
    FROM public.admin_users au
    INNER JOIN public.admin_roles ar ON au.role_id = ar.id
    WHERE au.id = current_user_id
    AND ar.is_super_admin = true
    AND au.is_active = true
  ) INTO is_admin;
  
  RETURN COALESCE(is_admin, false);
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION is_super_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION is_super_admin() TO anon;

-- =====================================================
-- Recreate all RLS policies that were dropped
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
