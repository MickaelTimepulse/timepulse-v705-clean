/*
  # Create Storage Buckets for Certificates

  1. Buckets
    - `certificate-templates` - Pour stocker les templates de diplômes
    - `generated-certificates` - Pour stocker les diplômes générés

  2. Security
    - Admins peuvent uploader dans certificate-templates
    - Tous peuvent lire les templates et certificats générés
    - Système peut générer dans generated-certificates
*/

-- Create certificate-templates bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('certificate-templates', 'certificate-templates', true)
ON CONFLICT (id) DO NOTHING;

-- Create generated-certificates bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('generated-certificates', 'generated-certificates', true)
ON CONFLICT (id) DO NOTHING;

-- Policies for certificate-templates bucket
CREATE POLICY "Admins can upload certificate templates"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'certificate-templates' AND
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
    )
  );

CREATE POLICY "Admins can update certificate templates"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'certificate-templates' AND
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
    )
  );

CREATE POLICY "Admins can delete certificate templates"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'certificate-templates' AND
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
    )
  );

CREATE POLICY "Anyone can view certificate templates"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'certificate-templates');

-- Policies for generated-certificates bucket
CREATE POLICY "Anyone can view generated certificates"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'generated-certificates');

CREATE POLICY "System can generate certificates"
  ON storage.objects FOR INSERT
  TO public
  WITH CHECK (bucket_id = 'generated-certificates');
