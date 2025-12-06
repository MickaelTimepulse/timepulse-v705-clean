/*
  # Ajouter l'accès public en lecture aux templates de diplômes actifs

  1. Sécurité
    - Permet aux utilisateurs publics (anon) de lire les templates actifs
    - Nécessaire pour la génération de diplômes côté public
    - Seuls les templates marqués comme actifs sont visibles
*/

-- Permettre aux utilisateurs publics de lire les templates actifs
CREATE POLICY "Public can view active certificate templates"
  ON certificate_templates
  FOR SELECT
  TO anon
  USING (is_active = true);

-- Permettre aussi aux utilisateurs authentifiés de lire les templates actifs
CREATE POLICY "Authenticated users can view active certificate templates"
  ON certificate_templates
  FOR SELECT
  TO authenticated
  USING (is_active = true);
