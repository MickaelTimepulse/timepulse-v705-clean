/*
  # Optimize Final RLS Policies - Bib Exchange & Carpooling (Correct Version)
  
  Optimize the remaining policies with correct column references.
  
  Tables:
  - carpooling_bookings (passenger_email)
  - bib_exchange_transfers (seller_registration_id, buyer_registration_id)
  - bib_exchange_listings (registration_id)
*/

-- =====================================================
-- CARPOOLING_BOOKINGS
-- =====================================================

DROP POLICY IF EXISTS "Passengers can cancel their own bookings" ON carpooling_bookings;
CREATE POLICY "Passengers can cancel their own bookings"
  ON carpooling_bookings FOR UPDATE
  TO authenticated
  USING (
    passenger_email = (
      SELECT email 
      FROM auth.users 
      WHERE id = (select auth.uid())
    )
  );

-- =====================================================
-- BIB_EXCHANGE_TRANSFERS
-- =====================================================

DROP POLICY IF EXISTS "Organizers can view all transfers" ON bib_exchange_transfers;
CREATE POLICY "Organizers can view all transfers"
  ON bib_exchange_transfers FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organizers o
      JOIN events e ON e.organizer_id = o.id
      WHERE e.id = bib_exchange_transfers.event_id
      AND o.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Sellers can view their transfers" ON bib_exchange_transfers;
CREATE POLICY "Sellers can view their transfers"
  ON bib_exchange_transfers FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM entries e
      JOIN athletes a ON a.id = e.athlete_id
      WHERE e.id = bib_exchange_transfers.seller_registration_id
      AND a.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Buyers can view their transfers" ON bib_exchange_transfers;
CREATE POLICY "Buyers can view their transfers"
  ON bib_exchange_transfers FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM entries e
      JOIN athletes a ON a.id = e.athlete_id
      WHERE e.id = bib_exchange_transfers.buyer_registration_id
      AND a.user_id = (select auth.uid())
    )
  );

-- =====================================================
-- BIB_EXCHANGE_LISTINGS
-- =====================================================

DROP POLICY IF EXISTS "Organizers can manage all listings for their events" ON bib_exchange_listings;
CREATE POLICY "Organizers can manage all listings for their events"
  ON bib_exchange_listings FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organizers o
      JOIN events e ON e.organizer_id = o.id
      WHERE e.id = bib_exchange_listings.event_id
      AND o.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can manage their own listings" ON bib_exchange_listings;
CREATE POLICY "Users can manage their own listings"
  ON bib_exchange_listings FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM entries e
      JOIN athletes a ON a.id = e.athlete_id
      WHERE e.id = bib_exchange_listings.registration_id
      AND a.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can create listings for their registrations" ON bib_exchange_listings;
CREATE POLICY "Users can create listings for their registrations"
  ON bib_exchange_listings FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 
      FROM entries e
      JOIN athletes a ON a.id = e.athlete_id
      WHERE e.id = bib_exchange_listings.registration_id
      AND a.user_id = (select auth.uid())
    )
  );

-- Add comments for documentation
COMMENT ON TABLE bib_exchange_listings IS 'RLS policies optimized with (select auth.uid()) pattern';
COMMENT ON TABLE bib_exchange_transfers IS 'RLS policies optimized with (select auth.uid()) pattern';
COMMENT ON TABLE carpooling_bookings IS 'RLS policies optimized with (select auth.uid()) pattern';
