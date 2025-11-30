/*
  # Fonction pour insertion publique de résultats externes

  1. Problème
    - Les policies RLS bloquent les insertions anonymes de résultats
    - Nécessite une fonction SECURITY DEFINER comme pour les événements
    
  2. Solution
    - Crée une fonction pour insertion en batch de résultats
    - Valide que l'événement existe et est en draft
    - Permet aux utilisateurs anonymes de soumettre des résultats
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
  
  -- Insérer tous les résultats
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
    (r->>'birth_year')::integer,
    r->>'birth_date',
    r->>'city',
    r->>'club',
    r->>'category',
    (r->>'finish_time')::interval,
    r->>'finish_time_display',
    (r->>'overall_rank')::integer,
    (r->>'gender_rank')::integer,
    (r->>'category_rank')::integer,
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

-- Permissions pour anon et authenticated
GRANT EXECUTE ON FUNCTION public.insert_external_results_batch TO anon, authenticated;

COMMENT ON FUNCTION public.insert_external_results_batch IS 
'Permet la soumission publique de résultats externes en batch. Valide que l''événement est en draft.';
