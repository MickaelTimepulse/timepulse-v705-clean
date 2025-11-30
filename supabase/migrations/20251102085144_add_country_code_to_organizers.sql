/*
  # Add country_code to organizers table
  
  1. Changes
    - Add country_code column to store ISO country code (FR, ES, IT, etc.)
    - This complements the existing 'country' column
  
  2. Notes
    - country_code is the 2-letter ISO code
    - country is the full country name
*/

-- Add country_code column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organizers' AND column_name = 'country_code'
  ) THEN
    ALTER TABLE organizers ADD COLUMN country_code text;
  END IF;
END $$;

COMMENT ON COLUMN organizers.country_code IS 'ISO 3166-1 alpha-2 country code (e.g., FR, ES, IT)';
