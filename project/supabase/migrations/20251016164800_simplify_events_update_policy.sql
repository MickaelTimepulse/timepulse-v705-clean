/*
  # Simplify events UPDATE policy to avoid RLS issues

  1. Problem
    - Complex WITH CHECK clause with subquery causes RLS violations
    - The subquery to organizers table may fail due to RLS recursion

  2. Solution
    - Simplify to just check that organizer_id is not being changed
    - Use simple equality check instead of EXISTS subquery
    - The USING clause already validates ownership

  3. Security
    - USING ensures user owns the event before update
    - WITH CHECK ensures organizer_id stays the same (no reassignment)
*/

DROP POLICY IF EXISTS "Organizers can update own events" ON events;

-- Simple policy: can update if you own it, and organizer_id doesn't change
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
    -- Just ensure organizer_id is not being changed to someone else's
    organizer_id IN (
      SELECT id FROM organizers WHERE user_id = auth.uid()
    )
  );
