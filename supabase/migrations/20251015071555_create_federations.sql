/*
  # Create federations table
  
  1. New Tables
    - `federations`
      - `id` (uuid, primary key)
      - `code` (text, unique) - Code court (FFA, FFTRI, UGSEL, UFOLEP, UNSS)
      - `name` (text) - Nom complet de la fédération
      - `short_name` (text) - Nom court
      - `logo_url` (text) - URL du logo de la fédération
      - `website` (text, optional) - Site web officiel
      - `has_api` (boolean) - Si une API de vérification licence existe
      - `api_endpoint` (text, optional) - URL de l'API si disponible
      - `description` (text, optional)
      - `active` (boolean) - Si la fédération est active
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  
  2. Security
    - Enable RLS on `federations` table
    - Public read access (needed for registration and organizer forms)
    - Only admins can manage federations
  
  3. Default Data
    - Insert French sports federations (FFA, FFTRI, UGSEL, UFOLEP, UNSS)
    - FFA and FFTRI marked as having API
  
  4. Notes
    - FFA and FFTRI have real-time license verification APIs
    - Logo URLs will be added when logos are uploaded
    - Designed for easy extension with new federations
*/

CREATE TABLE IF NOT EXISTS federations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  short_name text NOT NULL,
  logo_url text,
  website text,
  has_api boolean DEFAULT false,
  api_endpoint text,
  description text,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE federations ENABLE ROW LEVEL SECURITY;

-- Public can read active federations
CREATE POLICY "Anyone can view active federations"
  ON federations
  FOR SELECT
  USING (active = true);

-- Only admins can manage federations
CREATE POLICY "Admins can manage federations"
  ON federations
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

-- Insert default federations
INSERT INTO federations (code, name, short_name, has_api, website, description) VALUES
  (
    'FFA', 
    'Fédération Française d''Athlétisme', 
    'FFA',
    true,
    'https://www.athle.fr',
    'Fédération française d''athlétisme - Course sur route, trail, cross-country'
  ),
  (
    'FFTRI', 
    'Fédération Française de Triathlon', 
    'FFTRI',
    true,
    'https://www.fftri.com',
    'Fédération française de triathlon - Triathlon, duathlon, aquathlon, swimrun'
  ),
  (
    'UGSEL', 
    'Union Générale Sportive de l''Enseignement Libre', 
    'UGSEL',
    false,
    'https://www.ugsel.org',
    'Fédération sportive scolaire de l''enseignement catholique'
  ),
  (
    'UFOLEP', 
    'Union Française des Œuvres Laïques d''Éducation Physique', 
    'UFOLEP',
    false,
    'https://www.ufolep.org',
    'Fédération multisports affinitaire et sociale'
  ),
  (
    'UNSS', 
    'Union Nationale du Sport Scolaire', 
    'UNSS',
    false,
    'https://www.unss.org',
    'Fédération française de sport scolaire'
  )
ON CONFLICT (code) DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_federations_active ON federations(active) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_federations_code ON federations(code);
CREATE INDEX IF NOT EXISTS idx_federations_has_api ON federations(has_api) WHERE has_api = true;