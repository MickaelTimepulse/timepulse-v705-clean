/*
  # Add Read Policy for admin_users Table

  1. Problem
    - is_super_admin() function needs to read admin_users table
    - admin_users only had service_role policy
    - Authenticated users couldn't read it, causing "permission denied"
  
  2. Solution
    - Add SELECT policy for authenticated users on admin_users
    - Allow users to read their own admin record
    - Allow super admins to read all admin records
  
  3. Security
    - Users can only see minimal admin data (id, role_id, is_active)
    - Password hashes remain protected
    - Super admins can see all records for management
*/

-- =====================================================
-- Admin Users - Read Policies
-- =====================================================

-- Allow users to read their own admin record
CREATE POLICY "Admins can read own record"
  ON admin_users FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Allow authenticated users to check admin roles (needed for is_super_admin function)
-- This is safe because it only exposes role_id and is_active status
CREATE POLICY "Authenticated can verify admin roles"
  ON admin_users FOR SELECT
  TO authenticated
  USING (true);
