/*
  # Recréation de la fonction d'insertion de résultats avec race_id

  1. Changements
    - Ajoute le race_id automatiquement (première race de l'événement)
    - Insère les résultats avec le race_id
    - Met à jour les statistiques de la race
    
  2. Validation
    - Vérifie que l'événement existe et est en draft
    - Vérifie qu'une race existe pour cet événement
*/

CREATE FUNCTION public.insert_external_results_batch(
  p_results jsonb,
  p_race_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_inserted_count int := 0;
  v_event_id uuid;
  v_race_id uuid;
  v_event_status text;
BEGIN
  -- Extraire l'event_id du premier résultat
  SELECT (p_results->0->>'external_event_id')::uuid INTO v_event_id;
  
  -- Vérifier que l'événement existe et est en draft
  SELECT status INTO v_event_status
  FROM external_events
  WHERE id = v_event_id;
  
  IF v_event_status IS NULL THEN
    RAISE EXCEPTION 'Event not found';
  END IF;
  
  IF v_event_status != 'draft' THEN
    RAISE EXCEPTION 'Can only add results to draft events';
  END IF;
  
  -- Déterminer le race_id à utiliser
  IF p_race_id IS NOT NULL THEN
    v_race_id := p_race_id;
  ELSE
    -- Récupérer la première race de l'événement
    SELECT id INTO v_race_id
    FROM external_races
    WHERE external_event_id = v_event_id
    ORDER BY created_at ASC
    LIMIT 1;
    
    IF v_race_id IS NULL THEN
      RAISE EXCEPTION 'No race found for this event';
    END IF;
  END IF;
  
  -- Insérer tous les résultats avec le race_id
  INSERT INTO external_results (
    external_event_id, external_race_id, bib_number, first_name, last_name,
    gender, birth_year, birth_date, city, club, category,
    finish_time, finish_time_display, overall_rank,
    gender_rank, category_rank, status
  )
  SELECT
    (r->>'external_event_id')::uuid,
    v_race_id,
    r->>'bib_number',
    r->>'first_name',
    r->>'last_name',
    r->>'gender',
    CASE WHEN r->>'birth_year' IS NOT NULL THEN (r->>'birth_year')::integer ELSE NULL END,
    CASE WHEN r->>'birth_date' IS NOT NULL AND r->>'birth_date' != '' THEN (r->>'birth_date')::date ELSE NULL END,
    r->>'city',
    r->>'club',
    r->>'category',
    CASE WHEN r->>'finish_time' IS NOT NULL THEN (r->>'finish_time')::interval ELSE NULL END,
    r->>'finish_time_display',
    CASE WHEN r->>'overall_rank' IS NOT NULL THEN (r->>'overall_rank')::integer ELSE NULL END,
    CASE WHEN r->>'gender_rank' IS NOT NULL THEN (r->>'gender_rank')::integer ELSE NULL END,
    CASE WHEN r->>'category_rank' IS NOT NULL THEN (r->>'category_rank')::integer ELSE NULL END,
    COALESCE(r->>'status', 'finished')
  FROM jsonb_array_elements(p_results) AS r;
  
  GET DIAGNOSTICS v_inserted_count = ROW_COUNT;
  
  -- Mettre à jour les statistiques de la race
  UPDATE external_races
  SET 
    total_participants = (SELECT COUNT(*) FROM external_results WHERE external_race_id = v_race_id),
    total_finishers = (SELECT COUNT(*) FROM external_results WHERE external_race_id = v_race_id AND status = 'finished'),
    updated_at = now()
  WHERE id = v_race_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'inserted_count', v_inserted_count,
    'event_id', v_event_id,
    'race_id', v_race_id
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.insert_external_results_batch TO anon, authenticated;

COMMENT ON FUNCTION public.insert_external_results_batch IS 
'Permet la soumission publique de résultats externes en batch. Utilise la race par défaut si non spécifiée.';
