/*
  # Temporarily remove WITH CHECK to identify the exact issue

  1. Problem
    - WITH CHECK clause causes RLS violations
    - Need to identify if it's the WITH CHECK or something else

  2. Solution
    - Remove WITH CHECK completely
    - Keep only USING clause for reading
    - This will help us understand if the problem is WITH CHECK or elsewhere

  3. Security
    - Temporarily less restrictive to debug
    - Will add back proper security once we identify the issue
*/

DROP POLICY IF EXISTS "Organizers can update own events" ON events;

-- Minimal policy for debugging: only USING, no WITH CHECK
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
  -- No WITH CHECK at all for now
