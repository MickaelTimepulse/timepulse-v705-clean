/*
  # Fix group registration function - Remove emergency contact fields

  1. Changes
    - Remove emergency_contact_name and emergency_contact_phone from INSERT
    - Remove emergency_contact_name and emergency_contact_phone from UPDATE
    - These columns don't exist in the athletes table

  2. Notes
    - Emergency contact info is not stored in athletes table
    - Only store essential athlete identification data
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
BEGIN
  -- Count participants
  v_participant_count := jsonb_array_length(p_participants);

  -- Get race capacity
  SELECT max_participants, current_participants
  INTO v_max_participants, v_current_participants
  FROM races
  WHERE id = p_race_id;

  -- Check if race has capacity limits
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

  -- Process each participant
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

    -- INSERT or UPDATE athlete (WITHOUT emergency contact fields)
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

  -- Update race participant count
  UPDATE races
  SET current_participants = current_participants + v_participant_count
  WHERE id = p_race_id;

  -- Return success with details
  RETURN jsonb_build_object(
    'success', true,
    'participants_registered', v_participant_count,
    'places_remaining', COALESCE(v_max_participants - v_current_participants - v_participant_count, NULL),
    'entries', json_agg(v_entry_info)
  );
END;
$$;
