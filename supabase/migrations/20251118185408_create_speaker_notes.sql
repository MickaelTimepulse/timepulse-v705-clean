/*
  # Create Speaker Notes Table

  1. New Tables
    - `speaker_notes`
      - `id` (uuid, primary key)
      - `speaker_access_id` (uuid, references speaker_access)
      - `entry_id` (uuid, references entries)
      - `note` (text) - Note content
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `speaker_notes` table
    - Add policy for public access (speaker module uses sessionStorage, not auth)
    - Speakers can create/read/update/delete notes for their event

  3. Indexes
    - Index on speaker_access_id for fast lookups
    - Index on entry_id for fast lookups
*/

-- Create speaker_notes table
CREATE TABLE IF NOT EXISTS speaker_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  speaker_access_id uuid NOT NULL REFERENCES speaker_access(id) ON DELETE CASCADE,
  entry_id uuid NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
  note text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(speaker_access_id, entry_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_speaker_notes_speaker_access ON speaker_notes(speaker_access_id);
CREATE INDEX IF NOT EXISTS idx_speaker_notes_entry ON speaker_notes(entry_id);

-- Enable RLS
ALTER TABLE speaker_notes ENABLE ROW LEVEL SECURITY;

-- Allow public to manage notes (speaker module doesn't use auth)
CREATE POLICY "Public can view speaker notes"
  ON speaker_notes
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public can create speaker notes"
  ON speaker_notes
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Public can update speaker notes"
  ON speaker_notes
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public can delete speaker notes"
  ON speaker_notes
  FOR DELETE
  TO public
  USING (true);

-- Update updated_at trigger
CREATE OR REPLACE FUNCTION update_speaker_notes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER speaker_notes_updated_at
  BEFORE UPDATE ON speaker_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_speaker_notes_updated_at();
