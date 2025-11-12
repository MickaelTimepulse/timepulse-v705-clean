/*
  # Intégration API FFTri (Fédération Française de Triathlon)

  1. Modifications Tables
    - `athletes` - Ajout colonnes FFTri
      - `fftri_license_number` (text) - Numéro de licence FFTri
      - `fftri_license_valid_until` (date) - Date d'expiration licence
      - `fftri_fis_level` (text) - Niveau FIS (A, B, C, D, E)
      - `fftri_club` (text) - Club d'appartenance
      - `fftri_category` (text) - Catégorie FFTri
      - `fftri_verified_at` (timestamptz) - Date dernière vérification API
      - `fftri_suspension_until` (date) - Date fin suspension éventuelle

  2. Nouvelles Tables
    - `fftri_verification_logs` - Logs des vérifications API FFTri
    - `fftri_fis_requirements` - Exigences FIS par course

  3. Fonctions
    - `check_fftri_license_validity()` - Vérifie validité licence
    - `check_fis_level_requirement()` - Vérifie niveau FIS requis
    - `is_fftri_suspended()` - Vérifie suspension

  4. Sécurité
    - RLS sur toutes les tables
    - Cache optimisé pour limiter appels API
*/

-- Ajout colonnes FFTri à la table athletes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'athletes' AND column_name = 'fftri_license_number'
  ) THEN
    ALTER TABLE athletes
      ADD COLUMN fftri_license_number text,
      ADD COLUMN fftri_license_valid_until date,
      ADD COLUMN fftri_fis_level text CHECK (fftri_fis_level IN ('A', 'B', 'C', 'D', 'E')),
      ADD COLUMN fftri_club text,
      ADD COLUMN fftri_category text,
      ADD COLUMN fftri_verified_at timestamptz,
      ADD COLUMN fftri_suspension_until date;
  END IF;
END $$;

-- Index pour recherche par licence FFTri
CREATE INDEX IF NOT EXISTS idx_athletes_fftri_license ON athletes(fftri_license_number)
  WHERE fftri_license_number IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_athletes_fftri_fis_level ON athletes(fftri_fis_level)
  WHERE fftri_fis_level IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_athletes_fftri_suspension ON athletes(fftri_suspension_until)
  WHERE fftri_suspension_until IS NOT NULL;

-- Table des logs de vérification API FFTri
CREATE TABLE IF NOT EXISTS fftri_verification_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id uuid REFERENCES athletes(id) ON DELETE CASCADE,

  license_number text NOT NULL,
  verification_type text CHECK (verification_type IN ('license', 'fis', 'suspension')) NOT NULL,

  -- Réponse API
  api_response jsonb,
  is_valid boolean NOT NULL,
  error_message text,

  -- Données récupérées
  verified_data jsonb, -- {fisLevel, club, category, expirationDate, etc.}

  -- Métadonnées
  verified_by uuid REFERENCES auth.users(id),
  verified_at timestamptz DEFAULT now(),

  -- Cache
  cache_until timestamptz,

  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_fftri_logs_athlete ON fftri_verification_logs(athlete_id);
CREATE INDEX idx_fftri_logs_license ON fftri_verification_logs(license_number);
CREATE INDEX idx_fftri_logs_date ON fftri_verification_logs(verified_at DESC);
CREATE INDEX idx_fftri_logs_cache ON fftri_verification_logs(cache_until)
  WHERE cache_until > now();

-- Table des exigences FIS par course
CREATE TABLE IF NOT EXISTS fftri_fis_requirements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  race_id uuid REFERENCES races(id) ON DELETE CASCADE NOT NULL,

  minimum_fis_level text NOT NULL CHECK (minimum_fis_level IN ('A', 'B', 'C', 'D', 'E')),
  require_current_license boolean DEFAULT true,
  reason text, -- Justification (distance, difficulté, règlement, etc.)

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  UNIQUE(race_id)
);

CREATE INDEX idx_fftri_fis_requirements_race ON fftri_fis_requirements(race_id);

-- ============================================
-- FONCTIONS MÉTIER
-- ============================================

-- Fonction: Vérifier validité licence FFTri
CREATE OR REPLACE FUNCTION check_fftri_license_validity(p_athlete_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_valid_until date;
  v_suspension_until date;
BEGIN
  SELECT fftri_license_valid_until, fftri_suspension_until
  INTO v_valid_until, v_suspension_until
  FROM athletes
  WHERE id = p_athlete_id;

  -- Licence doit être valide ET pas suspendu
  RETURN v_valid_until IS NOT NULL
    AND v_valid_until >= CURRENT_DATE
    AND (v_suspension_until IS NULL OR v_suspension_until < CURRENT_DATE);
END;
$$;

-- Fonction: Vérifier si l'athlète est suspendu
CREATE OR REPLACE FUNCTION is_fftri_suspended(p_athlete_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_suspension_until date;
BEGIN
  SELECT fftri_suspension_until INTO v_suspension_until
  FROM athletes
  WHERE id = p_athlete_id;

  RETURN v_suspension_until IS NOT NULL AND v_suspension_until >= CURRENT_DATE;
END;
$$;

-- Fonction: Vérifier niveau FIS requis pour une course
CREATE OR REPLACE FUNCTION check_fis_level_requirement(
  p_athlete_id uuid,
  p_race_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_athlete_fis text;
  v_required_fis text;
  v_fis_order text[] := ARRAY['E', 'D', 'C', 'B', 'A']; -- Ordre croissant
  v_athlete_pos integer;
  v_required_pos integer;
  v_meets_requirement boolean;
BEGIN
  -- Récupérer le niveau FIS de l'athlète
  SELECT fftri_fis_level INTO v_athlete_fis
  FROM athletes
  WHERE id = p_athlete_id;

  -- Récupérer le niveau FIS requis pour la course
  SELECT minimum_fis_level INTO v_required_fis
  FROM fftri_fis_requirements
  WHERE race_id = p_race_id;

  -- Si pas d'exigence FIS, OK
  IF v_required_fis IS NULL THEN
    RETURN jsonb_build_object(
      'meetsRequirement', true,
      'athleteFisLevel', v_athlete_fis,
      'requiredFisLevel', null,
      'message', 'Aucune exigence FIS pour cette course'
    );
  END IF;

  -- Si athlète n'a pas de FIS, KO
  IF v_athlete_fis IS NULL THEN
    RETURN jsonb_build_object(
      'meetsRequirement', false,
      'athleteFisLevel', null,
      'requiredFisLevel', v_required_fis,
      'message', 'Licence FFTri requise avec niveau FIS ' || v_required_fis || ' minimum'
    );
  END IF;

  -- Comparer les niveaux FIS
  v_athlete_pos := array_position(v_fis_order, v_athlete_fis);
  v_required_pos := array_position(v_fis_order, v_required_fis);

  v_meets_requirement := v_athlete_pos >= v_required_pos;

  RETURN jsonb_build_object(
    'meetsRequirement', v_meets_requirement,
    'athleteFisLevel', v_athlete_fis,
    'requiredFisLevel', v_required_fis,
    'message', CASE
      WHEN v_meets_requirement THEN 'Niveau FIS suffisant'
      ELSE 'Niveau FIS insuffisant (requis: ' || v_required_fis || ' ou supérieur)'
    END
  );
END;
$$;

-- Fonction: Récupérer le cache de vérification FFTri
CREATE OR REPLACE FUNCTION get_fftri_cached_verification(
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
  FROM fftri_verification_logs
  WHERE license_number = p_license_number
    AND verification_type = p_verification_type
    AND cache_until > now()
    AND is_valid = true
  ORDER BY verified_at DESC
  LIMIT 1;

  RETURN v_cached_data;
END;
$$;

-- Trigger: Mettre à jour fftri_verified_at
CREATE OR REPLACE FUNCTION update_fftri_verified_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.fftri_license_number IS DISTINCT FROM OLD.fftri_license_number
     OR NEW.fftri_license_valid_until IS DISTINCT FROM OLD.fftri_license_valid_until
     OR NEW.fftri_fis_level IS DISTINCT FROM OLD.fftri_fis_level THEN
    NEW.fftri_verified_at := now();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_fftri_verified
  BEFORE UPDATE ON athletes
  FOR EACH ROW
  EXECUTE FUNCTION update_fftri_verified_timestamp();

-- Trigger: updated_at pour fftri_fis_requirements
CREATE TRIGGER update_fftri_fis_requirements_updated_at
  BEFORE UPDATE ON fftri_fis_requirements
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- CONSTRAINTS MÉTIER
-- ============================================

-- Contrainte: Si licence FFTri renseignée, date expiration obligatoire
ALTER TABLE athletes
  DROP CONSTRAINT IF EXISTS check_fftri_license_complete;

ALTER TABLE athletes
  ADD CONSTRAINT check_fftri_license_complete
  CHECK (
    (fftri_license_number IS NULL AND fftri_license_valid_until IS NULL)
    OR
    (fftri_license_number IS NOT NULL AND fftri_license_valid_until IS NOT NULL)
  );

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE fftri_verification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE fftri_fis_requirements ENABLE ROW LEVEL SECURITY;

-- Logs: Les athlètes peuvent voir leurs propres logs
CREATE POLICY "Athletes can view own FFTri verifications"
  ON fftri_verification_logs FOR SELECT
  TO authenticated
  USING (
    athlete_id IN (
      SELECT id FROM athletes WHERE email = auth.jwt()->>'email'
    )
  );

-- Logs: Les organisateurs peuvent voir les logs de leurs participants
CREATE POLICY "Organizers can view participant FFTri verifications"
  ON fftri_verification_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM entries e
      JOIN races r ON e.race_id = r.id
      JOIN events ev ON r.event_id = ev.id
      WHERE e.athlete_id = fftri_verification_logs.athlete_id
        AND ev.organizer_id IN (
          SELECT organizer_id FROM organizer_users WHERE user_id = auth.uid()
        )
    )
  );

-- Logs: Admins ont accès complet
CREATE POLICY "Admins have full access to FFTri logs"
  ON fftri_verification_logs FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid())
  );

-- Logs: Backend peut insérer
CREATE POLICY "Backend services can insert FFTri logs"
  ON fftri_verification_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- FIS Requirements: Public peut voir (pour affichage règlement course)
CREATE POLICY "Public can view FIS requirements"
  ON fftri_fis_requirements FOR SELECT
  USING (true);

-- FIS Requirements: Organisateurs peuvent gérer leurs exigences
CREATE POLICY "Organizers can manage FIS requirements for their races"
  ON fftri_fis_requirements FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM races r
      JOIN events e ON r.event_id = e.id
      WHERE r.id = fftri_fis_requirements.race_id
        AND e.organizer_id IN (
          SELECT organizer_id FROM organizer_users WHERE user_id = auth.uid()
        )
    )
  );

-- FIS Requirements: Admins ont accès complet
CREATE POLICY "Admins have full access to FIS requirements"
  ON fftri_fis_requirements FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid())
  );

-- ============================================
-- VUES UTILES
-- ============================================

-- Vue: Licences FFTri expirées ou expirant bientôt
CREATE OR REPLACE VIEW fftri_licenses_expiring_soon AS
SELECT
  a.id as athlete_id,
  a.email,
  a.first_name,
  a.last_name,
  a.fftri_license_number,
  a.fftri_fis_level,
  a.fftri_club,
  a.fftri_license_valid_until,
  a.fftri_license_valid_until - CURRENT_DATE as days_until_expiration,
  CASE
    WHEN a.fftri_license_valid_until < CURRENT_DATE THEN 'expired'
    WHEN a.fftri_license_valid_until - CURRENT_DATE <= 30 THEN 'expiring_soon'
    ELSE 'valid'
  END as license_status,
  a.fftri_suspension_until,
  CASE
    WHEN a.fftri_suspension_until IS NOT NULL AND a.fftri_suspension_until >= CURRENT_DATE
    THEN true
    ELSE false
  END as is_suspended
FROM athletes a
WHERE a.fftri_license_number IS NOT NULL
  AND a.fftri_license_valid_until IS NOT NULL
  AND (
    a.fftri_license_valid_until - CURRENT_DATE <= 30
    OR (a.fftri_suspension_until IS NOT NULL AND a.fftri_suspension_until >= CURRENT_DATE)
  )
ORDER BY a.fftri_license_valid_until ASC;

-- Vue: Distribution des niveaux FIS
CREATE OR REPLACE VIEW fftri_fis_distribution AS
SELECT
  fftri_fis_level,
  COUNT(*) as athlete_count,
  ROUND(COUNT(*)::numeric * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM athletes
WHERE fftri_fis_level IS NOT NULL
  AND fftri_license_valid_until >= CURRENT_DATE
GROUP BY fftri_fis_level
ORDER BY
  CASE fftri_fis_level
    WHEN 'E' THEN 1
    WHEN 'D' THEN 2
    WHEN 'C' THEN 3
    WHEN 'B' THEN 4
    WHEN 'A' THEN 5
  END;

-- ============================================
-- COMMENTAIRES DOCUMENTATION
-- ============================================

COMMENT ON COLUMN athletes.fftri_license_number IS 'Numéro de licence FFTri';
COMMENT ON COLUMN athletes.fftri_fis_level IS 'Niveau FIS (File d''Inscription Solidaire): E (débutant) à A (élite)';
COMMENT ON COLUMN athletes.fftri_club IS 'Club FFTri d''appartenance';
COMMENT ON COLUMN athletes.fftri_suspension_until IS 'Date de fin de suspension disciplinaire éventuelle';

COMMENT ON TABLE fftri_verification_logs IS 'Historique des vérifications API FFTri avec cache';
COMMENT ON TABLE fftri_fis_requirements IS 'Exigences de niveau FIS par course (sécurité)';

-- Documentation niveaux FIS
COMMENT ON COLUMN fftri_fis_requirements.minimum_fis_level IS 'Niveau FIS minimum requis:
  - E: Débutant (découverte)
  - D: Initié (distances courtes)
  - C: Confirmé (distances moyennes)
  - B: Expert (longues distances)
  - A: Élite (ultra-distances, conditions extrêmes)';
