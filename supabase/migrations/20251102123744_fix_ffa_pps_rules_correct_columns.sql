/*
  # Correction Règles FFA et PPS - Version Finale

  1. Règles PPS corrigées
    - PPS UNIQUEMENT pour non-licenciés FFA
    - PPS requis si âge >= 18 ans
    - Pour < 18 ans : questionnaire santé + autorisation parentale

  2. Nouveaux champs
    - health_questionnaire_completed
    - health_questionnaire_date
    - parental_authorization
    - parental_authorization_date

  3. Logique
    - Licenciés : vérification via license_number
    - Non-licenciés >= 18 ans : PPS obligatoire
    - Non-licenciés < 18 ans : questionnaire + autorisation
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'athletes' AND column_name = 'health_questionnaire_completed'
  ) THEN
    ALTER TABLE athletes
      ADD COLUMN health_questionnaire_completed boolean DEFAULT false,
      ADD COLUMN health_questionnaire_date date,
      ADD COLUMN parental_authorization boolean DEFAULT false,
      ADD COLUMN parental_authorization_date date;
  END IF;
END $$;

ALTER TABLE athletes DROP CONSTRAINT IF EXISTS check_pps_coherence;
ALTER TABLE athletes DROP CONSTRAINT IF EXISTS check_pps_number_coherence;

ALTER TABLE athletes
  ADD CONSTRAINT check_pps_coherence
  CHECK (
    (pps_number IS NULL AND pps_valid_until IS NULL)
    OR
    (pps_number IS NOT NULL AND pps_valid_until IS NOT NULL)
  );

CREATE OR REPLACE FUNCTION calculate_age_at_date(
  p_birth_date date,
  p_event_date date
)
RETURNS integer
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
BEGIN
  RETURN EXTRACT(YEAR FROM age(p_event_date, p_birth_date));
END;
$$;

CREATE OR REPLACE FUNCTION check_ffa_eligibility(
  p_athlete_id uuid,
  p_race_id uuid,
  p_event_date date
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
DECLARE
  v_athlete athletes%ROWTYPE;
  v_race races%ROWTYPE;
  v_event events%ROWTYPE;
  v_age_at_event integer;
  v_is_minor boolean;
  v_has_license boolean;
BEGIN
  SELECT * INTO v_athlete FROM athletes WHERE id = p_athlete_id;
  SELECT * INTO v_race FROM races WHERE id = p_race_id;
  SELECT * INTO v_event FROM events WHERE id = v_race.event_id;

  IF NOT FOUND OR v_athlete.id IS NULL THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'Données introuvables');
  END IF;

  IF v_event.ffa_affiliated = false OR v_event.ffa_affiliated IS NULL THEN
    RETURN jsonb_build_object('valid', true, 'reason', 'Événement non affilié FFA');
  END IF;

  IF v_athlete.birthdate IS NULL THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'Date de naissance manquante');
  END IF;

  v_age_at_event := calculate_age_at_date(v_athlete.birthdate, p_event_date);
  v_is_minor := v_age_at_event < 18;
  v_has_license := v_athlete.license_number IS NOT NULL AND v_athlete.license_issued_by = 'FFA';

  -- CAS 1: LICENCIÉ FFA
  IF v_has_license THEN
    IF v_athlete.license_valid_until IS NULL OR v_athlete.license_valid_until < p_event_date THEN
      RETURN jsonb_build_object(
        'valid', false,
        'reason', 'Licence FFA expirée ou non valide',
        'expiration_date', v_athlete.license_valid_until,
        'licensed', true
      );
    END IF;

    RETURN jsonb_build_object(
      'valid', true,
      'reason', 'Licence FFA valide',
      'license_number', v_athlete.license_number,
      'club', v_athlete.license_club,
      'licensed', true,
      'age_at_event', v_age_at_event
    );
  END IF;

  -- CAS 2: NON LICENCIÉ - MAJEUR (>= 18 ans)
  IF NOT v_is_minor THEN
    IF v_athlete.pps_number IS NULL THEN
      RETURN jsonb_build_object(
        'valid', false,
        'reason', 'PPS requis pour non-licenciés majeurs (>= 18 ans)',
        'licensed', false,
        'age_at_event', v_age_at_event,
        'required', 'pps'
      );
    END IF;

    IF v_athlete.pps_valid_until IS NULL OR v_athlete.pps_valid_until < p_event_date THEN
      RETURN jsonb_build_object(
        'valid', false,
        'reason', 'PPS non valide',
        'pps_number', v_athlete.pps_number,
        'expiration_date', v_athlete.pps_valid_until,
        'licensed', false,
        'age_at_event', v_age_at_event
      );
    END IF;

    RETURN jsonb_build_object(
      'valid', true,
      'reason', 'PPS valide (majeur non-licencié)',
      'pps_number', v_athlete.pps_number,
      'licensed', false,
      'age_at_event', v_age_at_event
    );
  END IF;

  -- CAS 3: NON LICENCIÉ - MINEUR (< 18 ans)
  IF NOT v_athlete.health_questionnaire_completed THEN
    RETURN jsonb_build_object(
      'valid', false,
      'reason', 'Questionnaire de santé obligatoire pour mineurs',
      'licensed', false,
      'age_at_event', v_age_at_event,
      'required', 'health_questionnaire'
    );
  END IF;

  IF NOT v_athlete.parental_authorization THEN
    RETURN jsonb_build_object(
      'valid', false,
      'reason', 'Autorisation parentale obligatoire pour mineurs',
      'licensed', false,
      'age_at_event', v_age_at_event,
      'required', 'parental_authorization'
    );
  END IF;

  RETURN jsonb_build_object(
    'valid', true,
    'reason', 'Mineur avec documents complets',
    'licensed', false,
    'age_at_event', v_age_at_event,
    'health_questionnaire_date', v_athlete.health_questionnaire_date,
    'parental_authorization_date', v_athlete.parental_authorization_date
  );
END;
$$;

DROP FUNCTION IF EXISTS can_participate_in_ffa_race(uuid, uuid, date);

CREATE OR REPLACE FUNCTION can_participate_in_ffa_race(
  p_athlete_id uuid,
  p_race_id uuid,
  p_event_date date
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
BEGIN
  RETURN check_ffa_eligibility(p_athlete_id, p_race_id, p_event_date);
END;
$$;

CREATE OR REPLACE VIEW minors_missing_documents AS
SELECT
  a.id,
  a.email,
  a.first_name,
  a.last_name,
  a.birthdate,
  EXTRACT(YEAR FROM age(CURRENT_DATE, a.birthdate)) as current_age,
  a.health_questionnaire_completed,
  a.parental_authorization,
  CASE
    WHEN NOT a.health_questionnaire_completed AND NOT a.parental_authorization THEN 'Questionnaire + Autorisation manquants'
    WHEN NOT a.health_questionnaire_completed THEN 'Questionnaire de santé manquant'
    WHEN NOT a.parental_authorization THEN 'Autorisation parentale manquante'
    ELSE 'Documents complets'
  END as status
FROM athletes a
WHERE a.birthdate IS NOT NULL
  AND EXTRACT(YEAR FROM age(CURRENT_DATE, a.birthdate)) < 18
  AND (a.license_number IS NULL OR a.license_issued_by != 'FFA')
ORDER BY a.birthdate DESC;

CREATE OR REPLACE VIEW adults_without_pps_or_license AS
SELECT
  a.id,
  a.email,
  a.first_name,
  a.last_name,
  a.birthdate,
  EXTRACT(YEAR FROM age(CURRENT_DATE, a.birthdate)) as current_age
FROM athletes a
WHERE a.birthdate IS NOT NULL
  AND EXTRACT(YEAR FROM age(CURRENT_DATE, a.birthdate)) >= 18
  AND (a.license_number IS NULL OR a.license_issued_by != 'FFA')
  AND a.pps_number IS NULL
ORDER BY a.birthdate DESC;

COMMENT ON COLUMN athletes.pps_number IS 'PPS - UNIQUEMENT pour non-licenciés majeurs (>= 18 ans)';
COMMENT ON COLUMN athletes.health_questionnaire_completed IS 'Questionnaire santé - OBLIGATOIRE mineurs non-licenciés';
COMMENT ON COLUMN athletes.parental_authorization IS 'Autorisation parentale - OBLIGATOIRE mineurs non-licenciés';