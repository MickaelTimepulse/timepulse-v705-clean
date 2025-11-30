/*
  # Autoriser inscription avec licence/PPS expiré + avertissement

  1. Modifications logique
    - Inscription autorisée même si licence/PPS expirera avant l'épreuve
    - Retour d'un warning pour informer l'utilisateur
    - Ajout d'un champ pour suivre les documents à renouveler

  2. Nouveaux champs entries
    - requires_document_renewal (boolean) : Document à renouveler
    - renewal_reminder_sent (boolean) : Rappel envoyé
    - renewal_document_type (text) : Type de document (license/pps)
    - renewal_deadline (date) : Date limite de renouvellement

  3. Règles
    - PPS valide 3 mois
    - Licence FFA valide du 1er septembre au 31 août
*/

-- ============================================
-- ENTRIES : Suivi renouvellement documents
-- ============================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'entries' AND column_name = 'requires_document_renewal'
  ) THEN
    ALTER TABLE entries
      ADD COLUMN requires_document_renewal boolean DEFAULT false,
      ADD COLUMN renewal_reminder_sent boolean DEFAULT false,
      ADD COLUMN renewal_document_type text CHECK (renewal_document_type IN ('license', 'pps', 'health_questionnaire', 'parental_authorization')),
      ADD COLUMN renewal_deadline date,
      ADD COLUMN renewal_warning_message text;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_entries_renewal_required ON entries(requires_document_renewal, renewal_deadline)
  WHERE requires_document_renewal = true;

-- ============================================
-- FONCTIONS AMÉLIORÉES
-- ============================================

-- Fonction: Vérifier éligibilité FFA avec avertissements
CREATE OR REPLACE FUNCTION check_ffa_eligibility_with_warnings(
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
  v_will_expire boolean;
  v_warning_message text;
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
    v_will_expire := v_athlete.license_valid_until IS NULL OR v_athlete.license_valid_until < p_event_date;
    
    IF v_will_expire THEN
      v_warning_message := 'Votre licence FFA expire le ' || 
        COALESCE(v_athlete.license_valid_until::text, 'date inconnue') || 
        '. Vous devrez la renouveler avant le ' || p_event_date::text || 
        '. Les licences FFA sont valides du 1er septembre au 31 août.';
      
      RETURN jsonb_build_object(
        'valid', true,
        'warning', true,
        'reason', 'Inscription autorisée mais licence à renouveler',
        'warning_message', v_warning_message,
        'license_number', v_athlete.license_number,
        'club', v_athlete.license_club,
        'licensed', true,
        'age_at_event', v_age_at_event,
        'expiration_date', v_athlete.license_valid_until,
        'requires_renewal', true,
        'renewal_type', 'license',
        'renewal_deadline', p_event_date
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
        'required', 'pps',
        'info', 'Un PPS est valide 3 mois'
      );
    END IF;

    v_will_expire := v_athlete.pps_valid_until IS NULL OR v_athlete.pps_valid_until < p_event_date;
    
    IF v_will_expire THEN
      v_warning_message := 'Votre PPS expire le ' || 
        COALESCE(v_athlete.pps_valid_until::text, 'date inconnue') || 
        '. Vous devrez le renouveler avant le ' || p_event_date::text || 
        '. Un PPS est valide 3 mois.';
      
      RETURN jsonb_build_object(
        'valid', true,
        'warning', true,
        'reason', 'Inscription autorisée mais PPS à renouveler',
        'warning_message', v_warning_message,
        'pps_number', v_athlete.pps_number,
        'licensed', false,
        'age_at_event', v_age_at_event,
        'expiration_date', v_athlete.pps_valid_until,
        'requires_renewal', true,
        'renewal_type', 'pps',
        'renewal_deadline', p_event_date
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

-- Remplacer la fonction existante
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
  RETURN check_ffa_eligibility_with_warnings(p_athlete_id, p_race_id, p_event_date);
END;
$$;

-- ============================================
-- VUES
-- ============================================

-- Vue: Inscriptions avec documents à renouveler
CREATE OR REPLACE VIEW entries_requiring_document_renewal AS
SELECT
  e.id as entry_id,
  e.athlete_id,
  a.first_name,
  a.last_name,
  a.email,
  e.race_id,
  r.name as race_name,
  ev.name as event_name,
  ev.start_date as event_date,
  e.renewal_document_type,
  e.renewal_deadline,
  e.renewal_warning_message,
  e.renewal_reminder_sent,
  CASE
    WHEN e.renewal_deadline < CURRENT_DATE THEN 'Expiré'
    WHEN e.renewal_deadline - CURRENT_DATE <= 30 THEN 'Urgent (< 30 jours)'
    WHEN e.renewal_deadline - CURRENT_DATE <= 60 THEN 'À renouveler bientôt (< 60 jours)'
    ELSE 'À surveiller'
  END as urgency,
  e.renewal_deadline - CURRENT_DATE as days_until_deadline
FROM entries e
JOIN athletes a ON a.id = e.athlete_id
JOIN races r ON r.id = e.race_id
JOIN events ev ON ev.id = r.event_id
WHERE e.requires_document_renewal = true
ORDER BY e.renewal_deadline ASC, urgency DESC;

-- Vue: Licences FFA expirant par saison
CREATE OR REPLACE VIEW ffa_licenses_by_season AS
SELECT
  a.id,
  a.email,
  a.first_name,
  a.last_name,
  a.license_number,
  a.license_valid_until,
  a.license_club,
  CASE
    WHEN EXTRACT(MONTH FROM CURRENT_DATE) >= 9 THEN 
      EXTRACT(YEAR FROM CURRENT_DATE) || '-' || (EXTRACT(YEAR FROM CURRENT_DATE) + 1)
    ELSE 
      (EXTRACT(YEAR FROM CURRENT_DATE) - 1) || '-' || EXTRACT(YEAR FROM CURRENT_DATE)
  END as current_season,
  CASE
    WHEN a.license_valid_until >= make_date(
      CASE WHEN EXTRACT(MONTH FROM CURRENT_DATE) >= 9 
        THEN EXTRACT(YEAR FROM CURRENT_DATE)::int + 1
        ELSE EXTRACT(YEAR FROM CURRENT_DATE)::int
      END, 8, 31
    ) THEN 'Valide saison en cours'
    ELSE 'À renouveler'
  END as status
FROM athletes a
WHERE a.license_number IS NOT NULL
  AND a.license_issued_by = 'FFA'
ORDER BY a.license_valid_until DESC;

-- Vue: PPS à renouveler (3 mois de validité)
CREATE OR REPLACE VIEW pps_expiring_soon AS
SELECT
  a.id,
  a.email,
  a.first_name,
  a.last_name,
  a.pps_number,
  a.pps_valid_until,
  CURRENT_DATE - a.pps_valid_until as days_expired,
  CASE
    WHEN a.pps_valid_until < CURRENT_DATE THEN 'Expiré'
    WHEN a.pps_valid_until - CURRENT_DATE <= 15 THEN 'Expire dans 15 jours'
    WHEN a.pps_valid_until - CURRENT_DATE <= 30 THEN 'Expire dans 30 jours'
    ELSE 'Valide'
  END as status
FROM athletes a
WHERE a.pps_number IS NOT NULL
  AND a.pps_valid_until IS NOT NULL
  AND a.pps_valid_until - CURRENT_DATE <= 30
ORDER BY a.pps_valid_until ASC;

-- ============================================
-- COMMENTAIRES
-- ============================================

COMMENT ON COLUMN entries.requires_document_renewal IS 'Indique si un document (licence/PPS) doit être renouvelé avant l''épreuve';
COMMENT ON COLUMN entries.renewal_document_type IS 'Type de document à renouveler : license, pps, health_questionnaire, parental_authorization';
COMMENT ON COLUMN entries.renewal_deadline IS 'Date limite de renouvellement (= date de l''épreuve)';
COMMENT ON VIEW entries_requiring_document_renewal IS 'Liste des inscriptions nécessitant un renouvellement de document avec niveau d''urgence';
COMMENT ON VIEW ffa_licenses_by_season IS 'Licences FFA par saison (1er sept - 31 août)';
COMMENT ON VIEW pps_expiring_soon IS 'PPS expirant dans les 30 jours (validité 3 mois)';