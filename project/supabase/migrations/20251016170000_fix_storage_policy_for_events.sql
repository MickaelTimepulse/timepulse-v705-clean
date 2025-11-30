/*
  # Fix storage policy to allow event image uploads

  1. Problem
    - Current policy only allows uploads in user-id folders
    - Event images are uploaded to 'events/' folder
    - This causes RLS violation when uploading event images

  2. Solution
    - Update INSERT policy to allow authenticated users to upload to 'events/' folder
    - Keep existing restrictions for organizer logo folders
    - Maintain security by requiring authentication

  3. Security
    - Only authenticated users can upload
    - Public can still view all images
    - Update and delete still require ownership of folder
*/

-- Drop and recreate the INSERT policy with support for events folder
DROP POLICY IF EXISTS "Organizers can upload their own logos" ON storage.objects;

CREATE POLICY "Organizers can upload their own logos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'organizer-logos' AND (
    -- Allow uploads in events/ folder for event images
    (storage.foldername(name))[1] = 'events'
    OR
    -- Allow uploads in user's own folder for logos
    auth.uid()::text = (storage.foldername(name))[1]
  )
);
