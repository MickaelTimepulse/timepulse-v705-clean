/*
  # Fix register_athlete function with correct column names

  1. Changes
    - Change amount_cents to amount (numeric type)
    - Remove is_refundable column (doesn't exist)
    - Convert cents to decimal for amount field

  2. Security
    - No changes to RLS policies
*/

CREATE OR REPLACE FUNCTION register_athlete_with_quota_check(
  p_race_id UUID,
  p_event_id UUID,
  p_organizer_id UUID,
  p_athlete_data JSONB,
  p_entry_data JSONB,
  p_options JSONB DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  v_max_participants INT;
  v_current_count INT;
  v_athlete_id UUID;
  v_entry_id UUID;
  v_bib_number INT;
  v_bib_mode TEXT;
  v_option JSONB;
  v_existing_entry_id UUID;
  v_first_name TEXT;
  v_last_name TEXT;
  v_amount_cents INT;
BEGIN
  -- Extract athlete name for message
  v_first_name := p_athlete_data->>'first_name';
  v_last_name := p_athlete_data->>'last_name';

  -- 1. LOCK de la course et récupération du max_participants
  SELECT max_participants INTO v_max_participants
  FROM races
  WHERE id = p_race_id
  FOR UPDATE;

  -- Vérifier si la course existe
  IF v_max_participants IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'race_not_found',
      'message', 'Course non trouvée'
    );
  END IF;

  -- 2. VÉRIFIER si l'athlète est déjà inscrit à cette course
  SELECT e.id INTO v_existing_entry_id
  FROM entries e
  INNER JOIN athletes a ON a.id = e.athlete_id
  WHERE e.race_id = p_race_id
    AND LOWER(a.first_name) = LOWER(p_athlete_data->>'first_name')
    AND LOWER(a.last_name) = LOWER(p_athlete_data->>'last_name')
    AND a.birthdate = (p_athlete_data->>'birthdate')::DATE
    AND e.status IN ('confirmed', 'pending')
  LIMIT 1;

  -- Si déjà inscrit, retourner un message sympa
  IF v_existing_entry_id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'already_registered',
      'message', 'already_registered',
      'first_name', v_first_name,
      'entry_id', v_existing_entry_id
    );
  END IF;

  -- 3. COMPTER les inscrits confirmés
  SELECT COUNT(*) INTO v_current_count
  FROM entries
  WHERE race_id = p_race_id
    AND status IN ('confirmed', 'pending');

  -- 4. VÉRIFIER le quota
  IF v_current_count >= v_max_participants THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'race_full',
      'message', 'Cette course est complète',
      'current_count', v_current_count,
      'max_participants', v_max_participants
    );
  END IF;

  -- 5. INSÉRER ou METTRE À JOUR l'athlète
  INSERT INTO athletes (
    first_name,
    last_name,
    gender,
    birthdate,
    email,
    phone,
    nationality,
    license_number,
    license_club
  ) VALUES (
    p_athlete_data->>'first_name',
    p_athlete_data->>'last_name',
    p_athlete_data->>'gender',
    (p_athlete_data->>'birthdate')::DATE,
    p_athlete_data->>'email',
    p_athlete_data->>'phone',
    p_athlete_data->>'nationality',
    p_athlete_data->>'license_number',
    p_athlete_data->>'license_club'
  )
  ON CONFLICT (LOWER(last_name), LOWER(first_name), birthdate)
  DO UPDATE SET
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    gender = EXCLUDED.gender,
    nationality = EXCLUDED.nationality,
    license_number = EXCLUDED.license_number,
    license_club = EXCLUDED.license_club,
    updated_at = NOW()
  RETURNING id INTO v_athlete_id;

  -- 6. GÉNÉRER le numéro de dossard si auto-assign activé
  SELECT mode INTO v_bib_mode
  FROM race_bib_config
  WHERE race_id = p_race_id;

  IF v_bib_mode = 'auto' THEN
    v_bib_number := (
      SELECT COALESCE(MAX(bib_number), 0) + 1
      FROM entries
      WHERE race_id = p_race_id
    );
  END IF;

  -- 7. Convertir amount_cents en decimal (diviser par 100)
  v_amount_cents := (p_entry_data->>'amount_cents')::INT;

  -- 8. INSÉRER l'inscription
  INSERT INTO entries (
    athlete_id,
    race_id,
    event_id,
    organizer_id,
    bib_number,
    status,
    source,
    session_token,
    amount
  ) VALUES (
    v_athlete_id,
    p_race_id,
    p_event_id,
    p_organizer_id,
    v_bib_number,
    p_entry_data->>'status',
    p_entry_data->>'source',
    p_entry_data->>'session_token',
    CASE WHEN v_amount_cents IS NOT NULL THEN v_amount_cents / 100.0 ELSE NULL END
  )
  RETURNING id INTO v_entry_id;

  -- 9. INSÉRER les options si présentes
  IF p_options IS NOT NULL AND jsonb_array_length(p_options) > 0 THEN
    FOR v_option IN SELECT * FROM jsonb_array_elements(p_options)
    LOOP
      INSERT INTO registration_options (
        entry_id,
        option_id,
        price_cents
      ) VALUES (
        v_entry_id,
        (v_option->>'option_id')::UUID,
        (v_option->>'price_cents')::INT
      );
    END LOOP;
  END IF;

  -- 10. RETOURNER le succès
  RETURN jsonb_build_object(
    'success', true,
    'athlete_id', v_athlete_id,
    'entry_id', v_entry_id,
    'bib_number', v_bib_number,
    'places_remaining', v_max_participants - v_current_count - 1
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