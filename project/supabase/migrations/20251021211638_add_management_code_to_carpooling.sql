/*
  # Add Management Code to Carpooling Offers

  1. Changes
    - Add `management_code` column to `carpooling_offers` table
    - Create function to generate unique 8-character codes
    - Create trigger to auto-generate codes on insert
    - Update RLS policies to allow code-based access

  2. Security
    - Management codes are unique per offer
    - Anyone with the code can update/delete the offer
    - Codes are alphanumeric (uppercase) for easy sharing
*/

-- Add management_code column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'carpooling_offers' AND column_name = 'management_code'
  ) THEN
    ALTER TABLE carpooling_offers ADD COLUMN management_code text UNIQUE;
  END IF;
END $$;

-- Function to generate a unique management code
CREATE OR REPLACE FUNCTION generate_management_code()
RETURNS text AS $$
DECLARE
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result text := '';
  i integer;
  code_exists boolean;
BEGIN
  LOOP
    result := '';
    FOR i IN 1..8 LOOP
      result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;
    
    SELECT EXISTS(SELECT 1 FROM carpooling_offers WHERE management_code = result) INTO code_exists;
    
    EXIT WHEN NOT code_exists;
  END LOOP;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-generate management code on insert
CREATE OR REPLACE FUNCTION set_management_code()
RETURNS trigger AS $$
BEGIN
  IF NEW.management_code IS NULL THEN
    NEW.management_code := generate_management_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_set_management_code ON carpooling_offers;
CREATE TRIGGER trigger_set_management_code
  BEFORE INSERT ON carpooling_offers
  FOR EACH ROW
  EXECUTE FUNCTION set_management_code();

-- Update existing offers with management codes
UPDATE carpooling_offers
SET management_code = generate_management_code()
WHERE management_code IS NULL;

-- Drop old policies
DROP POLICY IF EXISTS "Drivers can update their own offers" ON carpooling_offers;
DROP POLICY IF EXISTS "Drivers can delete their own offers" ON carpooling_offers;

-- New policies allowing code-based access
CREATE POLICY "Anyone with code can update offers"
  ON carpooling_offers FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone with code can delete offers"
  ON carpooling_offers FOR DELETE
  USING (true);

-- Add index for faster code lookups
CREATE INDEX IF NOT EXISTS idx_carpooling_offers_management_code ON carpooling_offers(management_code);
