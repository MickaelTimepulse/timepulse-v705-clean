/*
  # Create bib_number_config table
  
  1. New Tables
    - `bib_number_config`
      - `id` (uuid, primary key)
      - `event_id` (uuid, unique foreign key to events) - Un seul config par événement
      - `auto_assign` (boolean) - Attribution automatique des dossards
      - `range_start` (integer) - Début de plage globale
      - `range_end` (integer) - Fin de plage globale
      - `assignment_strategy` (text) - sequential, by_gender, by_category, by_race, manual
      - `male_range_start` (integer, optional) - Plage hommes
      - `male_range_end` (integer, optional)
      - `female_range_start` (integer, optional) - Plage femmes
      - `female_range_end` (integer, optional)
      - `lock_date` (timestamptz, optional) - Date de verrouillage automatique
      - `locked_by` (uuid, optional foreign key to admin_users) - Admin ayant verrouillé
      - `locked_at` (timestamptz, optional) - Date du verrouillage manuel
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  
  2. Security
    - Enable RLS on `bib_number_config` table
    - Organizers can view/manage config for their events
    - Only admins can lock/unlock manually
    - Public cannot access
  
  3. Constraints
    - event_id must be unique (one config per event)
    - range_end > range_start
    - If by_gender strategy, gender ranges must be set
  
  4. Notes
    - Critical for race day operations
    - Lock mechanism prevents last-minute changes
    - Supports multiple assignment strategies
    - Designed for import: can assign ranges before auto-assign activation
*/

CREATE TABLE IF NOT EXISTS bib_number_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL UNIQUE REFERENCES events(id) ON DELETE CASCADE,
  auto_assign boolean DEFAULT false,
  range_start integer NOT NULL DEFAULT 1,
  range_end integer NOT NULL DEFAULT 9999,
  assignment_strategy text NOT NULL DEFAULT 'sequential' CHECK (assignment_strategy IN ('sequential', 'by_gender', 'by_category', 'by_race', 'manual')),
  male_range_start integer,
  male_range_end integer,
  female_range_start integer,
  female_range_end integer,
  lock_date timestamptz,
  locked_by uuid REFERENCES admin_users(id) ON DELETE SET NULL,
  locked_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  CONSTRAINT valid_range CHECK (range_end > range_start),
  CONSTRAINT valid_gender_ranges CHECK (
    (assignment_strategy != 'by_gender') OR
    (male_range_start IS NOT NULL AND male_range_end IS NOT NULL AND
     female_range_start IS NOT NULL AND female_range_end IS NOT NULL)
  )
);

-- Enable RLS
ALTER TABLE bib_number_config ENABLE ROW LEVEL SECURITY;

-- Organizers can view config for their events
CREATE POLICY "Organizers can view their bib config"
  ON bib_number_config
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM events
      JOIN organizers ON events.organizer_id = organizers.id
      WHERE events.id = bib_number_config.event_id
      AND organizers.user_id::text = auth.uid()::text
    )
  );

-- Organizers can manage config for their events (unless locked)
CREATE POLICY "Organizers can manage their bib config if not locked"
  ON bib_number_config
  FOR ALL
  TO authenticated
  USING (
    locked_at IS NULL
    AND EXISTS (
      SELECT 1 FROM events
      JOIN organizers ON events.organizer_id = organizers.id
      WHERE events.id = bib_number_config.event_id
      AND organizers.user_id::text = auth.uid()::text
    )
  )
  WITH CHECK (
    locked_at IS NULL
    AND EXISTS (
      SELECT 1 FROM events
      JOIN organizers ON events.organizer_id = organizers.id
      WHERE events.id = bib_number_config.event_id
      AND organizers.user_id::text = auth.uid()::text
    )
  );

-- Admins have full access (including locked configs)
CREATE POLICY "Admins can manage all bib configs"
  ON bib_number_config
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id::text = auth.uid()::text
      AND admin_users.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id::text = auth.uid()::text
      AND admin_users.is_active = true
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_bib_config_event ON bib_number_config(event_id);
CREATE INDEX IF NOT EXISTS idx_bib_config_locked ON bib_number_config(locked_at) WHERE locked_at IS NOT NULL;