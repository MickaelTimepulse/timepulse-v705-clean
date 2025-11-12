/*
  # Create organizer_federations junction table
  
  1. New Tables
    - `organizer_federations`
      - `id` (uuid, primary key)
      - `organizer_id` (uuid, foreign key to organizers)
      - `federation_id` (uuid, foreign key to federations)
      - `license_number` (text, optional) - Numéro de licence/affiliation de l'organisation
      - `affiliation_date` (date, optional) - Date d'affiliation
      - `is_primary` (boolean) - Si c'est la fédération principale
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  
  2. Security
    - Enable RLS on `organizer_federations` table
    - Organizers can view/manage their own federations
    - Admins have full access
    - Public cannot access
  
  3. Constraints
    - Unique combination (organizer_id, federation_id)
    - Only one primary federation per organizer
    - Cascade delete when organizer or federation is deleted
  
  4. Notes
    - Many-to-many relationship: one organizer can be affiliated with multiple federations
    - The is_primary flag indicates the main federation (displayed prominently)
    - License number stores the organizer's affiliation number with the federation
*/

CREATE TABLE IF NOT EXISTS organizer_federations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id uuid NOT NULL REFERENCES organizers(id) ON DELETE CASCADE,
  federation_id uuid NOT NULL REFERENCES federations(id) ON DELETE CASCADE,
  license_number text,
  affiliation_date date,
  is_primary boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(organizer_id, federation_id)
);

-- Enable RLS
ALTER TABLE organizer_federations ENABLE ROW LEVEL SECURITY;

-- Organizers can view their own federation affiliations
CREATE POLICY "Organizers can view their federations"
  ON organizer_federations
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organizers
      WHERE organizers.id = organizer_federations.organizer_id
      AND organizers.user_id::text = auth.uid()::text
    )
  );

-- Organizers can manage their own federation affiliations
CREATE POLICY "Organizers can manage their federations"
  ON organizer_federations
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organizers
      WHERE organizers.id = organizer_federations.organizer_id
      AND organizers.user_id::text = auth.uid()::text
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organizers
      WHERE organizers.id = organizer_federations.organizer_id
      AND organizers.user_id::text = auth.uid()::text
    )
  );

-- Admins have full access
CREATE POLICY "Admins can manage all organizer federations"
  ON organizer_federations
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
CREATE INDEX IF NOT EXISTS idx_organizer_federations_organizer ON organizer_federations(organizer_id);
CREATE INDEX IF NOT EXISTS idx_organizer_federations_federation ON organizer_federations(federation_id);
CREATE INDEX IF NOT EXISTS idx_organizer_federations_primary ON organizer_federations(organizer_id, is_primary) WHERE is_primary = true;

-- Function to ensure only one primary federation per organizer
CREATE OR REPLACE FUNCTION ensure_single_primary_federation()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_primary = true THEN
    -- Set all other federations for this organizer to not primary
    UPDATE organizer_federations
    SET is_primary = false
    WHERE organizer_id = NEW.organizer_id
    AND id != NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to enforce single primary federation
DROP TRIGGER IF EXISTS trigger_ensure_single_primary_federation ON organizer_federations;
CREATE TRIGGER trigger_ensure_single_primary_federation
  BEFORE INSERT OR UPDATE ON organizer_federations
  FOR EACH ROW
  EXECUTE FUNCTION ensure_single_primary_federation();