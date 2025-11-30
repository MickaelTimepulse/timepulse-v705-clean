/*
  # Fix RLS policies for registration_options to work with entries table

  1. Changes
    - Add policy for organizers to insert registration options for their event entries
    - Add policy for organizers to update/delete registration options for their event entries
    - The policies check via entries table instead of registrations table

  2. Security
    - Organizers can only manage options for entries in their events
    - All checks are based on the organizer_id relationship
*/

-- Drop existing incompatible policies
DROP POLICY IF EXISTS "Users can create registration options" ON registration_options;

-- Allow organizers to insert registration options for entries in their events
CREATE POLICY "Organizers can insert registration options for their entries"
  ON registration_options
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM entries
      JOIN events ON entries.event_id = events.id
      JOIN organizers ON events.organizer_id = organizers.id
      WHERE entries.id = registration_options.registration_id
      AND organizers.user_id::text = auth.uid()::text
    )
  );

-- Allow organizers to update registration options for entries in their events
CREATE POLICY "Organizers can update registration options for their entries"
  ON registration_options
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM entries
      JOIN events ON entries.event_id = events.id
      JOIN organizers ON events.organizer_id = organizers.id
      WHERE entries.id = registration_options.registration_id
      AND organizers.user_id::text = auth.uid()::text
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM entries
      JOIN events ON entries.event_id = events.id
      JOIN organizers ON events.organizer_id = organizers.id
      WHERE entries.id = registration_options.registration_id
      AND organizers.user_id::text = auth.uid()::text
    )
  );

-- Allow organizers to delete registration options for entries in their events
CREATE POLICY "Organizers can delete registration options for their entries"
  ON registration_options
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM entries
      JOIN events ON entries.event_id = events.id
      JOIN organizers ON events.organizer_id = organizers.id
      WHERE entries.id = registration_options.registration_id
      AND organizers.user_id::text = auth.uid()::text
    )
  );
