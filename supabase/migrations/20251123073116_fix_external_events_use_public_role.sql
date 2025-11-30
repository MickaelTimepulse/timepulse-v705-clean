/*
  # Fix insertion anonyme - utiliser role PUBLIC

  1. Problème
    - La policy avec "TO anon, authenticated" ne fonctionne pas
    - Supabase nécessite "TO public" pour inclure anon
    
  2. Solution
    - Remplacer "TO anon, authenticated" par "TO public"
    - Public inclut à la fois anon et authenticated
*/

-- Supprime la policy actuelle qui ne fonctionne pas
DROP POLICY IF EXISTS "allow_draft_submission" ON external_events;

-- Recrée avec TO public (qui inclut anon + authenticated)
CREATE POLICY "allow_draft_submission"
  ON external_events
  FOR INSERT
  TO public
  WITH CHECK (
    status = 'draft'
    AND is_public = false
  );

-- Pareil pour external_results
DROP POLICY IF EXISTS "allow_results_for_draft_events" ON external_results;

CREATE POLICY "allow_results_for_draft_events"
  ON external_results
  FOR INSERT
  TO public
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM external_events
      WHERE external_events.id = external_results.external_event_id
      AND external_events.status = 'draft'
    )
  );
