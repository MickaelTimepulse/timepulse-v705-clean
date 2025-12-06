/*
  # Ajouter vérification des dates d'inscription

  1. Modifications
    - Mise à jour de `register_athlete_with_quota_check` pour vérifier les dates d'inscription
    - Vérification que les inscriptions sont ouvertes (registration_opens <= NOW())
    - Vérification que les inscriptions ne sont pas fermées (NOW() <= registration_closes)
    - Retour d'erreur appropriée si hors période d'inscription

  2. Sécurité
    - Empêche les inscriptions hors période même si l'interface frontend est contournée
    - Double vérification : frontend + backend
    - Garantit l'intégrité des règles d'inscription
*/

-- Mise à jour de la fonction pour ajouter la vérification des dates
CREATE OR REPLACE FUNCTION register_athlete_with_quota_check(
  p_race_id UUID,
  p_event_id UUID,
  p_organizer_id UUID,
  p_athlete_data JSONB,
  p_entry_data JSONB,
  p_options JSONB DEFAULT NULL
) RETURNS JSONB
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_max_participants INT;
  v_current_count INT;
  v_athlete_id UUID;
  v_entry_id UUID;
  v_bib_number INT;
  v_option JSONB;
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

  -- 2. LOCK de la course et récupération du max_participants
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

  -- 3. COMPTER les inscrits confirmés (statut confirmed ou pending)
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

  -- 5. INSÉRER l'athlète
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

  -- 6. GÉNÉRER le numéro de dossard si auto-assign activé
  SELECT auto_assign_number INTO v_bib_number
  FROM race_bib_config
  WHERE race_id = p_race_id;

  IF v_bib_number IS NOT NULL THEN
    -- Récupérer le prochain numéro disponible
    v_bib_number := (
      SELECT COALESCE(MAX(bib_number), 0) + 1
      FROM entries
      WHERE race_id = p_race_id
    );
  END IF;

  -- 7. INSÉRER l'inscription
  INSERT INTO entries (
    athlete_id,
    race_id,
    event_id,
    organizer_id,
    bib_number,
    status,
    source,
    session_token,
    amount_cents,
    is_refundable
  ) VALUES (
    v_athlete_id,
    p_race_id,
    p_event_id,
    p_organizer_id,
    v_bib_number,
    p_entry_data->>'status',
    p_entry_data->>'source',
    p_entry_data->>'session_token',
    (p_entry_data->>'amount_cents')::INT,
    (p_entry_data->>'is_refundable')::BOOLEAN
  )
  RETURNING id INTO v_entry_id;

  -- 8. INSÉRER les options si présentes
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

  -- 9. RETOURNER le succès avec les IDs
  RETURN jsonb_build_object(
    'success', true,
    'athlete_id', v_athlete_id,
    'entry_id', v_entry_id,
    'bib_number', v_bib_number,
    'places_remaining', v_max_participants - v_current_count - 1
  );

EXCEPTION
  WHEN OTHERS THEN
    -- En cas d'erreur, rollback automatique de la transaction
    RETURN jsonb_build_object(
      'success', false,
      'error', 'database_error',
      'message', SQLERRM
    );
END;
$$;

COMMENT ON FUNCTION register_athlete_with_quota_check IS
'Inscrit un athlète à une course en vérifiant atomiquement les dates d''inscription et les quotas. Utilise FOR UPDATE pour éviter les surréservations.';