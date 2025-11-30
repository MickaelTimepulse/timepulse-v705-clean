/*
  # Fix RLS pour external_results - Permettre insertions publiques

  1. Modifications
    - Ajoute policy INSERT pour anon/authenticated
    - Permet d'insérer des résultats pour events en draft
    - Les résultats sont liés à l'event externe créé publiquement
    
  2. Sécurité
    - INSERT: Anon/authenticated peuvent insérer pour events draft
    - SELECT: Lecture publique seulement si event publié
    - UPDATE/DELETE: Admins et organisateurs seulement
*/

-- Permet l'insertion publique de résultats pour événements draft
CREATE POLICY "Allow public submission of external results"
  ON external_results
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM external_events
      WHERE external_events.id = external_results.external_event_id
      AND external_events.status = 'draft'
      AND external_events.is_public = false
    )
  );
