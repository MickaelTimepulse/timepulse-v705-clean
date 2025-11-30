/*
  # Mise à jour du système d'invitations pour liens génériques

  1. Modifications
    - Rendre `invited_email` et `invited_name` optionnels (NULL)
    - Ajouter `company_name` pour identifier l'entreprise/partenaire
    - Ajouter `max_uses` pour limiter le nombre d'utilisations (NULL = illimité)
    - Ajouter `current_uses` pour tracker les utilisations
    - Modifier `status` pour inclure 'active', 'expired', 'exhausted', 'cancelled'
    - Ajouter `applies_to_all_races` pour indiquer si le lien est valable pour toutes les épreuves
  
  2. Notes
    - Les invitations peuvent maintenant être génériques (sans email/nom préattribué)
    - Un lien peut être utilisé plusieurs fois jusqu'à `max_uses`
    - Si `race_id` est NULL et `applies_to_all_races` = true, valable pour toutes les épreuves
*/

-- Rendre les champs email et nom optionnels
ALTER TABLE invitations 
  ALTER COLUMN invited_email DROP NOT NULL,
  ALTER COLUMN invited_name DROP NOT NULL;

-- Ajouter les nouveaux champs
ALTER TABLE invitations 
  ADD COLUMN IF NOT EXISTS company_name text,
  ADD COLUMN IF NOT EXISTS max_uses integer DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS current_uses integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS applies_to_all_races boolean DEFAULT false;

-- Supprimer l'ancienne contrainte si elle existe
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'check_max_uses' AND table_name = 'invitations'
  ) THEN
    ALTER TABLE invitations DROP CONSTRAINT check_max_uses;
  END IF;
END $$;

-- Ajouter une contrainte pour s'assurer que current_uses ne dépasse pas max_uses
ALTER TABLE invitations 
  ADD CONSTRAINT check_max_uses 
  CHECK (max_uses IS NULL OR current_uses <= max_uses);

-- Mettre à jour les invitations existantes
UPDATE invitations 
SET current_uses = 0, applies_to_all_races = false 
WHERE current_uses IS NULL;
