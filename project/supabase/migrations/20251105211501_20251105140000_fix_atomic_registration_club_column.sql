/*
  # Fix atomic registration function - club column name

  1. Changes
    - Replace incorrect `club_name` column with `license_club`
    - This fixes the error when creating athlete records during payment

  2. Security
    - No changes to RLS policies
*/

-- Drop and recreate the function with the correct column name
CREATE OR REPLACE FUNCTION create_atomic_registration(
  p_event_id UUID,
  p_race_id UUID,
  p_athlete_data JSONB,
  p_registration_data JSONB
) RETURNS JSONB AS $$
DECLARE
  v_athlete_id UUID;
  v_entry_id UUID;
  v_bib_number INT;
  v_event_start_date DATE;
  v_result JSONB;
BEGIN
  -- 1. VÉRIFIER que l'événement existe
  SELECT start_date INTO v_event_start_date
  FROM events
  WHERE id = p_event_id;
  
  IF v_event_start_date IS NULL THEN
    RAISE EXCEPTION 'Event not found: %', p_event_id;
  END IF;
  
  -- 2. VÉRIFIER que la course existe
  IF NOT EXISTS (SELECT 1 FROM races WHERE id = p_race_id AND event_id = p_event_id) THEN
    RAISE EXCEPTION 'Race not found or does not belong to event: %', p_race_id;
  END IF;
  
  -- 3. VÉRIFIER les restrictions de catégorie si nécessaire
  IF EXISTS (
    SELECT 1 FROM race_category_restrictions
    WHERE race_id = p_race_id
  ) THEN
    DECLARE
      v_birthdate DATE := (p_athlete_data->>'birthdate')::DATE;
      v_gender VARCHAR := p_athlete_data->>'gender';
      v_age_at_race INT := EXTRACT(YEAR FROM AGE(v_event_start_date, v_birthdate));
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM race_category_restrictions
        WHERE race_id = p_race_id
          AND (gender IS NULL OR gender = v_gender)
          AND (min_age IS NULL OR v_age_at_race >= min_age)
          AND (max_age IS NULL OR v_age_at_race <= max_age)
      ) THEN
        RAISE EXCEPTION 'Athlete does not meet race category restrictions';
      END IF;
    END;
  END IF;
  
  -- 4. INSÉRER l'athlète avec license_club
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
  RETURNING id INTO v_athlete_id;
  
  -- 5. GÉNÉRER le numéro de dossard si auto-assign activé
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
  
  -- 6. CRÉER l'inscription
  INSERT INTO entries (
    event_id,
    race_id,
    athlete_id,
    first_name,
    last_name,
    email,
    phone,
    birthdate,
    gender,
    nationality,
    license_type,
    license_id,
    license_club,
    bib_number,
    registration_method,
    payment_status,
    payment_method,
    amount_paid,
    registration_date
  ) VALUES (
    p_event_id,
    p_race_id,
    v_athlete_id,
    p_athlete_data->>'first_name',
    p_athlete_data->>'last_name',
    p_athlete_data->>'email',
    p_athlete_data->>'phone',
    (p_athlete_data->>'birthdate')::DATE,
    p_athlete_data->>'gender',
    p_athlete_data->>'nationality',
    p_registration_data->>'license_type',
    p_registration_data->>'license_id',
    p_registration_data->>'license_club',
    v_bib_number,
    COALESCE(p_registration_data->>'registration_method', 'public'),
    COALESCE(p_registration_data->>'payment_status', 'pending'),
    p_registration_data->>'payment_method',
    (p_registration_data->>'amount_paid')::DECIMAL,
    NOW()
  )
  RETURNING id INTO v_entry_id;
  
  -- 7. RETOURNER les IDs créés
  v_result := jsonb_build_object(
    'success', true,
    'athlete_id', v_athlete_id,
    'entry_id', v_entry_id,
    'bib_number', v_bib_number
  );
  
  RETURN v_result;
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
