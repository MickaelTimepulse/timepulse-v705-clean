/*
  # Allow All Admins to Read Roles

  1. Problem
    - Only super admins could read admin_roles
    - Regular admins need to see available roles
    - Frontend needs to load roles for UI display
  
  2. Solution
    - Add policy allowing any authenticated admin to read roles
    - Keep write permissions for super admins only
  
  3. Security
    - Read-only access for all admins
    - Write access remains restricted to super admins
*/

-- Allow any authenticated admin to read roles (not just super admins)
CREATE POLICY "Authenticated admins can read admin roles"
  ON admin_roles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users au
      WHERE au.id = auth.uid()
      AND au.is_active = true
    )
  );
