/*
  # Fix registration_options column name in register function

  1. Changes
    - Change price_cents to price_paid_cents in INSERT statement
    - Use correct column names for registration_options table

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
  v_category TEXT;
  v_event_date DATE;
BEGIN
  -- Extract athlete name for message
  v_first_name := COALESCE(p_athlete_data->>'first_name', '');
  v_last_name := COALESCE(p_athlete_data->>'last_name', '');

  -- Valider les champs obligatoires
  IF v_first_name = '' OR v_last_name = '' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'missing_fields',
      'message', 'Nom et prénom obligatoires'
    );
  END IF;

  -- 1. Récupérer la date de l'événement pour le calcul de catégorie
  SELECT e.start_date INTO v_event_date
  FROM events e
  WHERE e.id = p_event_id;

  IF v_event_date IS NULL THEN
    v_event_date := CURRENT_DATE;
  END IF;

  -- 2. LOCK de la course et récupération du max_participants
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

  -- 3. VÉRIFIER si l'athlète est déjà inscrit à cette course
  SELECT e.id INTO v_existing_entry_id
  FROM entries e
  INNER JOIN athletes a ON a.id = e.athlete_id
  WHERE e.race_id = p_race_id
    AND LOWER(a.first_name) = LOWER(v_first_name)
    AND LOWER(a.last_name) = LOWER(v_last_name)
    AND a.birthdate = (p_athlete_data->>'birthdate')::DATE
    AND e.status IN ('confirmed', 'pending')
  LIMIT 1;

  IF v_existing_entry_id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'already_registered',
      'message', 'already_registered',
      'first_name', v_first_name,
      'entry_id', v_existing_entry_id
    );
  END IF;

  -- 4. COMPTER les inscrits confirmés
  SELECT COUNT(*) INTO v_current_count
  FROM entries
  WHERE race_id = p_race_id
    AND status IN ('confirmed', 'pending');

  -- 5. VÉRIFIER le quota
  IF v_current_count >= v_max_participants THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'race_full',
      'message', 'Cette course est complète',
      'current_count', v_current_count,
      'max_participants', v_max_participants
    );
  END IF;

  -- 6. CALCULER la catégorie FFA
  v_category := calculate_ffa_category(
    (p_athlete_data->>'birthdate')::DATE,
    v_event_date
  );

  -- 7. INSÉRER ou METTRE À JOUR l'athlète
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
    v_first_name,
    v_last_name,
    COALESCE(p_athlete_data->>'gender', 'M'),
    (p_athlete_data->>'birthdate')::DATE,
    COALESCE(p_athlete_data->>'email', ''),
    COALESCE(p_athlete_data->>'phone', ''),
    COALESCE(p_athlete_data->>'nationality', 'FRA'),
    p_athlete_data->>'license_number',
    p_athlete_data->>'license_club'
  )
  ON CONFLICT (LOWER(last_name), LOWER(first_name), birthdate)
  DO UPDATE SET
    email = COALESCE(EXCLUDED.email, athletes.email),
    phone = COALESCE(EXCLUDED.phone, athletes.phone),
    gender = COALESCE(EXCLUDED.gender, athletes.gender),
    nationality = COALESCE(EXCLUDED.nationality, athletes.nationality),
    license_number = COALESCE(EXCLUDED.license_number, athletes.license_number),
    license_club = COALESCE(EXCLUDED.license_club, athletes.license_club),
    updated_at = NOW()
  RETURNING id INTO v_athlete_id;

  -- 8. GÉNÉRER le numéro de dossard si auto-assign activé
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

  -- 9. Convertir amount_cents en decimal
  v_amount_cents := COALESCE((p_entry_data->>'amount_cents')::INT, 0);

  -- 10. INSÉRER l'inscription
  INSERT INTO entries (
    athlete_id,
    race_id,
    event_id,
    organizer_id,
    bib_number,
    category,
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
    v_category,
    COALESCE(p_entry_data->>'status', 'pending'),
    COALESCE(p_entry_data->>'source', 'public_form'),
    p_entry_data->>'session_token',
    CASE WHEN v_amount_cents > 0 THEN v_amount_cents / 100.0 ELSE 0 END
  )
  RETURNING id INTO v_entry_id;

  -- 11. INSÉRER les options si présentes
  IF p_options IS NOT NULL AND jsonb_array_length(p_options) > 0 THEN
    FOR v_option IN SELECT * FROM jsonb_array_elements(p_options)
    LOOP
      INSERT INTO registration_options (
        entry_id,
        option_id,
        choice_id,
        value,
        quantity,
        price_paid_cents
      ) VALUES (
        v_entry_id,
        (v_option->>'option_id')::UUID,
        NULLIF(v_option->>'choice_id', '')::UUID,
        v_option->>'value',
        COALESCE((v_option->>'quantity')::INT, 1),
        COALESCE((v_option->>'price_cents')::INT, 0)
      );
    END LOOP;
  END IF;

  -- 12. RETOURNER le succès
  RETURN jsonb_build_object(
    'success', true,
    'athlete_id', v_athlete_id,
    'entry_id', v_entry_id,
    'bib_number', v_bib_number,
    'category', v_category,
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