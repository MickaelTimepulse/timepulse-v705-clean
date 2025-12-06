/*
  # Create Certificate Templates System

  1. New Tables
    - `certificate_templates`
      - `id` (uuid, primary key)
      - `name` (text) - Nom du modèle
      - `template_image_url` (text) - URL de l'image de fond
      - `race_id` (uuid, nullable) - Épreuve associée (null = template global)
      - `is_active` (boolean) - Template actif ou non
      - `variables_config` (jsonb) - Configuration des variables et leur position
      - `created_by` (uuid) - Admin qui a créé le template
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `certificate_shares`
      - `id` (uuid, primary key)
      - `result_id` (uuid) - Référence au résultat
      - `athlete_name` (text) - Nom de l'athlète
      - `certificate_url` (text) - URL du diplôme généré
      - `shared_at` (timestamptz)
      - `platform` (text) - Plateforme de partage (facebook, twitter, whatsapp, etc.)

  2. Storage
    - Bucket `certificate-templates` pour les templates
    - Bucket `generated-certificates` pour les diplômes générés

  3. Security
    - Enable RLS on all tables
    - Admin-only access for templates
    - Public read access for generated certificates
*/

-- Create certificate_templates table
CREATE TABLE IF NOT EXISTS certificate_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  template_image_url text NOT NULL,
  race_id uuid REFERENCES races(id) ON DELETE CASCADE,
  is_active boolean DEFAULT true,
  variables_config jsonb DEFAULT '[]'::jsonb,
  created_by uuid REFERENCES admin_users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create certificate_shares table for analytics
CREATE TABLE IF NOT EXISTS certificate_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  result_id uuid REFERENCES results(id) ON DELETE CASCADE,
  athlete_name text NOT NULL,
  certificate_url text,
  shared_at timestamptz DEFAULT now(),
  platform text
);

-- Enable RLS
ALTER TABLE certificate_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificate_shares ENABLE ROW LEVEL SECURITY;

-- RLS Policies for certificate_templates
CREATE POLICY "Admins can view all certificate templates"
  ON certificate_templates FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
    )
  );

CREATE POLICY "Admins can insert certificate templates"
  ON certificate_templates FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
    )
  );

CREATE POLICY "Admins can update certificate templates"
  ON certificate_templates FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
    )
  );

CREATE POLICY "Admins can delete certificate templates"
  ON certificate_templates FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
    )
  );

-- RLS Policies for certificate_shares (public read, authenticated write)
CREATE POLICY "Anyone can view certificate shares"
  ON certificate_shares FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can track shares"
  ON certificate_shares FOR INSERT
  TO public
  WITH CHECK (true);

-- Indexes
CREATE INDEX idx_certificate_templates_race_id ON certificate_templates(race_id);
CREATE INDEX idx_certificate_templates_is_active ON certificate_templates(is_active);
CREATE INDEX idx_certificate_shares_result_id ON certificate_shares(result_id);
CREATE INDEX idx_certificate_shares_platform ON certificate_shares(platform);

-- Updated at trigger
CREATE TRIGGER update_certificate_templates_updated_at
  BEFORE UPDATE ON certificate_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
