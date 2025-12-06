/*
  # Ajouter vérification des dates d'inscription pour les inscriptions de groupe

  1. Modifications
    - Mise à jour de `register_group_with_quota_check` pour vérifier les dates d'inscription
    - Vérification que les inscriptions sont ouvertes (registration_opens <= NOW())
    - Vérification que les inscriptions ne sont pas fermées (NOW() <= registration_closes)
    - Retour d'erreur appropriée si hors période d'inscription

  2. Sécurité
    - Empêche les inscriptions de groupe hors période même si l'interface frontend est contournée
    - Cohérence avec la fonction d'inscription individuelle
    - Double vérification : frontend + backend
*/

CREATE OR REPLACE FUNCTION register_group_with_quota_check(
  p_race_id UUID,
  p_event_id UUID,
  p_organizer_id UUID,
  p_registration_group_id UUID,
  p_registrant_name TEXT,
  p_registrant_email TEXT,
  p_registrant_phone TEXT,
  p_participants JSONB,
  p_total_amount_cents INT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_max_participants INT;
  v_current_participants INT;
  v_available_slots INT;
  v_participant_count INT;
  v_athlete_data JSONB;
  v_athlete_id UUID;
  v_entry_id UUID;
  v_bib_number INT;
  v_existing_entry_id UUID;
  v_entry_info JSONB;
  v_created_entries JSONB[] := '{}';
  v_individual_amount INT;
  v_registration_opens TIMESTAMPTZ;
  v_registration_closes TIMESTAMPTZ;
BEGIN
  -- 1. VÉRIFIER LES DATES D'INSCRIPTION de l'événement
  SELECT registration_opens, registration_closes
  INTO v_registration_opens, v_registration_closes
  FROM events
  WHERE id = p_event_id;

  -- Vérifier si les inscriptions sont ouvertes
  IF v_registration_opens IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'registration_not_configured',
      'message', 'Les dates d''inscription ne sont pas configurées'
    );
  END IF;

  IF NOW() < v_registration_opens THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'registration_not_open',
      'message', 'Les inscriptions ne sont pas encore ouvertes'
    );
  END IF;

  IF v_registration_closes IS NOT NULL AND NOW() > v_registration_closes THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'registration_closed',
      'message', 'Les inscriptions sont fermées'
    );
  END IF;

  -- 2. Count participants
  v_participant_count := jsonb_array_length(p_participants);

  -- 3. Get race capacity
  SELECT max_participants, current_participants
  INTO v_max_participants, v_current_participants
  FROM races
  WHERE id = p_race_id;

  -- 4. Check if race has capacity limits
  IF v_max_participants IS NOT NULL THEN
    v_available_slots := v_max_participants - v_current_participants;

    IF v_available_slots < v_participant_count THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'race_full',
        'message', format('Seulement %s places disponibles, vous essayez d''inscrire %s participants',
          v_available_slots, v_participant_count),
        'available_slots', v_available_slots,
        'requested_slots', v_participant_count
      );
    END IF;
  END IF;

  -- Calculate individual amount (total divided by number of participants)
  IF p_total_amount_cents > 0 THEN
    v_individual_amount := ROUND(p_total_amount_cents::DECIMAL / v_participant_count);
  ELSE
    v_individual_amount := 0;
  END IF;

  -- 5. Process each participant
  FOR v_athlete_data IN SELECT * FROM jsonb_array_elements(p_participants)
  LOOP
    -- Check for duplicate registration
    SELECT e.id INTO v_existing_entry_id
    FROM entries e
    JOIN athletes a ON a.id = e.athlete_id
    WHERE e.race_id = p_race_id
      AND LOWER(a.first_name) = LOWER(v_athlete_data->>'first_name')
      AND LOWER(a.last_name) = LOWER(v_athlete_data->>'last_name')
      AND a.birthdate = (v_athlete_data->>'birthdate')::DATE
      AND e.status IN ('confirmed', 'pending')
    LIMIT 1;

    IF v_existing_entry_id IS NOT NULL THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'already_registered',
        'message', format('%s %s est déjà inscrit(e) à cette course',
          v_athlete_data->>'first_name', v_athlete_data->>'last_name'),
        'participant', v_athlete_data
      );
    END IF;

    -- INSERT or UPDATE athlete
    INSERT INTO athletes (
      first_name,
      last_name,
      gender,
      birthdate,
      email,
      phone,
      nationality,
      license_number,
      license_club,
      pps_number
    ) VALUES (
      v_athlete_data->>'first_name',
      v_athlete_data->>'last_name',
      v_athlete_data->>'gender',
      (v_athlete_data->>'birthdate')::DATE,
      v_athlete_data->>'email',
      v_athlete_data->>'phone',
      COALESCE(v_athlete_data->>'nationality', 'FRA'),
      v_athlete_data->>'license_id',
      v_athlete_data->>'license_club',
      v_athlete_data->>'pps_number'
    )
    ON CONFLICT ON CONSTRAINT idx_athletes_identity
    DO UPDATE SET
      email = EXCLUDED.email,
      phone = EXCLUDED.phone,
      gender = EXCLUDED.gender,
      nationality = EXCLUDED.nationality,
      license_number = EXCLUDED.license_number,
      license_club = EXCLUDED.license_club,
      pps_number = EXCLUDED.pps_number,
      updated_at = NOW()
    RETURNING id INTO v_athlete_id;

    -- Get next bib number if auto-assign is enabled
    SELECT COALESCE(MAX(bib_number), 0) + 1
    INTO v_bib_number
    FROM entries
    WHERE race_id = p_race_id;

    -- Create entry
    INSERT INTO entries (
      athlete_id,
      race_id,
      event_id,
      organizer_id,
      bib_number,
      status,
      source,
      amount_cents,
      is_refundable,
      registration_group_id,
      group_registrant_name,
      group_registrant_email,
      group_registrant_phone
    ) VALUES (
      v_athlete_id,
      p_race_id,
      p_event_id,
      p_organizer_id,
      v_bib_number,
      'pending',
      'public_web',
      v_individual_amount,
      true,
      p_registration_group_id,
      p_registrant_name,
      p_registrant_email,
      p_registrant_phone
    )
    RETURNING id INTO v_entry_id;

    -- Build entry info
    v_entry_info := jsonb_build_object(
      'entry_id', v_entry_id,
      'athlete_id', v_athlete_id,
      'bib_number', v_bib_number,
      'first_name', v_athlete_data->>'first_name',
      'last_name', v_athlete_data->>'last_name'
    );

    v_created_entries := array_append(v_created_entries, v_entry_info);
  END LOOP;

  -- Return success with created entries
  RETURN jsonb_build_object(
    'success', true,
    'entries', to_jsonb(v_created_entries),
    'registration_group_id', p_registration_group_id,
    'participant_count', v_participant_count,
    'total_amount_cents', p_total_amount_cents
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'database_error',
      'message', SQLERRM
    );
END;
$$;

COMMENT ON FUNCTION register_group_with_quota_check IS
'Inscrit un groupe de participants en vérifiant atomiquement les dates d''inscription et les quotas.';