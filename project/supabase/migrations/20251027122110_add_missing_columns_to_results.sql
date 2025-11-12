/*
  # Add missing columns to results table for imports

  1. Changes
    - Add bib_number column
    - Add athlete_name column
    - Add gender column
    - Add category column
    - Add gun_time column
    - Add net_time column
    - Add import_source column
    - Add import_batch_id column
    - Add custom_fields column
    - Make registration_id nullable for imported results
    - Add unique constraint on race_id + bib_number

  2. Security
    - Maintains existing RLS policies
*/

-- Make registration_id nullable for imported results
ALTER TABLE results 
ALTER COLUMN registration_id DROP NOT NULL;

-- Add missing columns
ALTER TABLE results 
ADD COLUMN IF NOT EXISTS bib_number integer,
ADD COLUMN IF NOT EXISTS athlete_name text,
ADD COLUMN IF NOT EXISTS gender text CHECK (gender IN ('M', 'F')),
ADD COLUMN IF NOT EXISTS category text,
ADD COLUMN IF NOT EXISTS gun_time interval,
ADD COLUMN IF NOT EXISTS net_time interval,
ADD COLUMN IF NOT EXISTS import_source text,
ADD COLUMN IF NOT EXISTS import_batch_id uuid,
ADD COLUMN IF NOT EXISTS custom_fields jsonb DEFAULT '{}'::jsonb;

-- Add unique constraint for race_id + bib_number (for upsert during import)
CREATE UNIQUE INDEX IF NOT EXISTS results_race_bib_unique 
ON results(race_id, bib_number) 
WHERE bib_number IS NOT NULL;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS results_athlete_name_idx ON results(athlete_name);
CREATE INDEX IF NOT EXISTS results_import_batch_idx ON results(import_batch_id);
