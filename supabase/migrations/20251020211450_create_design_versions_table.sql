/*
  # Create design versions table

  1. New Tables
    - `design_versions`
      - `id` (uuid, primary key)
      - `version_number` (integer, unique) - Version identifier
      - `version_name` (text) - Descriptive name for the version
      - `description` (text) - Description of this design version
      - `theme_config` (jsonb) - Theme configuration (colors, fonts, spacing)
      - `component_styles` (jsonb) - Component-specific styles and layouts
      - `is_reference` (boolean) - Whether this is a reference version
      - `created_at` (timestamptz)
      - `created_by` (uuid) - Reference to admin who created it
      - `notes` (text) - Additional notes about this version

  2. Security
    - Enable RLS on `design_versions` table
    - Add policy for admins to read all versions
    - Add policy for admins to create new versions
    - Add policy for admins to update versions
*/

CREATE TABLE IF NOT EXISTS design_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version_number integer UNIQUE NOT NULL,
  version_name text NOT NULL,
  description text,
  theme_config jsonb DEFAULT '{}'::jsonb,
  component_styles jsonb DEFAULT '{}'::jsonb,
  is_reference boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  notes text
);

ALTER TABLE design_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read all design versions"
  ON design_versions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can create design versions"
  ON design_versions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update design versions"
  ON design_versions
  FOR UPDATE
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

CREATE INDEX idx_design_versions_number ON design_versions(version_number);
CREATE INDEX idx_design_versions_reference ON design_versions(is_reference) WHERE is_reference = true;