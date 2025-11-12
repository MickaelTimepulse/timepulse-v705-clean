/*
  # Simplify athletes RLS policy for debugging

  1. Changes
    - Drop all existing INSERT policies on athletes
    - Create a permissive policy for authenticated users to insert athletes
    - This allows us to debug the manual entry form

  2. Security Note
    - This is intentionally permissive for testing
    - All authenticated users can insert athletes
*/

-- Drop all existing INSERT policies on athletes
DROP POLICY IF EXISTS "Organizers can create athletes" ON athletes;
DROP POLICY IF EXISTS "Authenticated users can create athletes" ON athletes;

-- Create a simple INSERT policy for all authenticated users
CREATE POLICY "Authenticated users can insert athletes"
  ON athletes FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Ensure RLS is enabled
ALTER TABLE athletes ENABLE ROW LEVEL SECURITY;
