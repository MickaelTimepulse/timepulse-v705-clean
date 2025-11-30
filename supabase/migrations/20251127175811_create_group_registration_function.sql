/*
  # Create Group Registration Function

  1. New Function
    - `register_group_with_quota_check`: Atomically register multiple participants
    - Shares same registration_group_id for all participants
    - Validates quotas before inserting any entries
    - Returns detailed result with all created entry IDs

  2. Features
    - Single transaction for all participants
    - Quota validation (checks if enough places for entire group)
    - Duplicate detection per participant
    - Auto-assign bib numbers
    - Tracks registrant information (organizer)

  3. Security
    - SECURITY DEFINER to bypass RLS for atomic operations
    - All validation done server-side
*/

CREATE OR REPLACE FUNCTION register_group_with_quota_check(
  p_race_id UUID,
  p_event_id UUID,
  p_organizer_id UUID,
  p_registration_group_id UUID,
  p_registrant_name TEXT,
  p_registrant_email TEXT,
  p_registrant_phone TEXT,
  p_participants JSONB,  -- Array of participant data
  p_total_amount_cents INT
) RETURNS JSONB AS $$
DECLARE
  v_max_participants INT;
  v_current_count INT;
  v_participant JSONB;
  v_athlete_id UUID;
  v_entry_id UUID;
  v_bib_number INT;
  v_participant_count INT;
  v_existing_entry_id UUID;
  v_created_entries JSONB[] := ARRAY[]::JSONB[];
  v_entry_info JSONB;
  v_athlete_data JSONB;
BEGIN
  -- Count participants
  v_participant_count := jsonb_array_length(p_participants);

  IF v_participant_count = 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'no_participants',
      'message', 'Aucun participant fourni'
    );
  END IF;

  -- 1. LOCK race and get max_participants
  SELECT max_participants INTO v_max_participants
  FROM races
  WHERE id = p_race_id
  FOR UPDATE;

  IF v_max_participants IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'race_not_found',
      'message', 'Course non trouvée'
    );
  END IF;

  -- 2. COUNT current confirmed entries
  SELECT COUNT(*) INTO v_current_count
  FROM entries
  WHERE race_id = p_race_id
    AND status IN ('confirmed', 'pending');

  -- 3. CHECK if enough places for entire group
  IF (v_current_count + v_participant_count) > v_max_participants THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'race_full',
      'message', format('Pas assez de places disponibles. Places restantes: %s, participants: %s', 
        v_max_participants - v_current_count, v_participant_count),
      'places_remaining', v_max_participants - v_current_count,
      'participants_requested', v_participant_count
    );
  END IF;

  -- 4. PROCESS each participant
  FOR v_participant IN SELECT * FROM jsonb_array_elements(p_participants)
  LOOP
    -- Extract athlete data
    v_athlete_data := v_participant;

    -- Check for duplicate registration
    SELECT e.id INTO v_existing_entry_id
    FROM entries e
    INNER JOIN athletes a ON a.id = e.athlete_id
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
      pps_number,
      emergency_contact_name,
      emergency_contact_phone
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
      v_athlete_data->>'pps_number',
      v_athlete_data->>'emergency_contact_name',
      v_athlete_data->>'emergency_contact_phone'
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
      emergency_contact_name = EXCLUDED.emergency_contact_name,
      emergency_contact_phone = EXCLUDED.emergency_contact_phone,
      updated_at = NOW()
    RETURNING id INTO v_athlete_id;

    -- Generate bib number
    SELECT auto_assign_number INTO v_bib_number
    FROM race_bib_config
    WHERE race_id = p_race_id;

    IF v_bib_number IS NOT NULL THEN
      v_bib_number := (
        SELECT COALESCE(MAX(bib_number), 0) + 1
        FROM entries
        WHERE race_id = p_race_id
      );
    END IF;

    -- Calculate individual amount (total divided by number of participants)
    DECLARE
      v_individual_amount INT;
    BEGIN
      v_individual_amount := p_total_amount_cents / v_participant_count;
    END;

    -- INSERT entry with group information
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
      is_group_registration,
      group_registration_count,
      registrant_name,
      registrant_email
    ) VALUES (
      v_athlete_id,
      p_race_id,
      p_event_id,
      p_organizer_id,
      v_bib_number,
      'confirmed',
      'online',
      v_individual_amount,
      true,
      p_registration_group_id,
      true,
      v_participant_count,
      p_registrant_name,
      p_registrant_email
    )
    RETURNING id INTO v_entry_id;

    -- Store created entry info
    v_entry_info := jsonb_build_object(
      'entry_id', v_entry_id,
      'athlete_id', v_athlete_id,
      'bib_number', v_bib_number,
      'first_name', v_athlete_data->>'first_name',
      'last_name', v_athlete_data->>'last_name',
      'email', v_athlete_data->>'email'
    );

    v_created_entries := array_append(v_created_entries, v_entry_info);
  END LOOP;

  -- Return success with all created entries
  RETURN jsonb_build_object(
    'success', true,
    'registration_group_id', p_registration_group_id,
    'participants_registered', v_participant_count,
    'entries', array_to_json(v_created_entries),
    'places_remaining', v_max_participants - v_current_count - v_participant_count,
    'registrant_name', p_registrant_name,
    'registrant_email', p_registrant_email
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'database_error',
      'message', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;