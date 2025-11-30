/*
  # Assign orphaned events and fix RLS
  
  1. Changes
    - Assign events without organizer_id to the first available organizer
    - Make organizer_id NOT NULL
    - Fix UPDATE policy to work correctly
    
  2. Security
    - Ensure all events have a valid organizer
    - Maintain proper access control
*/

-- Assign orphaned events to the first organizer
UPDATE events
SET organizer_id = (SELECT id FROM organizers ORDER BY created_at LIMIT 1)
WHERE organizer_id IS NULL;

-- Make organizer_id NOT NULL
ALTER TABLE events ALTER COLUMN organizer_id SET NOT NULL;

-- Drop and recreate the UPDATE policy
DROP POLICY IF EXISTS "Organizers can update own events" ON events;

-- Create a simpler, more reliable policy
-- The key insight: WITH CHECK evaluates against the NEW row after the update
-- So we just need to check that the organizer_id (whether changed or not) belongs to the user
CREATE POLICY "Organizers can update own events"
  ON events FOR UPDATE
  TO authenticated
  USING (
    -- Can only update events where current organizer_id belongs to user
    EXISTS (
      SELECT 1 FROM organizers 
      WHERE organizers.id = events.organizer_id 
      AND organizers.user_id = auth.uid()
    )
  )
  WITH CHECK (
    -- After update, organizer_id must still belong to user
    -- This prevents transferring events to other organizers
    EXISTS (
      SELECT 1 FROM organizers 
      WHERE organizers.id = events.organizer_id 
      AND organizers.user_id = auth.uid()
    )
  );
