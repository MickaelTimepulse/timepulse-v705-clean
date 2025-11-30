/*
  # Add Speaker Access Policy for Entries

  1. Changes
    - Add policy allowing public to view confirmed entries with race and athlete data
    - This is specifically for the speaker module which doesn't use authentication

  2. Security
    - Only confirmed entries are accessible
    - No write access, only read
*/

-- Drop old conflicting policies that might be too restrictive
DROP POLICY IF EXISTS "Anyone can view confirmed online entries" ON entries;

-- Create a comprehensive public read policy for confirmed entries
CREATE POLICY "Public can view all confirmed entries with details"
  ON entries
  FOR SELECT
  TO public
  USING (status = 'confirmed');

-- Ensure races can be read by public for any event (not just published)
-- This is needed for the speaker module
DROP POLICY IF EXISTS "Anyone can view races for published events" ON races;

CREATE POLICY "Public can view all races"
  ON races
  FOR SELECT
  TO public
  USING (true);
