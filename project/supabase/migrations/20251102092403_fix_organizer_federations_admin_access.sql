/*
  # Allow admins to manage organizer federations

  1. Problem
    - Admins cannot insert federations for organizers
    - Current INSERT policy only allows organizers to manage their own federations
  
  2. Solution
    - Add admin check to INSERT policy WITH CHECK clause
    - Admins can insert for any organizer
  
  3. Security
    - Only admin_users can insert federations for any organizer
    - Regular organizers can only insert for themselves
*/

-- Drop and recreate INSERT policy with admin support
DROP POLICY IF EXISTS "Organizers can insert their federations" ON organizer_federations;

CREATE POLICY "Organizers and admins can insert federations"
  ON organizer_federations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Admin can insert for any organizer
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
    )
    OR
    -- Organizer can insert for themselves
    organizer_id IN (
      SELECT id FROM organizers
      WHERE user_id = auth.uid()
    )
  );
