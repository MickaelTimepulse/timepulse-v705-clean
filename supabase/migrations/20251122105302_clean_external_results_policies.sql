/*
  # Nettoyage et simplification des policies external_results

  1. Modifications
    - Supprime toutes les policies existantes
    - Recrée des policies claires et fonctionnelles
    - Permet INSERT public pour résultats d'events draft
    
  2. Sécurité
    - Role 'public' peut INSERT pour events en draft
    - Admins peuvent tout faire
    - Public peut SELECT les résultats d'events publiés
*/

-- Supprime toutes les policies existantes
DROP POLICY IF EXISTS "Public can view external results of published events" ON external_results;
DROP POLICY IF EXISTS "Admins have full access to external results" ON external_results;
DROP POLICY IF EXISTS "Organizers can manage results of their external events" ON external_results;
DROP POLICY IF EXISTS "Allow public submission of external results" ON external_results;

-- 1. Permet à TOUS de soumettre des résultats pour events en draft
CREATE POLICY "enable_insert_for_draft_events"
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

-- 2. Lecture publique des résultats d'events publiés
CREATE POLICY "enable_select_published_results"
  ON external_results
  FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM external_events
      WHERE external_events.id = external_results.external_event_id
      AND external_events.status = 'published'
      AND external_events.is_public = true
    )
    OR EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.is_active = true
    )
  );

-- 3. Admins peuvent tout faire
CREATE POLICY "enable_all_for_admins"
  ON external_results
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.is_active = true
    )
  );

-- 4. Organisateurs peuvent gérer les résultats de leurs events
CREATE POLICY "enable_all_for_organizers"
  ON external_results
  FOR ALL
  TO authenticated
  USING (
    external_event_id IN (
      SELECT id FROM external_events
      WHERE organizer_id IN (SELECT id FROM organizers WHERE user_id = auth.uid())
    )
  )
  WITH CHECK (
    external_event_id IN (
      SELECT id FROM external_events
      WHERE organizer_id IN (SELECT id FROM organizers WHERE user_id = auth.uid())
    )
  );
