/*
  # Add custom fields support to results table

  1. Changes
    - Add `custom_fields` (jsonb) column to results table to store additional fields
    - This allows storing any custom data from imports (average speed, split times with custom names, etc.)

  2. Notes
    - Uses JSONB for flexible schema
    - No impact on existing data (nullable column)
    - Can store any key-value pairs
*/

-- Add custom fields column to results table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'results' AND column_name = 'custom_fields'
  ) THEN
    ALTER TABLE results ADD COLUMN custom_fields jsonb DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- Create index for custom fields queries
CREATE INDEX IF NOT EXISTS idx_results_custom_fields ON results USING gin(custom_fields);

-- Comment
COMMENT ON COLUMN results.custom_fields IS 'Champs personnalisés pour données additionnelles d''import (vitesse moyenne, points de passage personnalisés, etc.)';
