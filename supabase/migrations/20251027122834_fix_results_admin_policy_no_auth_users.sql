/*
  # Fix results admin policy to avoid auth.users access

  1. Changes
    - Drop the existing admin policy that joins with auth.users
    - Create new policy using auth.jwt() to get user email
    - This avoids "permission denied for table users" error

  2. Security
    - Maintains same security level
    - Admins can still manage all results
    - Uses JWT claims instead of direct table access
*/

-- Drop existing admin policy
DROP POLICY IF EXISTS "Admins can manage all results" ON results;

-- Create new admin policy using JWT
CREATE POLICY "Admins can manage all results"
  ON results
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE email = (auth.jwt() ->> 'email')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE email = (auth.jwt() ->> 'email')
    )
  );
