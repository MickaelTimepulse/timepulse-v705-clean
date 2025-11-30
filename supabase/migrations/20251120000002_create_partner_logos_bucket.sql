/*
  # Create Partner Logos Storage Bucket

  1. Storage
    - Create `event-partner-logos` bucket for partner logos
    - Configure for public access (read-only)
    - Set file size limits and allowed mime types

  2. Security
    - Organizers can upload logos for their events
    - Public can view partner logos
    - Automatic cleanup on partner deletion
*/

-- Create storage bucket for partner logos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'event-partner-logos',
  'event-partner-logos',
  true,
  5242880, -- 5MB limit
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp']::text[];

-- Allow organizers to upload partner logos for their events
CREATE POLICY "Organizers can upload partner logos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'event-partner-logos'
    AND (storage.foldername(name))[1] IN (
      SELECT e.id::text
      FROM events e
      INNER JOIN organizers o ON e.organizer_id = o.id
      WHERE o.user_id = auth.uid()
    )
  );

-- Allow organizers to update their partner logos
CREATE POLICY "Organizers can update own partner logos"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'event-partner-logos'
    AND (storage.foldername(name))[1] IN (
      SELECT e.id::text
      FROM events e
      INNER JOIN organizers o ON e.organizer_id = o.id
      WHERE o.user_id = auth.uid()
    )
  );

-- Allow organizers to delete their partner logos
CREATE POLICY "Organizers can delete own partner logos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'event-partner-logos'
    AND (storage.foldername(name))[1] IN (
      SELECT e.id::text
      FROM events e
      INNER JOIN organizers o ON e.organizer_id = o.id
      WHERE o.user_id = auth.uid()
    )
  );

-- Public read access to partner logos
CREATE POLICY "Public can view partner logos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'event-partner-logos');
