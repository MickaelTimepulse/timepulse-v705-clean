/*
  # Create Storage Bucket for Organizer and Federation Logos

  1. Storage
    - Create `organizer-logos` bucket for organizer logo uploads
    - Set up public access for logo viewing
    - Configure upload size limits and file type restrictions
    
  2. Security
    - Allow authenticated organizers to upload their own logos
    - Public read access for all logos
    - Restrict uploads to image files only
*/

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'organizer-logos',
  'organizer-logos',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml']
) ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Organizers can upload their own logos'
  ) THEN
    CREATE POLICY "Organizers can upload their own logos"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
      bucket_id = 'organizer-logos' AND
      auth.uid()::text = (storage.foldername(name))[1]
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Organizers can update their own logos'
  ) THEN
    CREATE POLICY "Organizers can update their own logos"
    ON storage.objects
    FOR UPDATE
    TO authenticated
    USING (
      bucket_id = 'organizer-logos' AND
      auth.uid()::text = (storage.foldername(name))[1]
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Organizers can delete their own logos'
  ) THEN
    CREATE POLICY "Organizers can delete their own logos"
    ON storage.objects
    FOR DELETE
    TO authenticated
    USING (
      bucket_id = 'organizer-logos' AND
      auth.uid()::text = (storage.foldername(name))[1]
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Anyone can view organizer logos'
  ) THEN
    CREATE POLICY "Anyone can view organizer logos"
    ON storage.objects
    FOR SELECT
    TO public
    USING (bucket_id = 'organizer-logos');
  END IF;
END $$;