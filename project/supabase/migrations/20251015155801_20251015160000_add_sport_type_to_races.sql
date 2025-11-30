/*
  # Add sport type field to races

  1. Changes
    - Add `sport_type` column to `races` table
      - Values: 'running', 'trail', 'triathlon', 'swimming', 'cycling', 'duathlon', 'swimrun', 'other'
      - Default: 'running'
    - This field will be used to display appropriate default images for each race type

  2. Notes
    - Helps categorize races by sport discipline
    - Enables automatic selection of appropriate default visuals
    - Supports SEO and filtering by sport type
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'races' AND column_name = 'sport_type'
  ) THEN
    ALTER TABLE races ADD COLUMN sport_type text NOT NULL DEFAULT 'running' 
    CHECK (sport_type IN ('running', 'trail', 'triathlon', 'swimming', 'cycling', 'duathlon', 'swimrun', 'other'));
  END IF;
END $$;

-- Create index for filtering by sport type
CREATE INDEX IF NOT EXISTS idx_races_sport_type ON races(sport_type);
