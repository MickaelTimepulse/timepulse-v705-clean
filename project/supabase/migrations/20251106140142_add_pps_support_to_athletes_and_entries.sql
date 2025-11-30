/*
  # Ajout du support PPS (Passeport Prévention Santé)

  1. Modifications
    - Ajoute `pps_expiry_date` (date d'expiration du PPS) à la table `athletes`
    - Ajoute `pps_verified` (booléen de vérification) à la table `athletes`
    - Ajoute `pps_warning` (message d'avertissement) à la table `athletes`
    - Ajoute `pps_number` à la table `entries` pour stocker le PPS au moment de l'inscription
    - Ajoute `pps_expiry_date` à la table `entries`
    - Ajoute `pps_verified` à la table `entries`
    - Ajoute `pps_warning` à la table `entries`

  2. Notes importantes
    - Le PPS commence toujours par la lettre "P"
    - Le PPS doit avoir moins de 3 mois à la date de l'épreuve
    - Un PPS invalide ou expiré n'empêche PAS l'inscription
    - L'athlète doit être informé qu'il devra fournir un document ultérieurement
*/

-- Ajouter colonnes PPS à la table athletes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'athletes' AND column_name = 'pps_expiry_date'
  ) THEN
    ALTER TABLE athletes ADD COLUMN pps_expiry_date date;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'athletes' AND column_name = 'pps_verified'
  ) THEN
    ALTER TABLE athletes ADD COLUMN pps_verified boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'athletes' AND column_name = 'pps_warning'
  ) THEN
    ALTER TABLE athletes ADD COLUMN pps_warning text;
  END IF;
END $$;

-- Ajouter colonnes PPS à la table entries
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'entries' AND column_name = 'pps_number'
  ) THEN
    ALTER TABLE entries ADD COLUMN pps_number text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'entries' AND column_name = 'pps_expiry_date'
  ) THEN
    ALTER TABLE entries ADD COLUMN pps_expiry_date date;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'entries' AND column_name = 'pps_verified'
  ) THEN
    ALTER TABLE entries ADD COLUMN pps_verified boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'entries' AND column_name = 'pps_warning'
  ) THEN
    ALTER TABLE entries ADD COLUMN pps_warning text;
  END IF;
END $$;

-- Créer un index sur pps_number pour les recherches
CREATE INDEX IF NOT EXISTS idx_athletes_pps_number ON athletes(pps_number) WHERE pps_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_entries_pps_number ON entries(pps_number) WHERE pps_number IS NOT NULL;

-- Créer un index sur pps_expiry_date pour vérifier les expirations
CREATE INDEX IF NOT EXISTS idx_athletes_pps_expiry ON athletes(pps_expiry_date) WHERE pps_expiry_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_entries_pps_expiry ON entries(pps_expiry_date) WHERE pps_expiry_date IS NOT NULL;