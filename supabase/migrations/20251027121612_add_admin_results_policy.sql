/*
  # Add admin policy for results table

  1. Changes
    - Add policy to allow admins to insert, update, and delete results
    - This enables admins to import results through the admin interface

  2. Security
    - Policy checks if the user is an admin via admin_users table
    - Only authenticated users who are admins can manage all results
*/

-- Add admin policy for results management
CREATE POLICY "Admins can manage all results"
  ON results
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      JOIN auth.users u ON u.email = au.email
      WHERE u.id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users au
      JOIN auth.users u ON u.email = au.email
      WHERE u.id = auth.uid()
    )
  );
