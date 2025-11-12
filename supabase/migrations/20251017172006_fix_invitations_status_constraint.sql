/*
  # Correction de la contrainte de statut des invitations

  1. Modifications
    - Supprimer l'ancienne contrainte de statut
    - Ajouter une nouvelle contrainte avec les bons statuts : 'active', 'cancelled', 'expired', 'exhausted'

  2. Notes
    - 'active' : Invitation utilisable
    - 'cancelled' : Désactivée par l'organisateur
    - 'expired' : Date dépassée (géré automatiquement)
    - 'exhausted' : Quota d'utilisations atteint (géré automatiquement)
*/

-- Supprimer l'ancienne contrainte
ALTER TABLE invitations 
  DROP CONSTRAINT IF EXISTS invitations_status_check;

-- Ajouter la nouvelle contrainte avec les bons statuts
ALTER TABLE invitations 
  ADD CONSTRAINT invitations_status_check 
  CHECK (status IN ('active', 'cancelled', 'expired', 'exhausted'));
