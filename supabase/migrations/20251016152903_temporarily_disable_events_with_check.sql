/*
  # Temporarily disable WITH CHECK to debug
  
  1. Changes
    - Remove WITH CHECK constraint temporarily
    - Keep USING to still require ownership for selecting
    
  2. Purpose
    - Identify if the issue is with WITH CHECK clause
*/

DROP POLICY IF EXISTS "Organizers can update own events" ON events;

CREATE POLICY "Organizers can update own events"
  ON events FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organizers 
      WHERE organizers.id = events.organizer_id 
      AND organizers.user_id = auth.uid()
    )
  );
  -- No WITH CHECK = no constraint on the new row
