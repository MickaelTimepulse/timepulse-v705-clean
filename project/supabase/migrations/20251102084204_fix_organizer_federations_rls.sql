/*
  # Fix RLS policies for organizer_federations
  
  1. Changes
    - Drop existing policies with missing WITH CHECK
    - Recreate policies with proper WITH CHECK clauses
    - Ensure organizers can insert/update/delete their own federation links
  
  2. Security
    - Organizers can only manage their own federations
    - Admins can manage all federations
*/

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Organizers can manage their federations" ON organizer_federations;
DROP POLICY IF EXISTS "Admins can manage all organizer federations" ON organizer_federations;

-- Recreate policy for organizers to insert their own federation links
CREATE POLICY "Organizers can insert their federations"
  ON organizer_federations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organizers
      WHERE organizers.id = organizer_federations.organizer_id
        AND organizers.user_id = auth.uid()
    )
  );

-- Recreate policy for organizers to update their own federation links
CREATE POLICY "Organizers can update their federations"
  ON organizer_federations
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organizers
      WHERE organizers.id = organizer_federations.organizer_id
        AND organizers.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organizers
      WHERE organizers.id = organizer_federations.organizer_id
        AND organizers.user_id = auth.uid()
    )
  );

-- Recreate policy for organizers to delete their own federation links
CREATE POLICY "Organizers can delete their federations"
  ON organizer_federations
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organizers
      WHERE organizers.id = organizer_federations.organizer_id
        AND organizers.user_id = auth.uid()
    )
  );

-- Recreate admin policy with proper WITH CHECK
CREATE POLICY "Admins can manage all federations"
  ON organizer_federations
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
    )
  );
