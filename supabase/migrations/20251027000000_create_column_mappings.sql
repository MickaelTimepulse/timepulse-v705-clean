/*
  # Create column mappings table for results import

  1. New Tables
    - `column_mappings`
      - `id` (uuid, primary key)
      - `name` (text) - Template name
      - `description` (text) - Description of the mapping
      - `file_format` (text) - csv, excel, elogica, ffa-text, html
      - `separator` (text) - Field separator (for CSV)
      - `mapping` (jsonb) - Column mapping configuration
      - `is_global` (boolean) - Available to all users
      - `created_by` (uuid) - User who created the mapping
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS
    - Users can read their own mappings and global mappings
    - Users can create/update their own mappings
    - Only admins can create global mappings
*/

CREATE TABLE IF NOT EXISTS column_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  file_format text NOT NULL CHECK (file_format IN ('csv', 'excel', 'elogica', 'ffa-text', 'html')),
  separator text DEFAULT ',',
  mapping jsonb NOT NULL,
  is_global boolean DEFAULT false,
  created_by uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(name, created_by)
);

ALTER TABLE column_mappings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own mappings"
  ON column_mappings
  FOR SELECT
  TO authenticated
  USING (created_by = auth.uid() OR is_global = true);

CREATE POLICY "Users can create their own mappings"
  ON column_mappings
  FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their own mappings"
  ON column_mappings
  FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can delete their own mappings"
  ON column_mappings
  FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());

CREATE POLICY "Admins can manage global mappings"
  ON column_mappings
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.role IN ('super_admin', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.role IN ('super_admin', 'admin')
    )
  );

CREATE INDEX IF NOT EXISTS idx_column_mappings_created_by ON column_mappings(created_by);
CREATE INDEX IF NOT EXISTS idx_column_mappings_is_global ON column_mappings(is_global);
CREATE INDEX IF NOT EXISTS idx_column_mappings_file_format ON column_mappings(file_format);

-- Insert some default global mappings
INSERT INTO column_mappings (name, description, file_format, separator, mapping, is_global, created_by)
VALUES
  (
    'Format Standard CSV',
    'Mapping standard pour CSV : Dossard, Nom, Prénom, Sexe, Catégorie, Temps',
    'csv',
    ',',
    '{
      "bib": 0,
      "lastName": 1,
      "firstName": 2,
      "gender": 3,
      "category": 4,
      "finishTime": 5
    }'::jsonb,
    true,
    NULL
  ),
  (
    'Format Elogica Standard',
    'Format Elogica avec séparateur point-virgule',
    'elogica',
    ';',
    '{
      "bib": 0,
      "lastName": 1,
      "firstName": 2,
      "gender": 3,
      "category": 4,
      "club": 5,
      "gunTime": 6,
      "netTime": 7,
      "overallRank": 8,
      "genderRank": 9,
      "categoryRank": 10
    }'::jsonb,
    true,
    NULL
  ),
  (
    'Format Course avec Mi-temps',
    'Format pour courses avec points de passage : Pl, Dos, Nom-prénom, Club, Sx, Année, Cat, Mi-course, Temps',
    'csv',
    '\t',
    '{
      "overallRank": 0,
      "bib": 1,
      "fullName": 2,
      "club": 3,
      "gender": 4,
      "year": 5,
      "category": 6,
      "splitTime1": 7,
      "finishTime": 10
    }'::jsonb,
    true,
    NULL
  );
