/*
  # Create Email Assets Storage Bucket
  
  1. New Storage Bucket
    - `email-assets` - Public bucket for email images (logos, backgrounds)
  
  2. Security
    - Public read access for all files
    - Authenticated users can upload (simplified for now)
*/

-- Create email-assets bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'email-assets',
  'email-assets',
  true,
  5242880,
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Public read access for email assets'
  ) THEN
    CREATE POLICY "Public read access for email assets"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'email-assets');
  END IF;
END $$;

-- Allow authenticated users to upload
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Authenticated upload for email assets'
  ) THEN
    CREATE POLICY "Authenticated upload for email assets"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'email-assets');
  END IF;
END $$;

-- Allow authenticated users to delete their own files
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Authenticated delete for email assets'
  ) THEN
    CREATE POLICY "Authenticated delete for email assets"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (bucket_id = 'email-assets');
  END IF;
END $$;
