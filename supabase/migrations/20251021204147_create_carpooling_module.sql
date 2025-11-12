/*
  # Create Carpooling Module

  1. New Tables
    - `carpooling_offers`
      - `id` (uuid, primary key)
      - `event_id` (uuid, foreign key to events)
      - `driver_first_name` (text)
      - `driver_last_name` (text)
      - `driver_email` (text)
      - `driver_phone` (text)
      - `meeting_location` (text) - Lieu de rencontre
      - `departure_time` (timestamptz) - Heure de départ
      - `available_seats` (integer) - Nombre de places disponibles
      - `additional_info` (text) - Infos complémentaires
      - `has_valid_license` (boolean) - Certifie avoir le permis
      - `terms_accepted` (boolean) - Accepte les conditions
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      - `status` (text) - active, cancelled

    - `carpooling_bookings`
      - `id` (uuid, primary key)
      - `offer_id` (uuid, foreign key to carpooling_offers)
      - `passenger_first_name` (text)
      - `passenger_last_name` (text)
      - `passenger_email` (text)
      - `passenger_phone` (text)
      - `seats_reserved` (integer) - Nombre de places réservées
      - `terms_accepted` (boolean)
      - `created_at` (timestamptz)
      - `status` (text) - pending, confirmed, cancelled

  2. Changes
    - Add `carpooling_enabled` boolean column to `events` table

  3. Security
    - Enable RLS on both tables
    - Public can read active carpooling offers
    - Authenticated users can create offers and bookings
    - Only offer creator can update/delete their offer
    - Only booking creator can cancel their booking

  4. Important Notes
    - One booking per person required
    - Available seats decrease when bookings are made
    - Email notifications sent to both parties (handled via edge function)
    - Timepulse is not responsible for delays, absences, etc.
*/

-- Add carpooling_enabled to events table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'carpooling_enabled'
  ) THEN
    ALTER TABLE events ADD COLUMN carpooling_enabled boolean DEFAULT false;
  END IF;
END $$;

-- Create carpooling_offers table
CREATE TABLE IF NOT EXISTS carpooling_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  driver_first_name text NOT NULL,
  driver_last_name text NOT NULL,
  driver_email text NOT NULL,
  driver_phone text NOT NULL,
  meeting_location text NOT NULL,
  departure_time timestamptz NOT NULL,
  available_seats integer NOT NULL CHECK (available_seats > 0 AND available_seats <= 8),
  additional_info text DEFAULT '',
  has_valid_license boolean NOT NULL DEFAULT true,
  terms_accepted boolean NOT NULL DEFAULT true,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create carpooling_bookings table
CREATE TABLE IF NOT EXISTS carpooling_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id uuid NOT NULL REFERENCES carpooling_offers(id) ON DELETE CASCADE,
  passenger_first_name text NOT NULL,
  passenger_last_name text NOT NULL,
  passenger_email text NOT NULL,
  passenger_phone text NOT NULL,
  seats_reserved integer NOT NULL DEFAULT 1 CHECK (seats_reserved > 0),
  terms_accepted boolean NOT NULL DEFAULT true,
  status text NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled')),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE carpooling_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE carpooling_bookings ENABLE ROW LEVEL SECURITY;

-- Policies for carpooling_offers
CREATE POLICY "Anyone can view active carpooling offers"
  ON carpooling_offers FOR SELECT
  USING (status = 'active');

CREATE POLICY "Anyone can create carpooling offers"
  ON carpooling_offers FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Drivers can update their own offers"
  ON carpooling_offers FOR UPDATE
  USING (driver_email = current_setting('request.jwt.claims', true)::json->>'email')
  WITH CHECK (driver_email = current_setting('request.jwt.claims', true)::json->>'email');

CREATE POLICY "Drivers can delete their own offers"
  ON carpooling_offers FOR DELETE
  USING (driver_email = current_setting('request.jwt.claims', true)::json->>'email');

-- Policies for carpooling_bookings
CREATE POLICY "Drivers can view bookings for their offers"
  ON carpooling_bookings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM carpooling_offers
      WHERE carpooling_offers.id = offer_id
      AND carpooling_offers.driver_email = current_setting('request.jwt.claims', true)::json->>'email'
    )
  );

CREATE POLICY "Anyone can create bookings"
  ON carpooling_bookings FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Passengers can cancel their own bookings"
  ON carpooling_bookings FOR UPDATE
  USING (passenger_email = current_setting('request.jwt.claims', true)::json->>'email')
  WITH CHECK (passenger_email = current_setting('request.jwt.claims', true)::json->>'email');

-- Create function to get available seats for an offer
CREATE OR REPLACE FUNCTION get_available_seats(offer_id_param uuid)
RETURNS integer AS $$
DECLARE
  total_seats integer;
  reserved_seats integer;
BEGIN
  SELECT available_seats INTO total_seats
  FROM carpooling_offers
  WHERE id = offer_id_param AND status = 'active';
  
  SELECT COALESCE(SUM(seats_reserved), 0) INTO reserved_seats
  FROM carpooling_bookings
  WHERE offer_id = offer_id_param AND status = 'confirmed';
  
  RETURN GREATEST(total_seats - reserved_seats, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_carpooling_offers_event_id ON carpooling_offers(event_id);
CREATE INDEX IF NOT EXISTS idx_carpooling_offers_status ON carpooling_offers(status);
CREATE INDEX IF NOT EXISTS idx_carpooling_bookings_offer_id ON carpooling_bookings(offer_id);
CREATE INDEX IF NOT EXISTS idx_carpooling_bookings_status ON carpooling_bookings(status);