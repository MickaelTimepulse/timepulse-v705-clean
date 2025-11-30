/*
  # Ajout support inscription multiple

  ## Objectif
  Permettre à un utilisateur d'inscrire plusieurs coureurs en une seule transaction.
  
  ## Nouvelles colonnes
  - `entries.registrant_email` : Email de la personne qui effectue l'inscription (peut être différent de l'athlète)
  - `entries.registrant_name` : Nom de la personne qui effectue l'inscription
  - `entries.registration_group_id` : UUID pour lier plusieurs inscriptions d'un même groupe
  - `entries.is_group_registration` : Booléen indiquant si c'est une inscription groupée
  - `entries.group_registration_count` : Nombre total de participants dans le groupe
  
  ## Notes importantes
  - **AUCUNE donnée existante n'est modifiée**
  - Les colonnes sont NULLABLE pour compatibilité avec les inscriptions existantes
  - Les inscriptions existantes (18 actuellement) restent inchangées
  - Seules les nouvelles inscriptions multiples utiliseront ces champs
*/

-- Ajouter les colonnes pour l'inscription multiple (toutes NULLABLE pour compatibilité)
ALTER TABLE entries 
ADD COLUMN IF NOT EXISTS registrant_email text,
ADD COLUMN IF NOT EXISTS registrant_name text,
ADD COLUMN IF NOT EXISTS registration_group_id uuid,
ADD COLUMN IF NOT EXISTS is_group_registration boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS group_registration_count integer DEFAULT 1;

-- Index pour rechercher rapidement les inscriptions d'un même groupe
CREATE INDEX IF NOT EXISTS idx_entries_registration_group_id 
ON entries(registration_group_id) 
WHERE registration_group_id IS NOT NULL;

-- Commentaires explicatifs
COMMENT ON COLUMN entries.registrant_email IS 'Email de la personne qui effectue l''inscription (peut être différent de l''athlète inscrit)';
COMMENT ON COLUMN entries.registrant_name IS 'Nom complet de la personne qui effectue l''inscription';
COMMENT ON COLUMN entries.registration_group_id IS 'UUID commun pour toutes les inscriptions d''un même groupe';
COMMENT ON COLUMN entries.is_group_registration IS 'TRUE si cette inscription fait partie d''un groupe, FALSE sinon';
COMMENT ON COLUMN entries.group_registration_count IS 'Nombre total de participants dans le groupe (1 pour inscription individuelle)';
