/*
  # Synchroniser les dates d'inscription depuis les périodes de tarification

  1. Problème identifié
    - Les dates sont configurées dans `pricing_periods` (start_date, end_date)
    - Mais les fonctions SQL vérifient `events.registration_opens/closes`
    - Résultat : Les inscriptions ne se ferment jamais car registration_closes est NULL

  2. Solution
    - Créer un trigger qui synchronise automatiquement les dates
    - Quand une période de tarification est créée/modifiée
    - Les dates min/max sont mises à jour dans events.registration_opens/closes

  3. Fonctionnement
    - registration_opens = MIN(start_date) de toutes les périodes actives
    - registration_closes = MAX(end_date) de toutes les périodes actives
    - Se met à jour automatiquement
*/

-- Fonction pour synchroniser les dates d'inscription
CREATE OR REPLACE FUNCTION sync_event_registration_dates()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_event_id UUID;
  v_min_start_date TIMESTAMPTZ;
  v_max_end_date TIMESTAMPTZ;
BEGIN
  -- Récupérer l'event_id depuis la race
  IF TG_OP = 'DELETE' THEN
    SELECT event_id INTO v_event_id
    FROM races
    WHERE id = OLD.race_id;
  ELSE
    SELECT event_id INTO v_event_id
    FROM races
    WHERE id = NEW.race_id;
  END IF;

  -- Calculer les dates min/max depuis toutes les périodes actives de cet événement
  SELECT 
    MIN(pp.start_date),
    MAX(pp.end_date)
  INTO v_min_start_date, v_max_end_date
  FROM pricing_periods pp
  JOIN races r ON r.id = pp.race_id
  WHERE r.event_id = v_event_id
    AND pp.active = true;

  -- Mettre à jour l'événement avec les nouvelles dates
  UPDATE events
  SET 
    registration_opens = v_min_start_date,
    registration_closes = v_max_end_date,
    updated_at = NOW()
  WHERE id = v_event_id;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

-- Créer le trigger sur pricing_periods
DROP TRIGGER IF EXISTS trigger_sync_registration_dates ON pricing_periods;

CREATE TRIGGER trigger_sync_registration_dates
  AFTER INSERT OR UPDATE OR DELETE
  ON pricing_periods
  FOR EACH ROW
  EXECUTE FUNCTION sync_event_registration_dates();

-- Synchroniser immédiatement toutes les dates existantes
DO $$
DECLARE
  v_event RECORD;
  v_min_start_date TIMESTAMPTZ;
  v_max_end_date TIMESTAMPTZ;
BEGIN
  FOR v_event IN SELECT DISTINCT id FROM events LOOP
    -- Calculer les dates min/max pour cet événement
    SELECT 
      MIN(pp.start_date),
      MAX(pp.end_date)
    INTO v_min_start_date, v_max_end_date
    FROM pricing_periods pp
    JOIN races r ON r.id = pp.race_id
    WHERE r.event_id = v_event.id
      AND pp.active = true;

    -- Mettre à jour l'événement seulement si des périodes existent
    IF v_min_start_date IS NOT NULL THEN
      UPDATE events
      SET 
        registration_opens = v_min_start_date,
        registration_closes = v_max_end_date,
        updated_at = NOW()
      WHERE id = v_event.id;
    END IF;
  END LOOP;
END $$;

COMMENT ON FUNCTION sync_event_registration_dates IS
'Synchronise automatiquement registration_opens/closes depuis les périodes de tarification actives';
