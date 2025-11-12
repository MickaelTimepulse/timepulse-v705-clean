/*
  # Fix events UPDATE policy with proper WITH CHECK
  
  1. Problem
    - Missing WITH CHECK clause causes RLS violation
    - The new row after update must also satisfy ownership
    
  2. Solution
    - Add WITH CHECK to ensure new row still belongs to organizer
    - Ensure organizer_id cannot be changed to another user's organizer
    
  3. Security
    - Users can only update events they own
    - Users cannot reassign events to other organizers
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
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organizers 
      WHERE organizers.id = events.organizer_id 
      AND organizers.user_id = auth.uid()
    )
  );
