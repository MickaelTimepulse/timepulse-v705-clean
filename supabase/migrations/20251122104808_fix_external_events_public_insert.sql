/*
  # Fix RLS pour external_events - Permettre insertions publiques

  1. Modifications
    - Ajoute policy INSERT pour anon/authenticated
    - Les soumissions publiques sont en status 'draft' par défaut
    - Seuls les admins peuvent UPDATE/DELETE
    
  2. Sécurité
    - INSERT: Tous (anon/authenticated) peuvent soumettre en draft
    - SELECT: Public peut voir is_public=true, admins voient tout
    - UPDATE/DELETE: Admins seulement via fonction SECURITY DEFINER
*/

-- Supprime l'ancienne policy restrictive si elle existe
DROP POLICY IF EXISTS "Only admins can insert external events" ON external_events;

-- Permet à tous de soumettre des événements externes (en draft)
CREATE POLICY "Allow public submissions for external events"
  ON external_events
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    status = 'draft' 
    AND is_public = false
    AND organizer_id IS NULL
  );

-- Lecture: public voit events publics, admins voient tout
DROP POLICY IF EXISTS "Public can view published external events" ON external_events;
CREATE POLICY "Public can view published external events"
  ON external_events
  FOR SELECT
  TO anon, authenticated
  USING (
    is_public = true
    OR EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.is_active = true
    )
  );

-- Les admins peuvent tout faire via fonctions SECURITY DEFINER
CREATE POLICY "Admins can manage external events"
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
