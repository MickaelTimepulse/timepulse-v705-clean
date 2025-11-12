/*
  # Bucket Storage pour documents d'inscription

  1. Nouveau bucket
    - `entry-documents` : Pour stocker les certificats médicaux, licences, etc.
  
  2. Sécurité
    - Policies pour organisateurs : upload/view pour leurs inscriptions
    - Files organisés par: organizer_id/entry_id/document_type_filename
*/

-- Créer le bucket pour les documents d'inscription
INSERT INTO storage.buckets (id, name, public)
VALUES ('entry-documents', 'entry-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Policy: Les organisateurs peuvent uploader des documents pour leurs inscriptions
CREATE POLICY "Organizers can upload documents for their entries"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'entry-documents' AND
  EXISTS (
    SELECT 1 FROM organizers o
    WHERE o.user_id = auth.uid()
    AND name LIKE o.id::text || '/%'
  )
);

-- Policy: Les organisateurs peuvent voir les documents de leurs inscriptions
CREATE POLICY "Organizers can view documents for their entries"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'entry-documents' AND
  EXISTS (
    SELECT 1 FROM organizers o
    WHERE o.user_id = auth.uid()
    AND name LIKE o.id::text || '/%'
  )
);

-- Policy: Les organisateurs peuvent mettre à jour les documents de leurs inscriptions
CREATE POLICY "Organizers can update documents for their entries"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'entry-documents' AND
  EXISTS (
    SELECT 1 FROM organizers o
    WHERE o.user_id = auth.uid()
    AND name LIKE o.id::text || '/%'
  )
)
WITH CHECK (
  bucket_id = 'entry-documents' AND
  EXISTS (
    SELECT 1 FROM organizers o
    WHERE o.user_id = auth.uid()
    AND name LIKE o.id::text || '/%'
  )
);

-- Policy: Les organisateurs peuvent supprimer les documents de leurs inscriptions
CREATE POLICY "Organizers can delete documents for their entries"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'entry-documents' AND
  EXISTS (
    SELECT 1 FROM organizers o
    WHERE o.user_id = auth.uid()
    AND name LIKE o.id::text || '/%'
  )
);