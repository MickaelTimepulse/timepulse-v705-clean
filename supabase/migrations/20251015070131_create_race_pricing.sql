/*
  # Create race_pricing table
  
  1. New Tables
    - `race_pricing`
      - `id` (uuid, primary key)
      - `race_id` (uuid, foreign key to races)
      - `pricing_period_id` (uuid, foreign key to pricing_periods)
      - `license_type_id` (uuid, foreign key to license_types)
      - `price_cents` (integer) - Prix en centimes d'euros
      - `max_registrations` (integer, optional) - Quota pour cette combinaison
      - `license_valid_until` (date, optional) - Date limite pour cette licence
      - `active` (boolean) - Si ce tarif est actif
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  
  2. Security
    - Enable RLS on `race_pricing` table
    - Public can view active pricing for published races
    - Organizers can manage pricing for their races
    - Admins have full access
  
  3. Constraints
    - Unique combination of (race_id, pricing_period_id, license_type_id)
    - Price must be >= 0
    - Cascade delete when race, period, or license type is deleted
  
  4. Notes
    - Prices stored in cents to avoid floating point issues
    - max_registrations allows quotas per license type
    - license_valid_until allows time-limited license acceptance
*/

CREATE TABLE IF NOT EXISTS race_pricing (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  race_id uuid NOT NULL REFERENCES races(id) ON DELETE CASCADE,
  pricing_period_id uuid NOT NULL REFERENCES pricing_periods(id) ON DELETE CASCADE,
  license_type_id uuid NOT NULL REFERENCES license_types(id) ON DELETE CASCADE,
  price_cents integer NOT NULL CHECK (price_cents >= 0),
  max_registrations integer,
  license_valid_until date,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(race_id, pricing_period_id, license_type_id)
);

-- Enable RLS
ALTER TABLE race_pricing ENABLE ROW LEVEL SECURITY;

-- Public can view active pricing for published races
CREATE POLICY "Anyone can view active race pricing for published races"
  ON race_pricing
  FOR SELECT
  USING (
    active = true
    AND EXISTS (
      SELECT 1 FROM races
      JOIN events ON races.event_id = events.id
      WHERE races.id = race_pricing.race_id
      AND events.status = 'published'
    )
  );

-- Organizers can view all pricing for their races
CREATE POLICY "Organizers can view their race pricing"
  ON race_pricing
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM races
      JOIN events ON races.event_id = events.id
      JOIN organizers ON events.organizer_id = organizers.id
      WHERE races.id = race_pricing.race_id
      AND organizers.user_id::text = auth.uid()::text
    )
  );

-- Organizers can manage pricing for their races
CREATE POLICY "Organizers can manage their race pricing"
  ON race_pricing
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM races
      JOIN events ON races.event_id = events.id
      JOIN organizers ON events.organizer_id = organizers.id
      WHERE races.id = race_pricing.race_id
      AND organizers.user_id::text = auth.uid()::text
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM races
      JOIN events ON races.event_id = events.id
      JOIN organizers ON events.organizer_id = organizers.id
      WHERE races.id = race_pricing.race_id
      AND organizers.user_id::text = auth.uid()::text
    )
  );

-- Admins have full access
CREATE POLICY "Admins can manage all race pricing"
  ON race_pricing
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
CREATE INDEX IF NOT EXISTS idx_race_pricing_race ON race_pricing(race_id);
CREATE INDEX IF NOT EXISTS idx_race_pricing_period ON race_pricing(pricing_period_id);
CREATE INDEX IF NOT EXISTS idx_race_pricing_license ON race_pricing(license_type_id);
CREATE INDEX IF NOT EXISTS idx_race_pricing_active ON race_pricing(active) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_race_pricing_composite ON race_pricing(race_id, pricing_period_id, license_type_id) WHERE active = true;