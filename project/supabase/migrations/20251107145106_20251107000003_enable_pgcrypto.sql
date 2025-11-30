/*
  # Activation de l'extension pgcrypto
  
  1. Actions
    - Activation de pgcrypto pour les fonctions de hash
    - Nécessaire pour verify_admin_password
*/

-- Activer l'extension pgcrypto
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Vérifier que l'extension est active
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'pgcrypto'
  ) THEN
    RAISE EXCEPTION 'pgcrypto extension non activée';
  END IF;
  
  RAISE NOTICE '✅ Extension pgcrypto activée avec succès';
END $$;
