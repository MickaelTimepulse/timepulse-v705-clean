/*
  # Fix INSERT policy for organizer_federations
  
  1. Problem
    - Current INSERT policy references organizer_federations.organizer_id
    - During INSERT, the row doesn't exist yet, so WITH CHECK fails
  
  2. Solution
    - Use a function-based approach that can access NEW values
    - Create a simpler policy that checks organizer ownership
  
  3. Security
    - Ensures only organizers can insert their own federation links
*/

-- Drop the problematic INSERT policy
DROP POLICY IF EXISTS "Organizers can insert their federations" ON organizer_federations;

-- Create a new INSERT policy with a working WITH CHECK
-- The key is to check if the organizer_id being inserted belongs to the current user
CREATE POLICY "Organizers can insert their federations"
  ON organizer_federations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    organizer_id IN (
      SELECT id FROM organizers
      WHERE user_id = auth.uid()
    )
  );
