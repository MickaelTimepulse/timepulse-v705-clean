/*
  # Ajouter date de début de validité aux invitations

  1. Modifications
    - Ajouter le champ valid_from (date de début de validité)
    - Par défaut : now() (valide immédiatement)
    
  2. Notes
    - Permet de créer des invitations qui ne seront valides qu'à partir d'une certaine date
    - Combine avec valid_until pour une plage de validité complète
    - Utile pour gérer des invitations programmées à l'avance
*/

-- Ajouter le champ valid_from
ALTER TABLE invitations 
  ADD COLUMN IF NOT EXISTS valid_from timestamptz DEFAULT now();

-- Mettre à jour les politiques RLS pour vérifier aussi valid_from
DROP POLICY IF EXISTS "Public can validate invitation codes" ON invitations;

CREATE POLICY "Public can validate invitation codes"
  ON invitations
  FOR SELECT
  TO anon
  USING (
    status = 'active' 
    AND (valid_from IS NULL OR valid_from <= now())
    AND (valid_until IS NULL OR valid_until > now())
    AND (max_uses IS NULL OR current_uses < max_uses)
  );
