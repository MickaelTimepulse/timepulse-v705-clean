/*
  # Add custom sport type field to races

  1. Changes
    - Add `custom_sport_type` column to `races` table
      - Type: text, nullable
      - Used when sport_type = 'other' to store custom sport names
      - Examples: "Swimrun", "Course d'orientation", "Bike & Run", etc.

  2. Notes
    - When sport_type is 'other', custom_sport_type should contain the actual sport name
    - This allows organizers to define sports not in the predefined list
    - The custom name will be displayed in listings and race details
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'races' AND column_name = 'custom_sport_type'
  ) THEN
    ALTER TABLE races ADD COLUMN custom_sport_type text;
  END IF;
END $$;

COMMENT ON COLUMN races.custom_sport_type IS 'Custom sport type name when sport_type is "other"';
