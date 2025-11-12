/*
  # Add Detailed Address Fields to Carpooling Offers

  1. Changes
    - Add `meeting_address` column to `carpooling_offers` table (street address)
    - Add `meeting_city` column to `carpooling_offers` table
    - Add `meeting_postal_code` column to `carpooling_offers` table
    - Keep `meeting_location` as a general description field

  2. Notes
    - These fields will improve geocoding precision
    - meeting_location becomes optional description (e.g., "Parking Carrefour")
    - Full address will be: meeting_address, meeting_postal_code meeting_city
*/

-- Add detailed address fields to carpooling_offers
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'carpooling_offers' AND column_name = 'meeting_address'
  ) THEN
    ALTER TABLE carpooling_offers ADD COLUMN meeting_address text NOT NULL DEFAULT '';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'carpooling_offers' AND column_name = 'meeting_city'
  ) THEN
    ALTER TABLE carpooling_offers ADD COLUMN meeting_city text NOT NULL DEFAULT '';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'carpooling_offers' AND column_name = 'meeting_postal_code'
  ) THEN
    ALTER TABLE carpooling_offers ADD COLUMN meeting_postal_code text NOT NULL DEFAULT '';
  END IF;
END $$;

-- Update existing records to split meeting_location into parts if possible
-- For now, we'll just set empty strings as defaults, organizers can update them
UPDATE carpooling_offers
SET 
  meeting_address = '',
  meeting_city = '',
  meeting_postal_code = ''
WHERE meeting_address IS NULL OR meeting_city IS NULL OR meeting_postal_code IS NULL;

-- Create index for faster city searches
CREATE INDEX IF NOT EXISTS idx_carpooling_offers_meeting_city ON carpooling_offers(meeting_city);
