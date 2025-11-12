/*
  # Fix Admin Access to organizer_federations

  ## Changes
  - Drop existing admin policy
  - Create simplified admin policy that works with current auth
  - Ensures super admins can manage all federation assignments

  ## Security
  - Maintains RLS protection
  - Allows admins full access to organizer_federations
  - Organizers can still manage their own federations
*/

-- Drop existing admin policy
DROP POLICY IF EXISTS "Admins can manage all federations" ON organizer_federations;

-- Create new admin policy with direct check
CREATE POLICY "Admins can manage all federations"
  ON organizer_federations
  FOR ALL
  TO authenticated
  USING (
    auth.uid() IN (SELECT id FROM admin_users WHERE is_active = true)
  )
  WITH CHECK (
    auth.uid() IN (SELECT id FROM admin_users WHERE is_active = true)
  );

-- Also ensure the insert policy works correctly
DROP POLICY IF EXISTS "Organizers and admins can insert federations" ON organizer_federations;

CREATE POLICY "Organizers and admins can insert federations"
  ON organizer_federations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Admin check
    auth.uid() IN (SELECT id FROM admin_users WHERE is_active = true)
    OR
    -- Organizer check
    organizer_id IN (
      SELECT id FROM organizers WHERE user_id = auth.uid()
    )
  );
