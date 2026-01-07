/*
  # Fix ON CONFLICT syntax in group registration function

  1. Changes
    - Fix ON CONFLICT to use index columns instead of constraint name
    - idx_athletes_identity is a unique index, not a named constraint
    - Use ON CONFLICT (LOWER(last_name), LOWER(first_name), birthdate) instead

  2. Security
    - No changes to RLS policies
*/

CREATE OR REPLACE FUNCTION register_group_with_quota_check(
  p_race_id UUID,
  p_members JSONB,
  p_organizer_id UUID,
  p_created_by UUID,
  p_team_name TEXT DEFAULT NULL,
  p_cart_id UUID DEFAULT NULL
)
RETURNS TABLE(entry_id UUID, athlete_id UUID, bib_number INTEGER) AS $$
DECLARE
  v_race RECORD;
  v_current_quota INTEGER;
  v_member JSONB;
  v_athlete_id UUID;
  v_entry_id UUID;
  v_bib_number INTEGER;
  v_athlete_data JSONB;
  v_category TEXT;
  v_registration_closes_at TIMESTAMPTZ;
  v_registration_opens_at TIMESTAMPTZ;
BEGIN
  -- Get race information
  SELECT r.*, e.registration_closes_at, e.registration_opens_at
  INTO v_race
  FROM races r
  JOIN events e ON e.id = r.event_id
  WHERE r.id = p_race_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Race not found';
  END IF;

  -- Store registration dates
  v_registration_closes_at := v_race.registration_closes_at;
  v_registration_opens_at := v_race.registration_opens_at;

  -- Check if registration period is valid
  IF v_registration_opens_at IS NOT NULL AND NOW() < v_registration_opens_at THEN
    RAISE EXCEPTION 'Les inscriptions ne sont pas encore ouvertes pour cette course';
  END IF;

  IF v_registration_closes_at IS NOT NULL AND NOW() > v_registration_closes_at THEN
    RAISE EXCEPTION 'Les inscriptions sont fermées pour cette course';
  END IF;

  -- Check current quota
  SELECT COUNT(*)
  INTO v_current_quota
  FROM entries
  WHERE race_id = p_race_id
    AND status NOT IN ('cancelled', 'transferred');

  -- Check if we have enough space for all members
  IF v_race.quota IS NOT NULL AND 
     (v_current_quota + jsonb_array_length(p_members)) > v_race.quota THEN
    RAISE EXCEPTION 'Quota dépassé pour cette course';
  END IF;

  -- Process each member
  FOR v_member IN SELECT * FROM jsonb_array_elements(p_members)
  LOOP
    v_athlete_data := v_member->'athlete';

    -- Calculate category based on birthdate and gender
    SELECT calculate_ffa_category(
      (v_athlete_data->>'birthdate')::DATE,
      v_athlete_data->>'gender',
      v_race.event_id
    ) INTO v_category;

    -- Insert or update athlete
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
    )
    VALUES (
      v_athlete_data->>'firstName',
      v_athlete_data->>'lastName',
      v_athlete_data->>'gender',
      (v_athlete_data->>'birthdate')::DATE,
      v_athlete_data->>'email',
      v_athlete_data->>'phone',
      COALESCE(v_athlete_data->>'nationality', 'FRA'),
      v_athlete_data->>'license_id',
      v_athlete_data->>'license_club',
      v_athlete_data->>'pps_number'
    )
    ON CONFLICT (LOWER(last_name), LOWER(first_name), birthdate)
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
      category,
      status,
      registration_status,
      payment_status,
      source,
      created_by,
      created_by_type,
      bib_number,
      amount,
      registration_date,
      team_name,
      cart_id
    )
    VALUES (
      v_athlete_id,
      p_race_id,
      v_race.event_id,
      p_organizer_id,
      v_category,
      'confirmed',
      'confirmed',
      'pending',
      'online',
      p_created_by,
      'organizer',
      v_bib_number,
      (v_member->>'amount')::DECIMAL,
      NOW(),
      p_team_name,
      p_cart_id
    )
    RETURNING id INTO v_entry_id;

    -- Return the entry info
    RETURN QUERY SELECT v_entry_id, v_athlete_id, v_bib_number;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
