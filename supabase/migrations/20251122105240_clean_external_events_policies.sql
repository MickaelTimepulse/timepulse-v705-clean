/*
  # Nettoyage et simplification des policies external_events

  1. Modifications
    - Supprime toutes les policies existantes
    - Recrée des policies claires et fonctionnelles
    - Permet INSERT public pour drafts
    
  2. Sécurité
    - Role 'anon' peut INSERT en draft
    - Role 'authenticated' peut INSERT en draft
    - Admins peuvent tout faire
    - Public peut SELECT les events publiés
*/

-- Supprime toutes les policies existantes
DROP POLICY IF EXISTS "Public can submit external events as drafts" ON external_events;
DROP POLICY IF EXISTS "Allow public submissions for external events" ON external_events;
DROP POLICY IF EXISTS "Public can view published external events" ON external_events;
DROP POLICY IF EXISTS "Admins have full access to external events" ON external_events;
DROP POLICY IF EXISTS "Admins can manage external events" ON external_events;
DROP POLICY IF EXISTS "Organizers can manage their external events" ON external_events;

-- 1. Permet à TOUS (anon, authenticated, public) de soumettre des events en draft
CREATE POLICY "enable_insert_draft_for_all"
  ON external_events
  FOR INSERT
  TO public
  WITH CHECK (
    status = 'draft'
    AND is_public = false
  );

-- 2. Lecture publique des events publiés
CREATE POLICY "enable_select_published_for_all"
  ON external_events
  FOR SELECT
  TO public
  USING (
    is_public = true
    OR EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.is_active = true
    )
  );

-- 3. Admins peuvent tout faire
CREATE POLICY "enable_all_for_admins"
  ON external_events
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

-- 4. Organisateurs peuvent gérer leurs events
CREATE POLICY "enable_all_for_organizers"
  ON external_events
  FOR ALL
  TO authenticated
  USING (
    organizer_id IN (
      SELECT id FROM organizers WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    organizer_id IN (
      SELECT id FROM organizers WHERE user_id = auth.uid()
    )
  );
