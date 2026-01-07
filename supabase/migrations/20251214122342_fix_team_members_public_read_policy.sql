/*
  # Fix team_members public read access

  1. Changes
    - Drop the existing public policy that may have issues with subqueries
    - Create a simpler public read policy for team_members
    - Allow anon role to read team_members for races with confirmed entries
  
  2. Security
    - Public can only read team_members for entries that are confirmed
    - No complex subqueries that might fail for anonymous users
*/

-- Drop the problematic policy
DROP POLICY IF EXISTS "Public can view team members of validated teams" ON team_members;

-- Create a simpler policy that works for anonymous users
CREATE POLICY "Anon can view team members for confirmed entries"
  ON team_members
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM entries e
      WHERE e.id = team_members.entry_id
      AND e.status = 'confirmed'
    )
  );
