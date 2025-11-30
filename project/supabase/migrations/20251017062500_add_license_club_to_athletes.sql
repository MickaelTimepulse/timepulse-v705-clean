/*
  # Add license club field to athletes

  1. Changes
    - Add `license_club` column to athletes table to store the club name
    - Column is optional (nullable) and can store up to 200 characters
  
  2. Notes
    - This field will store the name of the sports club associated with the athlete's license
    - Example values: "Athletic Club de Paris", "AS Monaco Triathlon", etc.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'athletes' AND column_name = 'license_club'
  ) THEN
    ALTER TABLE athletes ADD COLUMN license_club VARCHAR(200);
  END IF;
END $$;
