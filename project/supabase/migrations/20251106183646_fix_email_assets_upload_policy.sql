/*
  # Fix Email Assets Upload Policy
  
  1. Changes
    - Drop existing restrictive policies
    - Allow all authenticated users to upload to email-assets bucket
    - Keep public read access
  
  2. Security
    - Public read for all files
    - Authenticated users can upload/update/delete
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Authenticated upload for email assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated delete for email assets" ON storage.objects;

-- Allow authenticated users to insert files
CREATE POLICY "Allow authenticated upload to email-assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'email-assets');

-- Allow authenticated users to update files
CREATE POLICY "Allow authenticated update in email-assets"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'email-assets')
WITH CHECK (bucket_id = 'email-assets');

-- Allow authenticated users to delete files
CREATE POLICY "Allow authenticated delete from email-assets"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'email-assets');
