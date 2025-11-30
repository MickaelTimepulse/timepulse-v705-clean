/*
  # Ajout Code CalOrg et Support PPS FFA

  1. Modifications Événements
    - `ffa_calorg_code` : Code de l'épreuve sur calorg.athle.fr
    - `ffa_affiliated` : Indique si l'événement est affilié FFA
    - `ffa_verification_status` : Statut de vérification API FFA

  2. Améliorations Athletes
    - `ffa_club_code` : Code du club FFA
    - `ffa_club_name` : Nom du club
    - `ffa_league` : Ligue (région FFA)
    - `ffa_department` : Département du club
    - `pps_number` : Numéro PPS pour non-licenciés
    - `pps_valid_until` : Date de validité PPS

  3. Fonctions
    - verify_pps_at_date : Vérifie si un PPS est valide à une date
    - can_participate_in_ffa_race : Vérifie l'éligibilité FFA
*/

-- ÉVÉNEMENTS
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'ffa_calorg_code'
  ) THEN
    ALTER TABLE events
      ADD COLUMN ffa_calorg_code text,
      ADD COLUMN ffa_affiliated boolean DEFAULT false,
      ADD COLUMN ffa_verification_status text CHECK (ffa_verification_status IN ('pending', 'verified', 'error')) DEFAULT 'pending';
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_events_ffa_calorg ON events(ffa_calorg_code)
  WHERE ffa_calorg_code IS NOT NULL;

ALTER TABLE events DROP CONSTRAINT IF EXISTS check_ffa_affiliation_complete;
ALTER TABLE events
  ADD CONSTRAINT check_ffa_affiliation_complete
  CHECK (
    (ffa_affiliated = false AND ffa_calorg_code IS NULL)
    OR
    (ffa_affiliated = true AND ffa_calorg_code IS NOT NULL)
  );

-- ATHLETES
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
      ADD COLUMN ffa_department text,
      ADD COLUMN pps_number text,
      ADD COLUMN pps_valid_until date;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_athletes_pps_number ON athletes(pps_number) WHERE pps_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_athletes_club_code ON athletes(ffa_club_code) WHERE ffa_club_code IS NOT NULL;

ALTER TABLE athletes DROP CONSTRAINT IF EXISTS check_pps_number_coherence;
ALTER TABLE athletes
  ADD CONSTRAINT check_pps_number_coherence
  CHECK (
    (pps_number IS NULL AND pps_valid_until IS NULL)
    OR
    (pps_number IS NOT NULL AND pps_valid_until IS NOT NULL)
  );

-- FONCTION: Vérifier PPS à une date
CREATE OR REPLACE FUNCTION verify_pps_at_date(
  p_pps_number text,
  p_event_date date
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
DECLARE
  v_athlete athletes%ROWTYPE;
BEGIN
  SELECT * INTO v_athlete FROM athletes WHERE pps_number = p_pps_number;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'PPS non trouvé', 'pps_number', p_pps_number);
  END IF;

  IF v_athlete.pps_valid_until IS NULL THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'Date de validité PPS non renseignée', 'pps_number', p_pps_number);
  END IF;

  IF v_athlete.pps_valid_until < p_event_date THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'PPS expiré', 'pps_number', p_pps_number, 'expiration_date', v_athlete.pps_valid_until);
  END IF;

  RETURN jsonb_build_object('valid', true, 'pps_number', p_pps_number, 'athlete_id', v_athlete.id, 'expiration_date', v_athlete.pps_valid_until);
END;
$$;

-- FONCTION: Vérifier éligibilité course FFA
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
DECLARE
  v_athlete athletes%ROWTYPE;
  v_race races%ROWTYPE;
  v_event events%ROWTYPE;
  v_requires_pps boolean;
BEGIN
  SELECT * INTO v_athlete FROM athletes WHERE id = p_athlete_id;
  SELECT * INTO v_race FROM races WHERE id = p_race_id;
  SELECT * INTO v_event FROM events WHERE id = v_race.event_id;

  IF NOT FOUND OR v_athlete.id IS NULL THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'Données introuvables');
  END IF;

  IF v_event.ffa_affiliated = false OR v_event.ffa_affiliated IS NULL THEN
    RETURN jsonb_build_object('valid', true, 'reason', 'Événement non FFA');
  END IF;

  v_requires_pps := v_race.distance > 20;

  IF v_athlete.ffa_license_number IS NOT NULL THEN
    IF v_athlete.ffa_license_valid_until IS NULL OR v_athlete.ffa_license_valid_until < p_event_date THEN
      RETURN jsonb_build_object('valid', false, 'reason', 'Licence FFA expirée', 'expiration_date', v_athlete.ffa_license_valid_until);
    END IF;

    IF v_requires_pps AND (v_athlete.has_pps = false OR v_athlete.pps_expiration_date < p_event_date) THEN
      RETURN jsonb_build_object('valid', false, 'reason', 'PPS requis (> 20km)', 'distance', v_race.distance);
    END IF;

    RETURN jsonb_build_object('valid', true, 'reason', 'Licence FFA valide', 'license_number', v_athlete.ffa_license_number, 'club', v_athlete.ffa_club_name);
  END IF;

  IF v_athlete.pps_number IS NOT NULL THEN
    IF v_athlete.pps_valid_until IS NULL OR v_athlete.pps_valid_until < p_event_date THEN
      RETURN jsonb_build_object('valid', false, 'reason', 'PPS non valide', 'pps_number', v_athlete.pps_number);
    END IF;

    RETURN jsonb_build_object('valid', true, 'reason', 'PPS valide', 'pps_number', v_athlete.pps_number);
  END IF;

  RETURN jsonb_build_object('valid', false, 'reason', 'Licence FFA ou PPS requis');
END;
$$;

COMMENT ON COLUMN events.ffa_calorg_code IS 'Code CalOrg: code de l''épreuve sur calorg.athle.fr - obligatoire pour événements FFA';
COMMENT ON COLUMN athletes.pps_number IS 'Numéro Pass Prévention Santé vérifié sur pps.athle.fr';
COMMENT ON COLUMN athletes.ffa_club_code IS 'Code du club FFA (ex: 044001)';
COMMENT ON COLUMN athletes.ffa_league IS 'Ligue FFA (ex: Pays de la Loire)';
COMMENT ON COLUMN athletes.ffa_department IS 'Département (ex: 44 - Loire-Atlantique)';