/*
  # Fix RLS for carpooling_bookings - Allow public access

  ## Changes
  
  1. **Drop old restrictive policy**
     - Remove "Drivers can view bookings for their offers"
  
  2. **Create new public read policy**
     - Allow anyone to view confirmed bookings (for public display)
     - Organizers can view all bookings for their events
  
  ## Security
  
  - Public users can only see confirmed bookings
  - Personal data is displayed but app-side anonymization (initials) protects privacy
  - Organizers authenticated via their profile can access full booking data
*/

-- Drop old restrictive policy
DROP POLICY IF EXISTS "Drivers can view bookings for their offers" ON carpooling_bookings;

-- Allow public to view confirmed bookings (needed for public carpooling page)
CREATE POLICY "Public can view confirmed bookings"
  ON carpooling_bookings
  FOR SELECT
  TO public
  USING (status = 'confirmed');

-- Allow organizers to view all bookings for their events
CREATE POLICY "Organizers can view all bookings for their events"
  ON carpooling_bookings
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM carpooling_offers co
      JOIN events e ON e.id = co.event_id
      JOIN organizers o ON o.id = e.organizer_id
      WHERE co.id = carpooling_bookings.offer_id
      AND o.user_id = auth.uid()
    )
  );