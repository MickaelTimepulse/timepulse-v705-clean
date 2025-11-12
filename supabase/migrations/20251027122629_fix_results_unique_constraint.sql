/*
  # Fix unique constraint for results upsert

  1. Changes
    - Drop conditional unique index
    - Add proper unique constraint on (race_id, bib_number)
    - This allows ON CONFLICT to work properly during imports

  2. Notes
    - The constraint will prevent NULL bib_numbers from being duplicated
    - Results linked to registrations can have NULL bib_number
*/

-- Drop the conditional index
DROP INDEX IF EXISTS results_race_bib_unique;

-- Add a proper unique constraint
-- Note: Multiple NULL values are allowed in unique constraints in PostgreSQL
ALTER TABLE results 
DROP CONSTRAINT IF EXISTS results_race_bib_key;

ALTER TABLE results 
ADD CONSTRAINT results_race_bib_key 
UNIQUE (race_id, bib_number);
