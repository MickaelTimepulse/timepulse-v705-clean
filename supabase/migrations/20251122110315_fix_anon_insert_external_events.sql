/*
  # Fix RLS pour permettre insertion anonyme

  1. Problème
    - Le role 'anon' ne peut pas insérer malgré policy 'public'
    - Besoin d'une policy explicite pour 'anon'
    
  2. Solution
    - Ajoute policy INSERT spécifique pour role 'anon'
    - Supprime organizer_id de la contrainte WITH CHECK
*/

-- Policy INSERT explicite pour role anon sur external_events
CREATE POLICY "enable_anon_insert_draft"
  ON external_events
  FOR INSERT
  TO anon
  WITH CHECK (
    status = 'draft'
    AND is_public = false
  );

-- Policy INSERT explicite pour role anon sur external_results
CREATE POLICY "enable_anon_insert_results"
  ON external_results
  FOR INSERT
  TO anon
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM external_events
      WHERE external_events.id = external_results.external_event_id
      AND external_events.status = 'draft'
    )
  );
