/*
  # Politiques RLS pour les invitations

  1. Sécurité
    - Enable RLS sur la table invitations
    - Les organisateurs peuvent voir leurs propres invitations
    - Les organisateurs peuvent créer des invitations pour leurs événements
    - Les organisateurs peuvent modifier/supprimer leurs propres invitations
    - Les invitations publiques peuvent être lues par tous (pour validation lors de l'inscription)

  2. Notes
    - Un organisateur ne peut créer des invitations que pour ses propres événements
    - La lecture publique est limitée aux champs nécessaires pour la validation
*/

-- Activer RLS sur la table invitations
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- Politique de lecture pour les organisateurs (voir leurs propres invitations)
CREATE POLICY "Organizers can view their own invitations"
  ON invitations
  FOR SELECT
  TO authenticated
  USING (
    created_by IN (
      SELECT id FROM organizers 
      WHERE user_id = auth.uid()
    )
  );

-- Politique d'insertion pour les organisateurs
CREATE POLICY "Organizers can create invitations for their events"
  ON invitations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    event_id IN (
      SELECT id FROM events 
      WHERE organizer_id IN (
        SELECT id FROM organizers 
        WHERE user_id = auth.uid()
      )
    )
  );

-- Politique de mise à jour pour les organisateurs
CREATE POLICY "Organizers can update their own invitations"
  ON invitations
  FOR UPDATE
  TO authenticated
  USING (
    created_by IN (
      SELECT id FROM organizers 
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    created_by IN (
      SELECT id FROM organizers 
      WHERE user_id = auth.uid()
    )
  );

-- Politique de suppression pour les organisateurs
CREATE POLICY "Organizers can delete their own invitations"
  ON invitations
  FOR DELETE
  TO authenticated
  USING (
    created_by IN (
      SELECT id FROM organizers 
      WHERE user_id = auth.uid()
    )
  );

-- Politique de lecture publique pour validation (lors de l'inscription)
CREATE POLICY "Public can validate invitation codes"
  ON invitations
  FOR SELECT
  TO anon
  USING (
    status = 'active' 
    AND (valid_until IS NULL OR valid_until > now())
    AND (max_uses IS NULL OR current_uses < max_uses)
  );
