/*
  # Add GPX tracking support to races

  1. Changes to races table
    - Add `gpx_file_url` column to store GPX file location
    - Add `elevation_profile` JSONB column to store parsed elevation data for quick access
  
  2. Storage
    - Create storage bucket for GPX files
    - Set up RLS policies for GPX file access
  
  3. Security
    - Organizers can upload GPX files for their own races
    - Public can read GPX files for published races
*/

-- Add GPX columns to races table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'races' AND column_name = 'gpx_file_url'
  ) THEN
    ALTER TABLE races ADD COLUMN gpx_file_url text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'races' AND column_name = 'elevation_profile'
  ) THEN
    ALTER TABLE races ADD COLUMN elevation_profile jsonb;
  END IF;
END $$;

-- Create storage bucket for GPX files
INSERT INTO storage.buckets (id, name, public)
VALUES ('race-gpx', 'race-gpx', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for GPX files storage
DROP POLICY IF EXISTS "Organizers can upload GPX files" ON storage.objects;
CREATE POLICY "Organizers can upload GPX files"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'race-gpx' AND
    EXISTS (
      SELECT 1 FROM races r
      JOIN events e ON e.id = r.event_id
      WHERE r.id::text = (storage.foldername(storage.objects.name))[1]
      AND e.organizer_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Organizers can update own GPX files" ON storage.objects;
CREATE POLICY "Organizers can update own GPX files"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'race-gpx' AND
    EXISTS (
      SELECT 1 FROM races r
      JOIN events e ON e.id = r.event_id
      WHERE r.id::text = (storage.foldername(storage.objects.name))[1]
      AND e.organizer_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Organizers can delete own GPX files" ON storage.objects;
CREATE POLICY "Organizers can delete own GPX files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'race-gpx' AND
    EXISTS (
      SELECT 1 FROM races r
      JOIN events e ON e.id = r.event_id
      WHERE r.id::text = (storage.foldername(storage.objects.name))[1]
      AND e.organizer_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Public can view GPX files" ON storage.objects;
CREATE POLICY "Public can view GPX files"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'race-gpx');