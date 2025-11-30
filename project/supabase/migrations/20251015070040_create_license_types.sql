/*
  # Create license_types table
  
  1. New Tables
    - `license_types`
      - `id` (uuid, primary key)
      - `code` (text, unique) - Code court pour identification (FFA, FFTRI, etc.)
      - `name` (text) - Nom complet de la licence
      - `federation` (text) - Nom de la fédération
      - `description` (text, optional) - Description
      - `active` (boolean) - Si la licence est active
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  
  2. Security
    - Enable RLS on `license_types` table
    - Add policy for public read access (needed for registration forms)
    - Add policy for admin write access
  
  3. Default Data
    - Insert standard French sports licenses (FFA, FFTRI, FFME, UFOLEP, NON_LIC)
  
  4. Notes
    - Table designed for easy extension with new license types
    - `active` flag allows soft deletion of obsolete licenses
    - Public read access for registration forms
*/

CREATE TABLE IF NOT EXISTS license_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  federation text NOT NULL,
  description text,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE license_types ENABLE ROW LEVEL SECURITY;

-- Public can read active license types (for registration forms)
CREATE POLICY "Anyone can view active license types"
  ON license_types
  FOR SELECT
  USING (active = true);

-- Only admins can insert/update/delete license types
CREATE POLICY "Admins can manage license types"
  ON license_types
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

-- Insert default license types
INSERT INTO license_types (code, name, federation, description) VALUES
  ('FFA', 'Licence FFA', 'Fédération Française d''Athlétisme', 'Licence athlétisme course sur route et trail'),
  ('FFTRI', 'Licence Triathlon', 'Fédération Française de Triathlon', 'Licence pour les épreuves de triathlon et disciplines enchaînées'),
  ('FFME', 'Licence Montagne et Escalade', 'Fédération Française de Montagne et Escalade', 'Licence pour les épreuves en montagne et trail'),
  ('UFOLEP', 'Licence UFOLEP', 'Union Française des Œuvres Laïques d''Éducation Physique', 'Licence multisports UFOLEP'),
  ('FSGT', 'Licence FSGT', 'Fédération Sportive et Gymnique du Travail', 'Licence multisports FSGT'),
  ('NON_LIC', 'Non licencié', 'Aucune', 'Participant sans licence fédérale (certificat médical obligatoire)')
ON CONFLICT (code) DO NOTHING;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_license_types_active ON license_types(active) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_license_types_code ON license_types(code);