/*
  # Create promo_codes table
  
  1. New Tables
    - `promo_codes`
      - `id` (uuid, primary key)
      - `event_id` (uuid, foreign key to events)
      - `race_id` (uuid, optional foreign key to races) - Si promo pour une épreuve spécifique
      - `code` (text, unique) - Code promotionnel
      - `description` (text, optional) - Description du code
      - `discount_type` (text) - percentage ou fixed_amount
      - `discount_value` (integer) - Valeur en % ou centimes
      - `usage_type` (text) - single, multiple, unlimited
      - `max_uses` (integer, optional) - Nombre max d'utilisations
      - `current_uses` (integer) - Compteur d'utilisations
      - `valid_from` (timestamptz, optional) - Date de début
      - `valid_until` (timestamptz, optional) - Date de fin
      - `license_type_id` (uuid, optional) - Si promo limitée à un type de licence
      - `min_price_cents` (integer) - Prix minimum après réduction
      - `active` (boolean) - Si le code est actif
      - `created_by` (uuid, foreign key to organizers)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  
  2. Security
    - Enable RLS on `promo_codes` table
    - Public can validate active codes
    - Organizers can manage codes for their events
    - Admins have full access
  
  3. Constraints
    - code must be unique
    - discount_value must be > 0
    - valid_until > valid_from if both set
    - usage_type requires max_uses unless unlimited
  
  4. Notes
    - Codes stored in uppercase for consistency
    - Supports both percentage and fixed amount discounts
    - Usage tracking built-in
*/

CREATE TABLE IF NOT EXISTS promo_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  race_id uuid REFERENCES races(id) ON DELETE CASCADE,
  code text UNIQUE NOT NULL,
  description text,
  discount_type text NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount')),
  discount_value integer NOT NULL CHECK (discount_value > 0),
  usage_type text NOT NULL CHECK (usage_type IN ('single', 'multiple', 'unlimited')),
  max_uses integer,
  current_uses integer DEFAULT 0,
  valid_from timestamptz,
  valid_until timestamptz,
  license_type_id uuid REFERENCES license_types(id) ON DELETE CASCADE,
  min_price_cents integer DEFAULT 0,
  active boolean DEFAULT true,
  created_by uuid REFERENCES organizers(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  CONSTRAINT valid_promo_dates CHECK (valid_until IS NULL OR valid_from IS NULL OR valid_until > valid_from),
  CONSTRAINT valid_usage_limit CHECK (usage_type = 'unlimited' OR max_uses IS NOT NULL)
);

-- Enable RLS
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;

-- Public can validate active promo codes for published events
CREATE POLICY "Anyone can validate active promo codes"
  ON promo_codes
  FOR SELECT
  USING (
    active = true
    AND EXISTS (
      SELECT 1 FROM events
      WHERE events.id = promo_codes.event_id
      AND events.status IN ('published', 'open')
    )
  );

-- Organizers can view all promo codes for their events
CREATE POLICY "Organizers can view their promo codes"
  ON promo_codes
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM events
      JOIN organizers ON events.organizer_id = organizers.id
      WHERE events.id = promo_codes.event_id
      AND organizers.user_id::text = auth.uid()::text
    )
  );

-- Organizers can manage promo codes for their events
CREATE POLICY "Organizers can manage their promo codes"
  ON promo_codes
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM events
      JOIN organizers ON events.organizer_id = organizers.id
      WHERE events.id = promo_codes.event_id
      AND organizers.user_id::text = auth.uid()::text
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM events
      JOIN organizers ON events.organizer_id = organizers.id
      WHERE events.id = promo_codes.event_id
      AND organizers.user_id::text = auth.uid()::text
    )
  );

-- Admins have full access
CREATE POLICY "Admins can manage all promo codes"
  ON promo_codes
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
CREATE INDEX IF NOT EXISTS idx_promo_codes_event ON promo_codes(event_id);
CREATE INDEX IF NOT EXISTS idx_promo_codes_race ON promo_codes(race_id);
CREATE INDEX IF NOT EXISTS idx_promo_codes_code ON promo_codes(code) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_promo_codes_active ON promo_codes(event_id, active) WHERE active = true;