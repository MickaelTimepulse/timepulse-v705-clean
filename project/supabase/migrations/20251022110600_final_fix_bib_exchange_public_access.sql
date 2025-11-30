/*
  # Final Fix for Bib Exchange Public Access

  1. Changes
    - Drop ALL existing policies on bib_exchange_settings and bib_exchange_listings
    - Recreate clean policies that allow anonymous and authenticated users to view enabled settings
    - Fix public access to listings

  2. Security
    - Only expose settings where is_enabled = true
    - Only expose listings where status = 'available'
    - Organizers maintain full access to their events
*/

-- Clean up ALL existing policies for bib_exchange_settings
DO $$
BEGIN
  DROP POLICY IF EXISTS "Public can view bib exchange settings" ON bib_exchange_settings;
  DROP POLICY IF EXISTS "Anonymous can view enabled bib exchange settings" ON bib_exchange_settings;
  DROP POLICY IF EXISTS "Authenticated can view enabled bib exchange settings" ON bib_exchange_settings;
  DROP POLICY IF EXISTS "Organizers can manage bib exchange settings" ON bib_exchange_settings;
END $$;

-- Clean up ALL existing policies for bib_exchange_listings
DO $$
BEGIN
  DROP POLICY IF EXISTS "Public can view available listings" ON bib_exchange_listings;
  DROP POLICY IF EXISTS "Anonymous can view available listings" ON bib_exchange_listings;
  DROP POLICY IF EXISTS "Authenticated can view available listings" ON bib_exchange_listings;
  DROP POLICY IF EXISTS "Users can create their own listings" ON bib_exchange_listings;
  DROP POLICY IF EXISTS "Users can manage their own listings" ON bib_exchange_listings;
  DROP POLICY IF EXISTS "Organizers can manage all listings" ON bib_exchange_listings;
END $$;

-- Create new clean policies for bib_exchange_settings
CREATE POLICY "Anonymous users can view enabled settings"
  ON bib_exchange_settings FOR SELECT
  TO anon
  USING (is_enabled = true);

CREATE POLICY "Authenticated users can view enabled settings"
  ON bib_exchange_settings FOR SELECT
  TO authenticated
  USING (is_enabled = true);

CREATE POLICY "Organizers can manage settings for their events"
  ON bib_exchange_settings FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM events e
      JOIN organizers o ON e.organizer_id = o.id
      WHERE e.id = bib_exchange_settings.event_id
      AND o.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM events e
      JOIN organizers o ON e.organizer_id = o.id
      WHERE e.id = bib_exchange_settings.event_id
      AND o.user_id = auth.uid()
    )
  );

-- Create new clean policies for bib_exchange_listings
CREATE POLICY "Anonymous users can view available listings"
  ON bib_exchange_listings FOR SELECT
  TO anon
  USING (status = 'available');

CREATE POLICY "Authenticated users can view available listings"
  ON bib_exchange_listings FOR SELECT
  TO authenticated
  USING (status = 'available');

CREATE POLICY "Users can create listings for their registrations"
  ON bib_exchange_listings FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM registrations r
      WHERE r.id = bib_exchange_listings.registration_id
      AND r.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their own listings"
  ON bib_exchange_listings FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM registrations r
      WHERE r.id = bib_exchange_listings.registration_id
      AND r.user_id = auth.uid()
    )
  );

CREATE POLICY "Organizers can manage all listings for their events"
  ON bib_exchange_listings FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM events e
      JOIN organizers o ON e.organizer_id = o.id
      WHERE e.id = bib_exchange_listings.event_id
      AND o.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM events e
      JOIN organizers o ON e.organizer_id = o.id
      WHERE e.id = bib_exchange_listings.event_id
      AND o.user_id = auth.uid()
    )
  );
