/*
  # Correction des casts de types pour insert_external_results_batch

  1. Problème
    - Les casts de birth_date (text -> date) et autres types causaient des erreurs
    - La fonction ne gérait pas correctement les valeurs NULL ou vides
    
  2. Solution
    - Ajoute des CASE statements pour gérer les valeurs NULL/vides
    - Cast explicite pour chaque type de colonne
    - Gère les conversions text -> date, text -> interval, text -> integer
*/

CREATE OR REPLACE FUNCTION public.insert_external_results_batch(
  p_results jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result record;
  v_inserted_count int := 0;
  v_event_id uuid;
  v_event_status text;
BEGIN
  -- Extraire l'event_id du premier résultat pour validation
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
  
  -- Insérer tous les résultats avec des casts appropriés
  INSERT INTO external_results (
    external_event_id, bib_number, first_name, last_name,
    gender, birth_year, birth_date, city, club, category,
    finish_time, finish_time_display, overall_rank,
    gender_rank, category_rank, status
  )
  SELECT
    (r->>'external_event_id')::uuid,
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
  
  RETURN jsonb_build_object(
    'success', true,
    'inserted_count', v_inserted_count,
    'event_id', v_event_id
  );
END;
$$;

COMMENT ON FUNCTION public.insert_external_results_batch IS 
'Permet la soumission publique de résultats externes en batch. Gère les conversions de types et valide que l''événement est en draft.';
