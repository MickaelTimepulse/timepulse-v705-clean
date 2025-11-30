/*
  # Fix athletes INSERT policy for organizers

  1. Changes
    - Drop the existing restrictive INSERT policy for athletes
    - Create a new policy that allows authenticated organizers to insert athletes
    - The policy checks that the user is an organizer in the organizers table
  
  2. Security
    - Only authenticated users who are organizers can create athletes
    - This maintains data security while allowing legitimate use
*/

-- Drop existing policy
DROP POLICY IF EXISTS "Organizers can create athletes" ON athletes;

-- Create new policy with proper authentication check
CREATE POLICY "Organizers can create athletes"
  ON athletes FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organizers
      WHERE organizers.user_id = auth.uid()
      AND organizers.status = 'active'
    )
  );
