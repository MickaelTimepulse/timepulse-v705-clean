/*
  # Fix all team_members RLS policies for anonymous access

  1. Changes
    - Drop ALL existing policies that reference auth.users
    - Create clean, simple policies that work for anon users
    - Separate policies for public read and authenticated write
  
  2. Security
    - Public can read team_members for any entry
    - Authenticated users can manage their own teams
    - Organizers and admins can manage all teams
*/

-- Drop ALL existing policies on team_members
DROP POLICY IF EXISTS "Public can view team members of validated teams" ON team_members;
DROP POLICY IF EXISTS "Team members can view their team" ON team_members;
DROP POLICY IF EXISTS "Captains can add members" ON team_members;
DROP POLICY IF EXISTS "Captains can update members" ON team_members;
DROP POLICY IF EXISTS "Captains can remove members" ON team_members;
DROP POLICY IF EXISTS "Organizers can manage team members" ON team_members;
DROP POLICY IF EXISTS "Admins can manage all team members" ON team_members;
DROP POLICY IF EXISTS "Anon can view team members for confirmed entries" ON team_members;

-- Simple public read policy (no auth.users reference)
CREATE POLICY "Public can read team members"
  ON team_members
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Authenticated users can insert if they're the captain
CREATE POLICY "Captains can insert team members"
  ON team_members
  FOR INSERT
  TO authenticated
  WITH CHECK (
    team_id IN (
      SELECT id FROM teams
      WHERE captain_entry_id IN (
        SELECT id FROM entries
        WHERE athlete_id IN (
          SELECT id FROM athletes
          WHERE user_id = auth.uid()
        )
      )
    )
  );

-- Authenticated users can update their team members
CREATE POLICY "Captains can update team members"
  ON team_members
  FOR UPDATE
  TO authenticated
  USING (
    team_id IN (
      SELECT id FROM teams
      WHERE captain_entry_id IN (
        SELECT id FROM entries
        WHERE athlete_id IN (
          SELECT id FROM athletes
          WHERE user_id = auth.uid()
        )
      )
    )
  );

-- Authenticated users can delete their team members
CREATE POLICY "Captains can delete team members"
  ON team_members
  FOR DELETE
  TO authenticated
  USING (
    team_id IN (
      SELECT id FROM teams
      WHERE captain_entry_id IN (
        SELECT id FROM entries
        WHERE athlete_id IN (
          SELECT id FROM athletes
          WHERE user_id = auth.uid()
        )
      )
    )
  );

-- Organizers can manage team members for their events
CREATE POLICY "Organizers can manage team members"
  ON team_members
  FOR ALL
  TO authenticated
  USING (
    team_id IN (
      SELECT t.id FROM teams t
      JOIN races r ON r.id = t.race_id
      JOIN events e ON e.id = r.event_id
      JOIN organizers o ON o.id = e.organizer_id
      WHERE o.user_id = auth.uid()
    )
  );

-- Admins can manage all team members
CREATE POLICY "Admins can manage all team members"
  ON team_members
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE user_id = auth.uid()
    )
  );
