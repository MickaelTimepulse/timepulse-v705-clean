/*
  # Permettre soumissions publiques de résultats externes

  1. Changements
    - Ajouter policy INSERT pour le public sur external_events
    - Ajouter policy INSERT pour le public sur external_results
    - Les soumissions seront en statut 'draft' par défaut (modération admin)

  2. Sécurité
    - Les soumissions publiques créent des brouillons
    - Seuls les admins peuvent publier (status = 'published')
*/

-- Autoriser le public à soumettre des événements externes (en brouillon)
CREATE POLICY "Public can submit external events as drafts"
  ON external_events FOR INSERT TO public
  WITH CHECK (status = 'draft' AND is_public = false);

-- Autoriser le public à ajouter des résultats à leurs événements soumis
CREATE POLICY "Public can submit external results"
  ON external_results FOR INSERT TO public
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM external_events
      WHERE external_events.id = external_results.external_event_id
      AND external_events.status = 'draft'
    )
  );
