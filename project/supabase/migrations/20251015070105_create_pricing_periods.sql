/*
  # Create pricing_periods table
  
  1. New Tables
    - `pricing_periods`
      - `id` (uuid, primary key)
      - `race_id` (uuid, foreign key to races)
      - `name` (text) - Nom de la période (Early Bird, Normal, Last Minute)
      - `start_date` (timestamptz) - Date de début de la période
      - `end_date` (timestamptz) - Date de fin de la période
      - `display_order` (integer) - Ordre d'affichage
      - `active` (boolean) - Si la période est active
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  
  2. Security
    - Enable RLS on `pricing_periods` table
    - Organizers can view/manage periods for their races
    - Admins have full access
    - Public can view active periods for open races
  
  3. Constraints
    - `end_date` must be after `start_date`
    - Cascade delete when race is deleted
  
  4. Notes
    - Periods can overlap intentionally (organizational choice)
    - Active flag allows disabling without deleting
    - Display order helps organize multiple periods
*/

CREATE TABLE IF NOT EXISTS pricing_periods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  race_id uuid NOT NULL REFERENCES races(id) ON DELETE CASCADE,
  name text NOT NULL,
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  display_order integer DEFAULT 0,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  CONSTRAINT valid_period_dates CHECK (end_date > start_date)
);

-- Enable RLS
ALTER TABLE pricing_periods ENABLE ROW LEVEL SECURITY;

-- Public can view active pricing periods for published races
CREATE POLICY "Anyone can view active pricing periods for published races"
  ON pricing_periods
  FOR SELECT
  USING (
    active = true
    AND EXISTS (
      SELECT 1 FROM races
      JOIN events ON races.event_id = events.id
      WHERE races.id = pricing_periods.race_id
      AND events.status = 'published'
    )
  );

-- Organizers can view all periods for their races
CREATE POLICY "Organizers can view their pricing periods"
  ON pricing_periods
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM races
      JOIN events ON races.event_id = events.id
      JOIN organizers ON events.organizer_id = organizers.id
      WHERE races.id = pricing_periods.race_id
      AND organizers.user_id::text = auth.uid()::text
    )
  );

-- Organizers can manage periods for their races
CREATE POLICY "Organizers can manage their pricing periods"
  ON pricing_periods
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM races
      JOIN events ON races.event_id = events.id
      JOIN organizers ON events.organizer_id = organizers.id
      WHERE races.id = pricing_periods.race_id
      AND organizers.user_id::text = auth.uid()::text
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM races
      JOIN events ON races.event_id = events.id
      JOIN organizers ON events.organizer_id = organizers.id
      WHERE races.id = pricing_periods.race_id
      AND organizers.user_id::text = auth.uid()::text
    )
  );

-- Admins have full access
CREATE POLICY "Admins can manage all pricing periods"
  ON pricing_periods
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
CREATE INDEX IF NOT EXISTS idx_pricing_periods_race ON pricing_periods(race_id);
CREATE INDEX IF NOT EXISTS idx_pricing_periods_active ON pricing_periods(active) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_pricing_periods_dates ON pricing_periods(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_pricing_periods_order ON pricing_periods(race_id, display_order);