/*
  # Create result imports tracking table

  1. New Tables
    - `result_imports`
      - `id` (uuid, primary key)
      - `race_id` (uuid, foreign key to races)
      - `imported_by` (uuid, reference to user)
      - `file_name` (text) - Original filename
      - `file_format` (text) - csv, excel, elogica, ffa-text, html
      - `total_rows` (integer) - Total rows in file
      - `imported_rows` (integer) - Successfully imported rows
      - `failed_rows` (integer) - Failed rows
      - `mapping_used` (jsonb) - Column mapping configuration used
      - `error_log` (jsonb) - Errors encountered during import
      - `status` (text) - pending, processing, completed, failed
      - `created_at` (timestamptz)
      - `completed_at` (timestamptz)

  2. Security
    - Enable RLS
    - Organizers can view their own race imports
    - Admins can view all imports
*/

CREATE TABLE IF NOT EXISTS result_imports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  race_id uuid REFERENCES races(id) ON DELETE CASCADE,
  imported_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  file_name text NOT NULL,
  file_format text NOT NULL CHECK (file_format IN ('csv', 'excel', 'elogica', 'ffa-text', 'html')),
  total_rows integer DEFAULT 0,
  imported_rows integer DEFAULT 0,
  failed_rows integer DEFAULT 0,
  mapping_used jsonb,
  error_log jsonb,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

ALTER TABLE result_imports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organizers can view their race imports"
  ON result_imports
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM races r
      JOIN events e ON e.id = r.event_id
      WHERE r.id = result_imports.race_id
      AND e.organizer_id IN (
        SELECT id FROM organizers WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Organizers can create imports for their races"
  ON result_imports
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM races r
      JOIN events e ON e.id = r.event_id
      WHERE r.id = result_imports.race_id
      AND e.organizer_id IN (
        SELECT id FROM organizers WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Organizers can update their race imports"
  ON result_imports
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM races r
      JOIN events e ON e.id = r.event_id
      WHERE r.id = result_imports.race_id
      AND e.organizer_id IN (
        SELECT id FROM organizers WHERE user_id = auth.uid()
      )
    )
  );

CREATE INDEX IF NOT EXISTS idx_result_imports_race_id ON result_imports(race_id);
CREATE INDEX IF NOT EXISTS idx_result_imports_status ON result_imports(status);
CREATE INDEX IF NOT EXISTS idx_result_imports_created_at ON result_imports(created_at);
