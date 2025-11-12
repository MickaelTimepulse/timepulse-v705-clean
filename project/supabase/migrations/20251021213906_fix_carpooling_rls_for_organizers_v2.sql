/*
  # Fix Carpooling RLS for Organizers

  1. Changes
    - Add policy for organizers to view all offers for their events
    - Add policy for organizers to update all offers for their events
    - Add policy for organizers to delete/cancel offers for their events

  2. Security
    - Organizers can only manage carpooling offers for their own events
    - Uses event_id -> organizer_id relationship for authorization
*/

-- Drop existing policies if they exist and recreate them
DROP POLICY IF EXISTS "Organizers can view all carpooling offers for their events" ON carpooling_offers;
DROP POLICY IF EXISTS "Organizers can update carpooling offers for their events" ON carpooling_offers;
DROP POLICY IF EXISTS "Organizers can delete carpooling offers for their events" ON carpooling_offers;

-- Policy for organizers to view all carpooling offers for their events
CREATE POLICY "Organizers can view all carpooling offers for their events"
ON carpooling_offers
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM events
    WHERE events.id = carpooling_offers.event_id
    AND events.organizer_id IN (
      SELECT id FROM organizers WHERE user_id = auth.uid()
    )
  )
);

-- Policy for organizers to update carpooling offers for their events
CREATE POLICY "Organizers can update carpooling offers for their events"
ON carpooling_offers
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM events
    WHERE events.id = carpooling_offers.event_id
    AND events.organizer_id IN (
      SELECT id FROM organizers WHERE user_id = auth.uid()
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM events
    WHERE events.id = carpooling_offers.event_id
    AND events.organizer_id IN (
      SELECT id FROM organizers WHERE user_id = auth.uid()
    )
  )
);

-- Policy for organizers to delete/cancel carpooling offers for their events
CREATE POLICY "Organizers can delete carpooling offers for their events"
ON carpooling_offers
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM events
    WHERE events.id = carpooling_offers.event_id
    AND events.organizer_id IN (
      SELECT id FROM organizers WHERE user_id = auth.uid()
    )
  )
);
