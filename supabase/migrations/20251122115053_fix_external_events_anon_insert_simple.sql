/*
  # Fix insertion anonyme pour external_events

  1. Problème
    - Les utilisateurs anonymes reçoivent 401 Unauthorized sur INSERT
    - Conflit potentiel entre policies 'public' et 'anon'
    
  2. Solution
    - Supprime toutes les policies INSERT existantes
    - Crée UNE SEULE policy simple pour anon + public
    - Permet insertion avec status=draft ET is_public=false
*/

-- Supprime toutes les policies INSERT existantes pour éviter les conflits
DROP POLICY IF EXISTS "enable_insert_draft_for_all" ON external_events;
DROP POLICY IF EXISTS "enable_anon_insert_draft" ON external_events;

-- Crée UNE policy simple pour INSERT (anon + authenticated)
CREATE POLICY "allow_draft_submission"
  ON external_events
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    status = 'draft'
    AND is_public = false
  );

-- Fait pareil pour external_results
DROP POLICY IF EXISTS "enable_insert_for_draft_events" ON external_results;
DROP POLICY IF EXISTS "enable_anon_insert_results" ON external_results;

CREATE POLICY "allow_results_for_draft_events"
  ON external_results
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM external_events
      WHERE external_events.id = external_results.external_event_id
      AND external_events.status = 'draft'
    )
  );
