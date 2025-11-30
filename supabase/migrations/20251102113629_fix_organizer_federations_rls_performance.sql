/*
  # Fix RLS Performance Issues on organizer_federations

  1. Changes
    - Replace auth.<function>() with (select auth.<function>()) in all RLS policies
    - This prevents re-evaluation for each row, improving query performance at scale

  2. Affected Policies
    - Admins can manage all federations
    - Organizers and admins can insert federations
    - Organizers can delete their federations
    - Organizers can update their federations
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can manage all federations" ON organizer_federations;
DROP POLICY IF EXISTS "Organizers and admins can insert federations" ON organizer_federations;
DROP POLICY IF EXISTS "Organizers can delete their federations" ON organizer_federations;
DROP POLICY IF EXISTS "Organizers can update their federations" ON organizer_federations;

-- Recreate policies with optimized auth function calls
CREATE POLICY "Admins can manage all federations"
  ON organizer_federations
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id = (SELECT auth.uid())
      AND role IN ('super_admin', 'admin')
    )
  );

CREATE POLICY "Organizers and admins can insert federations"
  ON organizer_federations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organizers
      WHERE id = organizer_federations.organizer_id
      AND user_id = (SELECT auth.uid())
    )
    OR EXISTS (
      SELECT 1 FROM admin_users
      WHERE id = (SELECT auth.uid())
      AND role IN ('super_admin', 'admin')
    )
  );

CREATE POLICY "Organizers can delete their federations"
  ON organizer_federations
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organizers
      WHERE id = organizer_federations.organizer_id
      AND user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Organizers can update their federations"
  ON organizer_federations
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organizers
      WHERE id = organizer_federations.organizer_id
      AND user_id = (SELECT auth.uid())
    )
  );