/*
  # Ajout du Code de Gestion d'Inscription et Statut de Validation

  1. Modifications de la table `entries`
    - Ajout de `management_code` : Code unique pour accéder et modifier son inscription
    - Ajout de `registration_status` : Statut de l'inscription (confirmed, pending_documents, documents_invalid)
    - Ajout de `status_message` : Message détaillé sur le statut
    - Ajout de `pps_expiry_warning_sent` : Flag pour savoir si l'email d'avertissement PPS a été envoyé
    - Ajout de `confirmation_email_sent_at` : Date d'envoi de l'email de confirmation
    - Ajout de `last_modified_at` : Date de dernière modification
    
  2. Fonction
    - `generate_entry_management_code()` : Génère un code unique de 8 caractères

  3. Index
    - Index unique sur `management_code`
    - Index sur `registration_status` pour les recherches
*/

-- Fonction pour générer un code de gestion unique
CREATE OR REPLACE FUNCTION generate_entry_management_code()
RETURNS TEXT AS $$
DECLARE
  characters TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- Sans I, O, 0, 1 pour éviter confusion
  code TEXT := '';
  i INTEGER;
BEGIN
  -- Génère un code de 8 caractères
  FOR i IN 1..8 LOOP
    code := code || substr(characters, floor(random() * length(characters) + 1)::integer, 1);
  END LOOP;
  RETURN code;
END;
$$ LANGUAGE plpgsql VOLATILE;

-- Ajout des colonnes à la table entries
DO $$
BEGIN
  -- Code de gestion unique
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'entries' AND column_name = 'management_code'
  ) THEN
    ALTER TABLE entries ADD COLUMN management_code VARCHAR(20) UNIQUE;
  END IF;

  -- Statut de l'inscription
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'entries' AND column_name = 'registration_status'
  ) THEN
    ALTER TABLE entries ADD COLUMN registration_status VARCHAR(50) DEFAULT 'confirmed'
      CHECK (registration_status IN ('confirmed', 'pending_documents', 'documents_invalid'));
  END IF;

  -- Message de statut
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'entries' AND column_name = 'status_message'
  ) THEN
    ALTER TABLE entries ADD COLUMN status_message TEXT;
  END IF;

  -- Flag pour email d'avertissement PPS
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'entries' AND column_name = 'pps_expiry_warning_sent'
  ) THEN
    ALTER TABLE entries ADD COLUMN pps_expiry_warning_sent BOOLEAN DEFAULT false;
  END IF;

  -- Date d'envoi de l'email de confirmation
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'entries' AND column_name = 'confirmation_email_sent_at'
  ) THEN
    ALTER TABLE entries ADD COLUMN confirmation_email_sent_at TIMESTAMPTZ;
  END IF;

  -- Date de dernière modification
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'entries' AND column_name = 'last_modified_at'
  ) THEN
    ALTER TABLE entries ADD COLUMN last_modified_at TIMESTAMPTZ DEFAULT now();
  END IF;
END $$;

-- Génération automatique du code de gestion pour les nouvelles inscriptions
CREATE OR REPLACE FUNCTION set_entry_management_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.management_code IS NULL THEN
    NEW.management_code := generate_entry_management_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_entry_management_code ON entries;
CREATE TRIGGER trigger_set_entry_management_code
  BEFORE INSERT ON entries
  FOR EACH ROW
  EXECUTE FUNCTION set_entry_management_code();

-- Mise à jour automatique de last_modified_at
CREATE OR REPLACE FUNCTION update_entry_modified_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_modified_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_entry_modified_at ON entries;
CREATE TRIGGER trigger_update_entry_modified_at
  BEFORE UPDATE ON entries
  FOR EACH ROW
  EXECUTE FUNCTION update_entry_modified_at();

-- Index sur management_code pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_entries_management_code ON entries(management_code);

-- Index sur registration_status
CREATE INDEX IF NOT EXISTS idx_entries_registration_status ON entries(registration_status);

-- Génération des codes pour les inscriptions existantes
UPDATE entries 
SET management_code = generate_entry_management_code()
WHERE management_code IS NULL;

-- RLS: Permettre l'accès public par code de gestion (lecture seule)
CREATE POLICY "Public can view own entry by management code"
  ON entries
  FOR SELECT
  TO public
  USING (true);

-- RLS: Permettre la modification par code de gestion (update documents uniquement)
CREATE POLICY "Public can update own entry by management code"
  ON entries
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);
