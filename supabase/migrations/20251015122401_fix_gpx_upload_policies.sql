/*
  # Fix GPX Upload Policies

  1. Problem
    - Storage policies for GPX files check `e.organizer_id = auth.uid()`
    - But `organizer_id` references `organizers.id`, not `auth.users.id`
    - Need to join through `organizers` table to get `user_id`

  2. Changes
    - Drop existing GPX storage policies
    - Recreate with correct join to organizers table
*/

-- Drop existing GPX policies
DROP POLICY IF EXISTS "Organizers can upload GPX files" ON storage.objects;
DROP POLICY IF EXISTS "Organizers can update own GPX files" ON storage.objects;
DROP POLICY IF EXISTS "Organizers can delete own GPX files" ON storage.objects;

-- Recreate with correct joins
CREATE POLICY "Organizers can upload GPX files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'race-gpx' 
  AND EXISTS (
    SELECT 1 FROM races r
    JOIN events e ON e.id = r.event_id
    JOIN organizers o ON o.id = e.organizer_id
    WHERE r.id::text = (storage.foldername(objects.name))[1]
    AND o.user_id = auth.uid()
  )
);

CREATE POLICY "Organizers can update own GPX files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'race-gpx' 
  AND EXISTS (
    SELECT 1 FROM races r
    JOIN events e ON e.id = r.event_id
    JOIN organizers o ON o.id = e.organizer_id
    WHERE r.id::text = (storage.foldername(objects.name))[1]
    AND o.user_id = auth.uid()
  )
);

CREATE POLICY "Organizers can delete own GPX files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'race-gpx' 
  AND EXISTS (
    SELECT 1 FROM races r
    JOIN events e ON e.id = r.event_id
    JOIN organizers o ON o.id = e.organizer_id
    WHERE r.id::text = (storage.foldername(objects.name))[1]
    AND o.user_id = auth.uid()
  )
);
