/*
  # Ajouter registration_date aux inscriptions

  1. Modifications
    - Ajouter la colonne `registration_date` à la table `entries`
    - Cette colonne stocke la date d'inscription originale (importante pour les imports CSV)
    - Par défaut, utilise `created_at` pour les nouvelles inscriptions
    - Pour les imports, cette date peut être définie à la date réelle d'inscription

  2. Notes
    - `registration_date` : Date d'inscription réelle du participant (peut être antérieure à `created_at`)
    - `created_at` : Date de création de la ligne dans la base de données
*/

-- Ajouter la colonne registration_date si elle n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'entries' AND column_name = 'registration_date'
  ) THEN
    ALTER TABLE entries ADD COLUMN registration_date TIMESTAMPTZ DEFAULT NOW();

    -- Mettre à jour les entrées existantes avec created_at
    UPDATE entries SET registration_date = created_at WHERE registration_date IS NULL;

    -- Rendre la colonne NOT NULL après avoir rempli les valeurs
    ALTER TABLE entries ALTER COLUMN registration_date SET NOT NULL;
  END IF;
END $$;

-- Index pour les recherches par date d'inscription
CREATE INDEX IF NOT EXISTS idx_entries_registration_date ON entries(registration_date);
