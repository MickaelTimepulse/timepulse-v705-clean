/*
  # Fix audit_logs missing user_id column

  1. Changes
    - Ajoute une colonne `user_id` comme alias de `actor_id` pour compatibilité
    - OU ajoute une vue pour simplifier l'accès
    
  2. Notes
    - La table audit_logs utilise `actor_id` mais du code essaie d'utiliser `user_id`
    - Solution : ajouter user_id comme colonne générée ou créer une vue
*/

-- Vérifier si la colonne user_id existe déjà
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'audit_logs' 
    AND column_name = 'user_id'
  ) THEN
    -- Ajouter user_id comme alias de actor_id
    ALTER TABLE audit_logs 
    ADD COLUMN user_id uuid GENERATED ALWAYS AS (actor_id) STORED;
    
    -- Créer un index pour les requêtes utilisant user_id
    CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
    
    RAISE NOTICE 'Colonne user_id ajoutée à audit_logs comme alias de actor_id';
  ELSE
    RAISE NOTICE 'La colonne user_id existe déjà';
  END IF;
END $$;