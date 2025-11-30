/*
  # Fix registration_options to support both registrations and entries

  1. Changes
    - Drop the existing foreign key constraint to registrations
    - Change registration_id to entry_id for clarity
    - Add foreign key constraint to entries table
    - Update RLS policies to use entry_id

  2. Security
    - Maintain existing RLS policies with updated column name
    - Organizers can manage options for their entries

  3. Notes
    - This aligns the table structure with the actual usage in the application
    - All registration options will now reference entries table
*/

-- Drop existing foreign key constraint
ALTER TABLE registration_options 
DROP CONSTRAINT IF EXISTS registration_options_registration_id_fkey;

-- Rename column for clarity (from registration_id to entry_id)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'registration_options' 
    AND column_name = 'registration_id'
  ) THEN
    ALTER TABLE registration_options 
    RENAME COLUMN registration_id TO entry_id;
  END IF;
END $$;

-- Add foreign key to entries table
ALTER TABLE registration_options
ADD CONSTRAINT registration_options_entry_id_fkey
FOREIGN KEY (entry_id) REFERENCES entries(id) ON DELETE CASCADE;

-- Update index name
DROP INDEX IF EXISTS idx_registration_options_registration;
CREATE INDEX IF NOT EXISTS idx_registration_options_entry ON registration_options(entry_id);

-- Recreate RLS policies with correct column name
DROP POLICY IF EXISTS "Users can view their registration options" ON registration_options;
DROP POLICY IF EXISTS "Organizers can view registration options for their events" ON registration_options;
DROP POLICY IF EXISTS "Organizers can insert registration options for their entries" ON registration_options;
DROP POLICY IF EXISTS "Organizers can update registration options for their entries" ON registration_options;
DROP POLICY IF EXISTS "Organizers can delete registration options for their entries" ON registration_options;

-- Organizers can view registration options for their entries
CREATE POLICY "Organizers can view registration options for their entries"
  ON registration_options
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM entries
      JOIN events ON entries.event_id = events.id
      JOIN organizers ON events.organizer_id = organizers.id
      WHERE entries.id = registration_options.entry_id
      AND organizers.user_id::text = auth.uid()::text
    )
  );

-- Organizers can insert registration options for their entries
CREATE POLICY "Organizers can insert registration options for their entries"
  ON registration_options
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM entries
      JOIN events ON entries.event_id = events.id
      JOIN organizers ON events.organizer_id = organizers.id
      WHERE entries.id = registration_options.entry_id
      AND organizers.user_id::text = auth.uid()::text
    )
  );

-- Organizers can update registration options for their entries
CREATE POLICY "Organizers can update registration options for their entries"
  ON registration_options
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM entries
      JOIN events ON entries.event_id = events.id
      JOIN organizers ON events.organizer_id = organizers.id
      WHERE entries.id = registration_options.entry_id
      AND organizers.user_id::text = auth.uid()::text
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM entries
      JOIN events ON entries.event_id = events.id
      JOIN organizers ON events.organizer_id = organizers.id
      WHERE entries.id = registration_options.entry_id
      AND organizers.user_id::text = auth.uid()::text
    )
  );

-- Organizers can delete registration options for their entries
CREATE POLICY "Organizers can delete registration options for their entries"
  ON registration_options
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM entries
      JOIN events ON entries.event_id = events.id
      JOIN organizers ON events.organizer_id = organizers.id
      WHERE entries.id = registration_options.entry_id
      AND organizers.user_id::text = auth.uid()::text
    )
  );
