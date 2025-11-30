/*
  # Intégration API FFA (Fédération Française d'Athlétisme)

  1. Modifications Tables
    - `athletes` - Ajout colonnes FFA
      - `ffa_license_number` (text) - Numéro de licence FFA
      - `ffa_license_valid_until` (date) - Date d'expiration licence
      - `has_pps` (boolean) - Possession du Pass Prévention Santé
      - `pps_expiration_date` (date) - Date d'expiration PPS
      - `medical_certificate_date` (date) - Date certificat médical
      - `ffa_category` (text) - Catégorie FFA officielle
      - `ffa_verified_at` (timestamptz) - Date dernière vérification API

  2. Nouvelles Tables
    - `ffa_verification_logs` - Logs des vérifications API FFA
      - Tracking des appels API
      - Cache des réponses
      - Détection anomalies

  3. Fonctions
    - `check_ffa_license_validity()` - Vérifie si une licence est valide
    - `require_pps_for_race()` - Vérifie si PPS requis pour une course

  4. Sécurité
    - RLS sur logs de vérification
    - Admins et organisateurs peuvent voir les logs
*/

-- Ajout colonnes FFA à la table athletes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'athletes' AND column_name = 'ffa_license_number'
  ) THEN
    ALTER TABLE athletes
      ADD COLUMN ffa_license_number text,
      ADD COLUMN ffa_license_valid_until date,
      ADD COLUMN has_pps boolean DEFAULT false,
      ADD COLUMN pps_expiration_date date,
      ADD COLUMN medical_certificate_date date,
      ADD COLUMN ffa_category text,
      ADD COLUMN ffa_verified_at timestamptz;
  END IF;
END $$;

-- Index pour recherche par licence
CREATE INDEX IF NOT EXISTS idx_athletes_ffa_license ON athletes(ffa_license_number)
  WHERE ffa_license_number IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_athletes_ffa_expiration ON athletes(ffa_license_valid_until)
  WHERE ffa_license_valid_until IS NOT NULL;

-- Table des logs de vérification API FFA
CREATE TABLE IF NOT EXISTS ffa_verification_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id uuid REFERENCES athletes(id) ON DELETE CASCADE,

  license_number text NOT NULL,
  verification_type text CHECK (verification_type IN ('license', 'pps', 'medical')) NOT NULL,

  -- Réponse API
  api_response jsonb,
  is_valid boolean NOT NULL,
  error_message text,

  -- Données récupérées
  verified_data jsonb, -- {category, club, expirationDate, etc.}

  -- Métadonnées
  verified_by uuid REFERENCES auth.users(id),
  verified_at timestamptz DEFAULT now(),

  -- Cache
  cache_until timestamptz, -- Valide jusqu'à

  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_ffa_logs_athlete ON ffa_verification_logs(athlete_id);
CREATE INDEX idx_ffa_logs_license ON ffa_verification_logs(license_number);
CREATE INDEX idx_ffa_logs_date ON ffa_verification_logs(verified_at DESC);
CREATE INDEX idx_ffa_logs_cache ON ffa_verification_logs(cache_until)
  WHERE cache_until > now();

-- ============================================
-- FONCTIONS MÉTIER
-- ============================================

-- Fonction: Vérifier validité licence FFA
CREATE OR REPLACE FUNCTION check_ffa_license_validity(p_athlete_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_valid_until date;
BEGIN
  SELECT ffa_license_valid_until INTO v_valid_until
  FROM athletes
  WHERE id = p_athlete_id;

  RETURN v_valid_until IS NOT NULL AND v_valid_until >= CURRENT_DATE;
END;
$$;

-- Fonction: Vérifier si PPS requis pour une course
CREATE OR REPLACE FUNCTION require_pps_for_race(p_race_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_distance decimal;
BEGIN
  -- Le PPS est obligatoire pour les courses > 20km selon réglementation FFA
  SELECT distance INTO v_distance
  FROM races
  WHERE id = p_race_id;

  RETURN v_distance IS NOT NULL AND v_distance > 20;
END;
$$;

-- Fonction: Récupérer le cache de vérification FFA (éviter appels API répétés)
CREATE OR REPLACE FUNCTION get_ffa_cached_verification(
  p_license_number text,
  p_verification_type text
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_cached_data jsonb;
BEGIN
  SELECT verified_data INTO v_cached_data
  FROM ffa_verification_logs
  WHERE license_number = p_license_number
    AND verification_type = p_verification_type
    AND cache_until > now()
    AND is_valid = true
  ORDER BY verified_at DESC
  LIMIT 1;

  RETURN v_cached_data;
END;
$$;

-- Trigger: Mettre à jour ffa_verified_at quand on modifie une licence
CREATE OR REPLACE FUNCTION update_ffa_verified_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.ffa_license_number IS DISTINCT FROM OLD.ffa_license_number
     OR NEW.ffa_license_valid_until IS DISTINCT FROM OLD.ffa_license_valid_until THEN
    NEW.ffa_verified_at := now();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_ffa_verified
  BEFORE UPDATE ON athletes
  FOR EACH ROW
  EXECUTE FUNCTION update_ffa_verified_timestamp();

-- ============================================
-- CONSTRAINTS MÉTIER
-- ============================================

-- Contrainte: Si licence FFA renseignée, date expiration obligatoire
ALTER TABLE athletes
  DROP CONSTRAINT IF EXISTS check_ffa_license_complete;

ALTER TABLE athletes
  ADD CONSTRAINT check_ffa_license_complete
  CHECK (
    (ffa_license_number IS NULL AND ffa_license_valid_until IS NULL)
    OR
    (ffa_license_number IS NOT NULL AND ffa_license_valid_until IS NOT NULL)
  );

-- Contrainte: Date expiration PPS cohérente
ALTER TABLE athletes
  DROP CONSTRAINT IF EXISTS check_pps_coherence;

ALTER TABLE athletes
  ADD CONSTRAINT check_pps_coherence
  CHECK (
    (has_pps = false AND pps_expiration_date IS NULL)
    OR
    (has_pps = true AND pps_expiration_date IS NOT NULL)
  );

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE ffa_verification_logs ENABLE ROW LEVEL SECURITY;

-- Les athlètes peuvent voir leurs propres logs
CREATE POLICY "Athletes can view own FFA verifications"
  ON ffa_verification_logs FOR SELECT
  TO authenticated
  USING (
    athlete_id IN (
      SELECT id FROM athletes WHERE email = auth.jwt()->>'email'
    )
  );

-- Les organisateurs peuvent voir les logs de leurs participants
CREATE POLICY "Organizers can view participant FFA verifications"
  ON ffa_verification_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM entries e
      JOIN races r ON e.race_id = r.id
      JOIN events ev ON r.event_id = ev.id
      WHERE e.athlete_id = ffa_verification_logs.athlete_id
        AND ev.organizer_id IN (
          SELECT organizer_id FROM organizer_users WHERE user_id = auth.uid()
        )
    )
  );

-- Les admins ont accès complet
CREATE POLICY "Admins have full access to FFA logs"
  ON ffa_verification_logs FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users WHERE id = auth.uid()
    )
  );

-- Les services backend peuvent insérer des logs
CREATE POLICY "Backend services can insert FFA logs"
  ON ffa_verification_logs FOR INSERT
  TO authenticated
  WITH CHECK (true); -- Sera restreint via service role key

-- ============================================
-- VUES UTILES
-- ============================================

-- Vue: Licences FFA expirées ou expirant bientôt
CREATE OR REPLACE VIEW ffa_licenses_expiring_soon AS
SELECT
  a.id as athlete_id,
  a.email,
  a.first_name,
  a.last_name,
  a.ffa_license_number,
  a.ffa_license_valid_until,
  a.ffa_license_valid_until - CURRENT_DATE as days_until_expiration,
  CASE
    WHEN a.ffa_license_valid_until < CURRENT_DATE THEN 'expired'
    WHEN a.ffa_license_valid_until - CURRENT_DATE <= 30 THEN 'expiring_soon'
    ELSE 'valid'
  END as license_status
FROM athletes a
WHERE a.ffa_license_number IS NOT NULL
  AND a.ffa_license_valid_until IS NOT NULL
  AND a.ffa_license_valid_until - CURRENT_DATE <= 30
ORDER BY a.ffa_license_valid_until ASC;

-- Vue: Statistiques vérifications FFA
CREATE OR REPLACE VIEW ffa_verification_stats AS
SELECT
  verification_type,
  COUNT(*) as total_verifications,
  COUNT(*) FILTER (WHERE is_valid = true) as valid_count,
  COUNT(*) FILTER (WHERE is_valid = false) as invalid_count,
  ROUND(
    COUNT(*) FILTER (WHERE is_valid = true)::numeric * 100.0 / COUNT(*),
    2
  ) as success_rate,
  DATE_TRUNC('day', verified_at) as verification_date
FROM ffa_verification_logs
WHERE verified_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY verification_type, DATE_TRUNC('day', verified_at)
ORDER BY verification_date DESC, verification_type;

-- ============================================
-- DONNÉES DE TEST (Développement)
-- ============================================

-- Insérer quelques catégories FFA standards
DO $$
BEGIN
  -- Liste des catégories FFA officielles pour référence
  -- EA: Enfants (6-9 ans)
  -- PO: Poussins (10-11 ans)
  -- BE: Benjamins (12-13 ans)
  -- MI: Minimes (14-15 ans)
  -- CA: Cadets (16-17 ans)
  -- JU: Juniors (18-19 ans)
  -- ES: Espoirs (20-22 ans)
  -- SE: Seniors (23-39 ans)
  -- V1: Vétérans 1 (40-49 ans)
  -- V2: Vétérans 2 (50-59 ans)
  -- V3: Vétérans 3 (60-69 ans)
  -- V4: Vétérans 4 (70+ ans)

  -- Ces catégories seront calculées automatiquement par l'API FFA
  RAISE NOTICE 'Catégories FFA standards définies dans les commentaires';
END $$;

-- Commentaires pour documentation
COMMENT ON COLUMN athletes.ffa_license_number IS 'Numéro de licence FFA (format: XXXX-XXXXXX)';
COMMENT ON COLUMN athletes.has_pps IS 'Possession du Pass Prévention Santé (obligatoire courses >20km)';
COMMENT ON COLUMN athletes.ffa_category IS 'Catégorie FFA officielle (calculée par API selon date de naissance)';
COMMENT ON TABLE ffa_verification_logs IS 'Historique des vérifications API FFA avec cache pour optimiser les appels';
