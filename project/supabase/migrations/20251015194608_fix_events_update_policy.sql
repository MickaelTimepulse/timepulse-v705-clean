/*
  # Fix events UPDATE policy to allow organizers to update their events
  
  1. Changes
    - Simplify UPDATE policy for events
    - The WITH CHECK should allow updates as long as organizer_id doesn't change
    - or if it changes, it must still belong to the same user
    
  2. Security
    - Organizers can only update events they own
    - Organizers cannot transfer events to other organizers
*/

-- Drop existing UPDATE policy
DROP POLICY IF EXISTS "Organizers can update own events" ON events;

-- Recreate with simplified check
-- USING clause: user must own the event to update it
-- WITH CHECK: after update, user must still own the event (prevents transferring to another organizer)
CREATE POLICY "Organizers can update own events"
  ON events FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organizers 
      WHERE organizers.id = events.organizer_id 
      AND organizers.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organizers 
      WHERE organizers.id = events.organizer_id 
      AND organizers.user_id = auth.uid()
    )
  );
