/*
  # Add Admin Access Policies

  1. Purpose
    - Grant super admin users full access to all tables
    - Admins are identified by role = 'admin' in profiles table
  
  2. New Policies
    - Admin SELECT policies on: events, organizers, registrations, races, athletes
    - Admin UPDATE policies on: events, organizers, registrations, races
    - Admin DELETE policies on: events, organizers, registrations
  
  3. Security
    - Only users with role='admin' in profiles table get full access
    - Existing organizer policies remain unchanged
*/

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Events: Admin full access
CREATE POLICY "Admins can view all events"
  ON events FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admins can update all events"
  ON events FOR UPDATE
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admins can delete all events"
  ON events FOR DELETE
  TO authenticated
  USING (is_admin());

-- Organizers: Admin full access
CREATE POLICY "Admins can view all organizers"
  ON organizers FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admins can update all organizers"
  ON organizers FOR UPDATE
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admins can delete organizers"
  ON organizers FOR DELETE
  TO authenticated
  USING (is_admin());

-- Registrations: Admin full access
CREATE POLICY "Admins can view all registrations"
  ON registrations FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admins can update all registrations"
  ON registrations FOR UPDATE
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admins can delete registrations"
  ON registrations FOR DELETE
  TO authenticated
  USING (is_admin());

-- Races: Admin full access
CREATE POLICY "Admins can view all races"
  ON races FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admins can update all races"
  ON races FOR UPDATE
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admins can delete races"
  ON races FOR DELETE
  TO authenticated
  USING (is_admin());

-- Athletes: Admin full access
CREATE POLICY "Admins can view all athletes"
  ON athletes FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admins can update all athletes"
  ON athletes FOR UPDATE
  TO authenticated
  USING (is_admin());

-- Entries: Admin full access
CREATE POLICY "Admins can view all entries"
  ON entries FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admins can update all entries"
  ON entries FOR UPDATE
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admins can delete entries"
  ON entries FOR DELETE
  TO authenticated
  USING (is_admin());
