/*
  # Fix infinite recursion in organizers RLS policies
  
  1. Problem
    - The "Allow FK validation for organizers" policy causes infinite recursion
    - It references organizers table within itself creating a loop
    
  2. Solution
    - Remove the problematic policy
    - Keep only simple, direct policies without recursion
    - The FK validation will work with basic "own profile" policy
    
  3. Security
    - Users can only see their own organizer profile
    - Public can see verified organizers
*/

-- Remove all existing SELECT policies on organizers
DROP POLICY IF EXISTS "Allow FK validation for organizers" ON organizers;
DROP POLICY IF EXISTS "Organizers can view own profile" ON organizers;
DROP POLICY IF EXISTS "Public can view verified organizers" ON organizers;

-- Create simple, non-recursive policies
CREATE POLICY "Organizers can view own profile"
  ON organizers FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Public can view verified organizers"
  ON organizers FOR SELECT
  TO authenticated
  USING (is_verified = true);
