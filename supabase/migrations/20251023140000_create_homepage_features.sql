/*
  # Create homepage features table
  
  1. New Tables
    - `homepage_features`
      - `id` (uuid, primary key)
      - `title` (text) - Feature title
      - `description` (text) - Feature description
      - `icon` (text) - Lucide icon name
      - `background_image_url` (text, nullable) - Background image URL
      - `image_opacity` (numeric) - Background image opacity (0-100)
      - `display_order` (integer) - Order for display
      - `is_active` (boolean) - Whether feature is shown
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  
  2. Security
    - Enable RLS on `homepage_features` table
    - Public read access for active features
    - Admin-only write access
  
  3. Initial Data
    - Seed with 6 default features (Sécurisé, Instantané, Simple, Professionnel, Disponible 24/7, Tous moyens de paiement)
*/

-- Create homepage_features table
CREATE TABLE IF NOT EXISTS homepage_features (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  icon text NOT NULL DEFAULT 'Star',
  background_image_url text,
  image_opacity numeric DEFAULT 20 CHECK (image_opacity >= 0 AND image_opacity <= 100),
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create index for ordering
CREATE INDEX IF NOT EXISTS idx_homepage_features_order ON homepage_features(display_order, is_active);

-- Enable RLS
ALTER TABLE homepage_features ENABLE ROW LEVEL SECURITY;

-- Public can view active features
CREATE POLICY "Public can view active features"
  ON homepage_features
  FOR SELECT
  TO public
  USING (is_active = true);

-- Admin can manage features
CREATE POLICY "Admin users can manage features"
  ON homepage_features
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_homepage_features_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER homepage_features_updated_at
  BEFORE UPDATE ON homepage_features
  FOR EACH ROW
  EXECUTE FUNCTION update_homepage_features_updated_at();

-- Seed default features
INSERT INTO homepage_features (title, description, icon, display_order) VALUES
  ('Sécurisé', 'Paiement sécurisé et données protégées', 'Shield', 1),
  ('Instantané', 'Confirmation immédiate par email', 'Zap', 2),
  ('Simple', 'Inscription en quelques clics', 'Users', 3),
  ('Professionnel', 'Chronométrage de qualité depuis 2009', 'Award', 4),
  ('Disponible 24/7', 'Inscrivez-vous à tout moment', 'Clock', 5),
  ('Tous moyens de paiement', 'CB, virement, chèque acceptés', 'CreditCard', 6)
ON CONFLICT DO NOTHING;
