/*
  # Augmenter la longueur du champ management_code

  1. Modifications
    - Augmenter management_code de VARCHAR(20) à VARCHAR(30) dans la table entries
    - Le code génère des codes de type "1702488123456-ABC1234" (21+ caractères)

  2. Sécurité
    - Aucun changement RLS nécessaire
*/

-- Augmenter la taille du champ management_code
ALTER TABLE entries
ALTER COLUMN management_code TYPE VARCHAR(30);

COMMENT ON COLUMN entries.management_code IS 'Unique management code for entry modifications (format: TIMESTAMP-RANDOM)';
