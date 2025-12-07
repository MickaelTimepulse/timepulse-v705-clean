/*
  # Correction de l'import en batch avec les bonnes colonnes

  1. Modifications
    - Utilise ffa_club_code au lieu de club_number
    - Utilise ffa_club_name au lieu de license_club
    - Utilise ffa_league au lieu de league
    - Supprime la colonne federation qui n'existe pas
*/

CREATE OR REPLACE FUNCTION bulk_import_participants(
  p_event_id UUID,
  p_race_id UUID,
  p_organizer_id UUID,
  p_created_by UUID,
  p_participants JSONB
) RETURNS JSONB AS $$
DECLARE
  v_imported INTEGER := 0;
  v_skipped INTEGER := 0;
  v_errors TEXT[] := ARRAY[]::TEXT[];
  v_participant JSONB;
  v_athlete_id UUID;
  v_existing_entry UUID;
  v_first_name TEXT;
  v_last_name TEXT;
  v_birthdate DATE;
  v_email TEXT;
  v_bib_strategy TEXT;
  v_next_bib INTEGER := 1;
  v_error_msg TEXT;
  v_is_ffa_race BOOLEAN;
  v_event_date DATE;
  v_calculated_category TEXT;
BEGIN
  -- Vérifier les permissions (super admin uniquement)
  IF NOT EXISTS (
    SELECT 1 FROM admin_users
    WHERE user_id = p_created_by
    AND role = 'super_admin'
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Permission refusée: super admin requis'
    );
  END IF;

  -- Récupérer la date de l'événement et si c'est une course FFA
  SELECT e.start_date, COALESCE(r.is_ffa_race, false)
  INTO v_event_date, v_is_ffa_race
  FROM events e
  JOIN races r ON r.id = p_race_id
  WHERE e.id = p_event_id;

  -- Récupérer la stratégie de dossards
  SELECT COALESCE(strategy, 'CHRONOLOGICAL')
  INTO v_bib_strategy
  FROM race_bib_config
  WHERE race_id = p_race_id;

  -- Si stratégie ALPHABETICAL, on n'attribue pas maintenant
  IF v_bib_strategy = 'ALPHABETICAL' THEN
    v_next_bib := NULL;
  END IF;

  -- Traiter chaque participant
  FOR v_participant IN SELECT * FROM jsonb_array_elements(p_participants)
  LOOP
    BEGIN
      -- Extraire les données
      v_email := LOWER(TRIM(v_participant->>'email'));
      v_first_name := TRIM(v_participant->>'first_name');
      v_last_name := TRIM(v_participant->>'last_name');
      v_birthdate := (v_participant->>'birthdate')::DATE;

      -- Valider les données obligatoires
      IF v_email IS NULL OR v_first_name IS NULL OR v_last_name IS NULL THEN
        v_errors := array_append(v_errors, format('Ligne %s: données manquantes', v_participant->>'line_number'));
        CONTINUE;
      END IF;

      -- Calculer la catégorie FFA si c'est une course FFA et qu'on a une date de naissance
      v_calculated_category := v_participant->>'category';
      IF v_is_ffa_race AND v_birthdate IS NOT NULL AND v_event_date IS NOT NULL THEN
        v_calculated_category := calculate_ffa_category(v_birthdate, v_event_date);
      END IF;

      -- Chercher un athlète existant
      SELECT id INTO v_athlete_id
      FROM athletes
      WHERE LOWER(TRIM(first_name)) = LOWER(v_first_name)
        AND LOWER(TRIM(last_name)) = LOWER(v_last_name)
        AND (birthdate = v_birthdate OR (birthdate IS NULL AND v_birthdate IS NULL))
      LIMIT 1;

      -- Si l'athlète n'existe pas, le créer
      IF v_athlete_id IS NULL THEN
        INSERT INTO athletes (
          email, first_name, last_name, gender, birthdate, nationality,
          phone, city, postal_code, license_number, license_type,
          ffa_club_code, ffa_club_name, ffa_league,
          pps_number, pps_valid_until
        ) VALUES (
          v_email, v_first_name, v_last_name,
          COALESCE(v_participant->>'gender', 'M'),
          v_birthdate,
          COALESCE(v_participant->>'nationality', 'FRA'),
          v_participant->>'phone', 
          v_participant->>'city', 
          v_participant->>'postal_code',
          v_participant->>'license_number', 
          v_participant->>'license_type',
          v_participant->>'club_number',      -- va dans ffa_club_code
          v_participant->>'license_club',     -- va dans ffa_club_name
          v_participant->>'league',           -- va dans ffa_league
          v_participant->>'pps_number', 
          (v_participant->>'pps_valid_until')::DATE
        )
        RETURNING id INTO v_athlete_id;
      END IF;

      -- Vérifier si déjà inscrit à cette course
      SELECT id INTO v_existing_entry
      FROM entries
      WHERE athlete_id = v_athlete_id AND race_id = p_race_id;

      IF v_existing_entry IS NOT NULL THEN
        v_skipped := v_skipped + 1;
        CONTINUE;
      END IF;

      -- Créer l'inscription avec la catégorie calculée
      INSERT INTO entries (
        athlete_id, event_id, race_id, organizer_id,
        category, source, status, bib_number, notes,
        created_by, created_by_type
      ) VALUES (
        v_athlete_id, p_event_id, p_race_id, p_organizer_id,
        v_calculated_category,
        'bulk_import', 'confirmed',
        CASE 
          WHEN v_bib_strategy = 'CHRONOLOGICAL' THEN v_next_bib
          ELSE (v_participant->>'bib_number')::INTEGER
        END,
        v_participant->>'notes',
        p_created_by, 'timepulse_staff'
      );

      v_imported := v_imported + 1;

      -- Incrémenter le dossard si CHRONOLOGICAL
      IF v_bib_strategy = 'CHRONOLOGICAL' THEN
        v_next_bib := v_next_bib + 1;
      END IF;

    EXCEPTION WHEN OTHERS THEN
      v_error_msg := format('Ligne %s (%s %s): %s', 
        v_participant->>'line_number', v_first_name, v_last_name, SQLERRM
      );
      v_errors := array_append(v_errors, v_error_msg);
    END;
  END LOOP;

  -- Si stratégie ALPHABETICAL, réattribuer les dossards
  IF v_bib_strategy = 'ALPHABETICAL' THEN
    WITH ranked_entries AS (
      SELECT
        en.id,
        ROW_NUMBER() OVER (
          ORDER BY a.last_name COLLATE "fr-FR-x-icu", a.first_name COLLATE "fr-FR-x-icu"
        ) as new_bib
      FROM entries en
      JOIN athletes a ON en.athlete_id = a.id
      WHERE en.race_id = p_race_id AND en.bib_number IS NULL
    )
    UPDATE entries e
    SET bib_number = re.new_bib
    FROM ranked_entries re
    WHERE e.id = re.id;
  END IF;

  -- Retourner le résultat
  RETURN jsonb_build_object(
    'success', true,
    'imported', v_imported,
    'skipped', v_skipped,
    'errors', array_to_json(v_errors)
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'imported', v_imported,
    'skipped', v_skipped
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
