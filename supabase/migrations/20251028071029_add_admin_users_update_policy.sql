/*
  # Add policy for admins to update admin_users

  1. Security
    - Add policy to allow authenticated admins to update admin_users table
    - Ensure only admins can modify other admin accounts
*/

-- Add policy for admins to update admin_users
CREATE POLICY "Admins can update admin users"
  ON admin_users
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );
