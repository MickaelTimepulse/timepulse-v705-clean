/*
  # Fix UPDATE policy for organizer_federations
  
  1. Changes
    - Simplify USING and WITH CHECK clauses
    - Use IN subquery for better performance and clarity
  
  2. Security
    - Ensures only organizers can update their own federation links
*/

-- Drop the existing UPDATE policy
DROP POLICY IF EXISTS "Organizers can update their federations" ON organizer_federations;

-- Create a new UPDATE policy with clearer logic
CREATE POLICY "Organizers can update their federations"
  ON organizer_federations
  FOR UPDATE
  TO authenticated
  USING (
    organizer_id IN (
      SELECT id FROM organizers
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    organizer_id IN (
      SELECT id FROM organizers
      WHERE user_id = auth.uid()
    )
  );

-- Also fix DELETE policy for consistency
DROP POLICY IF EXISTS "Organizers can delete their federations" ON organizer_federations;

CREATE POLICY "Organizers can delete their federations"
  ON organizer_federations
  FOR DELETE
  TO authenticated
  USING (
    organizer_id IN (
      SELECT id FROM organizers
      WHERE user_id = auth.uid()
    )
  );
