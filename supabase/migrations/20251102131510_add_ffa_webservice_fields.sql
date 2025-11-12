/*
  # Ajout des champs pour l'intégration Webservice FFA

  1. Nouveaux champs settings
    - ffa_api_uid (text) : Identifiant SIFFA pour le webservice
    - ffa_api_password (text) : Mot de passe SIFFA crypté

  2. Nouveaux champs athletes
    - ffa_club_code (text) : Code du club FFA
    - ffa_club_name (text) : Nom du club FFA
    - ffa_league (text) : Ligue FFA (région)
    - ffa_department (text) : Département FFA

  3. Nouveaux champs entries
    - ffa_verified (boolean) : Licence vérifiée via FFA
    - ffa_verification_date (timestamptz) : Date de vérification
    - ffa_license_type (text) : Type de licence FFA (COMP, ENTR, LOISR, etc.)
    - ffa_requires_certificate (boolean) : Certificat médical requis
    - ffa_is_transferred (boolean) : Athlète muté
    - ffa_verification_message (text) : Message de vérification FFA

  4. Index
    - Index sur les vérifications FFA récentes
*/

-- ============================================
-- SETTINGS : Identifiants FFA
-- ============================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'settings' AND column_name = 'ffa_api_uid'
  ) THEN
    ALTER TABLE settings
      ADD COLUMN ffa_api_uid text,
      ADD COLUMN ffa_api_password text;
  END IF;
END $$;

COMMENT ON COLUMN settings.ffa_api_uid IS 'Identifiant utilisateur SIFFA pour le webservice FFA';
COMMENT ON COLUMN settings.ffa_api_password IS 'Mot de passe SIFFA (crypté)';

-- ============================================
-- ATHLETES : Informations FFA complémentaires
-- ============================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'athletes' AND column_name = 'ffa_club_code'
  ) THEN
    ALTER TABLE athletes
      ADD COLUMN ffa_club_code text,
      ADD COLUMN ffa_club_name text,
      ADD COLUMN ffa_league text,
      ADD COLUMN ffa_department text;
  END IF;
END $$;

COMMENT ON COLUMN athletes.ffa_club_code IS 'Code du club FFA (STRCODNUM_CLU)';
COMMENT ON COLUMN athletes.ffa_club_name IS 'Nom du club FFA (STRNOM_CLU)';
COMMENT ON COLUMN athletes.ffa_league IS 'Ligue FFA (STRNOMABR_LIG)';
COMMENT ON COLUMN athletes.ffa_department IS 'Département FFA (STRNOMABR_DEP)';

-- ============================================
-- ENTRIES : Résultats vérification FFA
-- ============================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'entries' AND column_name = 'ffa_verified'
  ) THEN
    ALTER TABLE entries
      ADD COLUMN ffa_verified boolean DEFAULT false,
      ADD COLUMN ffa_verification_date timestamptz,
      ADD COLUMN ffa_license_type text,
      ADD COLUMN ffa_requires_certificate boolean DEFAULT false,
      ADD COLUMN ffa_is_transferred boolean DEFAULT false,
      ADD COLUMN ffa_verification_message text;
  END IF;
END $$;

COMMENT ON COLUMN entries.ffa_verified IS 'Licence vérifiée via le webservice FFA (INFOFLG + RELFLG = O)';
COMMENT ON COLUMN entries.ffa_verification_date IS 'Date et heure de la vérification FFA';
COMMENT ON COLUMN entries.ffa_license_type IS 'Type de licence FFA (COMP, ENTR, LOISR, TP365, CF01, etc.)';
COMMENT ON COLUMN entries.ffa_requires_certificate IS 'Certificat médical requis selon FFA (CERTIFFLG = O)';
COMMENT ON COLUMN entries.ffa_is_transferred IS 'Athlète muté sportif (MUTFLG = O)';
COMMENT ON COLUMN entries.ffa_verification_message IS 'Message retourné par le webservice FFA';

-- ============================================
-- INDEX
-- ============================================

CREATE INDEX IF NOT EXISTS idx_entries_ffa_verified ON entries(ffa_verified, ffa_verification_date)
  WHERE ffa_verified = true;

CREATE INDEX IF NOT EXISTS idx_athletes_ffa_club ON athletes(ffa_club_code)
  WHERE ffa_club_code IS NOT NULL;

-- ============================================
-- VUE : Inscriptions avec vérification FFA
-- ============================================

CREATE OR REPLACE VIEW entries_ffa_verified AS
SELECT
  e.id,
  e.athlete_id,
  a.first_name,
  a.last_name,
  a.email,
  a.license_number,
  a.license_issued_by,
  e.race_id,
  r.name as race_name,
  ev.name as event_name,
  ev.ffa_affiliated,
  ev.ffa_calorg_code,
  e.ffa_verified,
  e.ffa_verification_date,
  e.ffa_license_type,
  e.ffa_requires_certificate,
  e.ffa_is_transferred,
  e.ffa_verification_message,
  a.ffa_club_name,
  a.ffa_club_code,
  CASE
    WHEN e.ffa_verified = false THEN 'Non vérifié'
    WHEN e.ffa_requires_certificate = true THEN 'Certificat médical requis'
    WHEN e.ffa_is_transferred = true THEN 'Athlète muté'
    ELSE 'Validé'
  END as status_label
FROM entries e
JOIN athletes a ON a.id = e.athlete_id
JOIN races r ON r.id = e.race_id
JOIN events ev ON ev.id = r.event_id
WHERE ev.ffa_affiliated = true
ORDER BY e.ffa_verification_date DESC NULLS LAST;

COMMENT ON VIEW entries_ffa_verified IS 'Vue des inscriptions avec statut de vérification FFA pour événements affiliés';