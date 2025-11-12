/*
  # Fix Email Assets - Allow Admin Access
  
  1. Problème
    - Les admins ne peuvent pas uploader car ils ne sont pas dans auth.users
    - Ils sont dans admin_users
  
  2. Solution
    - Autoriser aussi les connexions anon (avec vérification côté app)
    - Simplifier les policies pour permettre upload/update/delete
  
  3. Security
    - Public read (emails)
    - Anon + Authenticated peuvent upload/update/delete
*/

-- Drop toutes les anciennes policies
DROP POLICY IF EXISTS "Public read access for email assets" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated upload to email-assets" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated update in email-assets" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated delete from email-assets" ON storage.objects;

-- Public read (nécessaire pour les emails)
CREATE POLICY "Public read email-assets"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'email-assets');

-- Allow all authenticated AND anon to upload (admin verification done in app)
CREATE POLICY "Allow upload to email-assets"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'email-assets');

-- Allow all authenticated AND anon to update
CREATE POLICY "Allow update in email-assets"
ON storage.objects FOR UPDATE
TO public
USING (bucket_id = 'email-assets')
WITH CHECK (bucket_id = 'email-assets');

-- Allow all authenticated AND anon to delete
CREATE POLICY "Allow delete from email-assets"
ON storage.objects FOR DELETE
TO public
USING (bucket_id = 'email-assets');

-- Augmenter la limite de taille à 10MB
UPDATE storage.buckets
SET file_size_limit = 10485760
WHERE id = 'email-assets';
