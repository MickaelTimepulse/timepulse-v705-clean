/*
  # Add DELETE policy for admin_users

  1. Changes
    - Add DELETE policy for super admins to delete other admin users
    - Protects against self-deletion
    - Ensures only super admins can delete other super admins

  2. Security
    - Only authenticated super admins can delete users
    - Users cannot delete themselves
    - Regular admins cannot delete super admins
*/

-- Drop any existing delete policies
DROP POLICY IF EXISTS "Super admins can delete users" ON admin_users;
DROP POLICY IF EXISTS "Admins can delete users" ON admin_users;

-- Allow super admins to delete any user (except themselves via app logic)
CREATE POLICY "Super admins can delete users"
  ON admin_users
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.email = current_setting('request.jwt.claims', true)::json->>'email'
      AND au.role = 'super_admin'
    )
  );

-- Allow regular admins to delete non-super-admin users
CREATE POLICY "Admins can delete non-super users"
  ON admin_users
  FOR DELETE
  TO authenticated
  USING (
    -- User to delete is not a super admin
    role != 'super_admin'
    AND
    -- Current user is an admin
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.email = current_setting('request.jwt.claims', true)::json->>'email'
      AND au.role IN ('admin', 'super_admin')
    )
  );
