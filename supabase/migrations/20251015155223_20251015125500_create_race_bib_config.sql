/*
  # Create race-level bib number configuration

  1. New Tables
    - `race_bib_config`
      - `id` (uuid, primary key)
      - `race_id` (uuid, unique foreign key to races)
      - `mode` (text) - 'LIVE' or 'BATCH'
      - `strategy` (text) - 'REG_ORDER' or 'ALPHABETICAL'
      - `range_global_from` (integer, nullable)
      - `range_global_to` (integer, nullable)
      - `range_male_from` (integer, nullable)
      - `range_male_to` (integer, nullable)
      - `range_female_from` (integer, nullable)
      - `range_female_to` (integer, nullable)
      - `reuse_freed_numbers` (boolean)
      - `lock_bibs_at` (timestamptz, nullable)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `race_bib_config` table
    - Organizers can manage config for their races
    - Public cannot access

  3. Constraints
    - race_id must be unique (one config per race)
    - Mode must be LIVE or BATCH
    - Strategy must be REG_ORDER or ALPHABETICAL
*/

CREATE TABLE IF NOT EXISTS race_bib_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  race_id uuid NOT NULL UNIQUE REFERENCES races(id) ON DELETE CASCADE,
  mode text NOT NULL DEFAULT 'BATCH' CHECK (mode IN ('LIVE', 'BATCH')),
  strategy text NOT NULL DEFAULT 'REG_ORDER' CHECK (strategy IN ('REG_ORDER', 'ALPHABETICAL')),
  range_global_from integer,
  range_global_to integer,
  range_male_from integer,
  range_male_to integer,
  range_female_from integer,
  range_female_to integer,
  reuse_freed_numbers boolean DEFAULT false,
  lock_bibs_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE race_bib_config ENABLE ROW LEVEL SECURITY;

-- Organizers can view config for their races
CREATE POLICY "Organizers can view their race bib config"
  ON race_bib_config
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM races
      JOIN events ON races.event_id = events.id
      JOIN organizers ON events.organizer_id = organizers.id
      WHERE races.id = race_bib_config.race_id
      AND organizers.user_id::text = auth.uid()::text
    )
  );

-- Organizers can manage config for their races
CREATE POLICY "Organizers can manage their race bib config"
  ON race_bib_config
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM races
      JOIN events ON races.event_id = events.id
      JOIN organizers ON events.organizer_id = organizers.id
      WHERE races.id = race_bib_config.race_id
      AND organizers.user_id::text = auth.uid()::text
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM races
      JOIN events ON races.event_id = events.id
      JOIN organizers ON events.organizer_id = organizers.id
      WHERE races.id = race_bib_config.race_id
      AND organizers.user_id::text = auth.uid()::text
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_race_bib_config_race ON race_bib_config(race_id);
