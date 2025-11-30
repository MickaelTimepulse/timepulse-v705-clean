/*
  # Fonctions admin pour recalculer les résultats externes
  
  1. Fonctions
    - admin_recalculate_event_rankings: Recalcule les rangs
    - admin_list_suspect_times: Liste les temps suspects
*/

-- Fonction admin accessible depuis le dashboard
CREATE OR REPLACE FUNCTION admin_recalculate_event_rankings(event_slug text)
RETURNS json AS $$
DECLARE
  event_id uuid;
  result_count int;
BEGIN
  -- Trouver l'événement
  SELECT id INTO event_id
  FROM external_events
  WHERE slug = event_slug
  LIMIT 1;
  
  IF event_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Événement non trouvé'
    );
  END IF;
  
  -- Recalculer les rangs
  PERFORM recalculate_external_event_rankings(event_id);
  
  -- Compter les résultats
  SELECT COUNT(*) INTO result_count
  FROM external_results
  WHERE external_event_id = event_id;
  
  RETURN json_build_object(
    'success', true,
    'message', 'Rangs recalculés',
    'event_id', event_id,
    'results_count', result_count
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour lister les temps suspects
CREATE OR REPLACE FUNCTION admin_list_suspect_times()
RETURNS TABLE (
  event_name text,
  distance_km numeric,
  result_id uuid,
  rank int,
  athlete text,
  time_display text,
  is_suspect boolean
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ee.name::text,
    ee.distance_km,
    er.id,
    er.overall_rank,
    (er.last_name || ' ' || er.first_name)::text,
    er.finish_time_display::text,
    -- Suspect si course < 10km et temps > 1h
    (ee.distance_km < 10 AND er.finish_time_display::interval > '01:00:00'::interval)::boolean
  FROM external_results er
  JOIN external_events ee ON er.external_event_id = ee.id
  WHERE er.status = 'finished'
    AND er.finish_time_display IS NOT NULL
    AND (
      -- Course < 10km avec temps > 1h
      (ee.distance_km < 10 AND er.finish_time_display::interval > '01:00:00'::interval)
      OR
      -- Course 10-21km avec temps > 3h
      (ee.distance_km >= 10 AND ee.distance_km <= 21 AND er.finish_time_display::interval > '03:00:00'::interval)
    )
  ORDER BY ee.name, er.overall_rank;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Donner accès aux admins
GRANT EXECUTE ON FUNCTION admin_recalculate_event_rankings TO authenticated;
GRANT EXECUTE ON FUNCTION admin_list_suspect_times TO authenticated;
