/*
  # Fix Super Admin Access to Organizers

  1. Changes
    - Update is_admin() function to include super_admin check from admin_users table
    - This allows super admins to modify organizers in the admin panel

  2. Security
    - Function checks both profiles.role='admin' and admin_users.is_super_admin=true
    - Maintains existing security while adding super admin access
*/

-- Update helper function to check if user is admin or super admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  ) OR EXISTS (
    SELECT 1 FROM admin_users
    WHERE id = auth.uid()
    AND is_super_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;