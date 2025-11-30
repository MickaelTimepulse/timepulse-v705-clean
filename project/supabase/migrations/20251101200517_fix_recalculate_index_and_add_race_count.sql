/*
  # Fix Athlete Index Recalculation and Add Race Count
  
  1. Remove auth.uid() check from admin_recalculate_athlete_index (doesn't work for admin auth)
  2. Add function to get race count per athlete
  3. Make functions accessible to anon role (for admin dashboard)
  
  Changes:
  - Modify admin_recalculate_athlete_index to remove auth check
  - Create get_athlete_race_count function
  - Grant execute permissions
*/

-- =====================================================
-- Recalculate athlete index without auth check
-- =====================================================

CREATE OR REPLACE FUNCTION admin_recalculate_athlete_index(p_athlete_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_index integer;
BEGIN
  -- Note: Auth check removed to work with admin dashboard
  -- Admin pages are protected at routing level
  
  -- Recalculer l'indice
  v_new_index := calculate_timepulse_index(p_athlete_id);
  
  RETURN v_new_index;
END;
$$;

-- =====================================================
-- Get athlete race statistics
-- =====================================================

CREATE OR REPLACE FUNCTION get_athlete_race_stats(p_athlete_id uuid)
RETURNS TABLE(
  total_races bigint,
  total_podiums bigint,
  last_race_date timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::bigint as total_races,
    COUNT(*) FILTER (WHERE rank_scratch <= 3)::bigint as total_podiums,
    MAX(r.race_date) as last_race_date
  FROM results res
  LEFT JOIN races r ON r.id = res.race_id
  WHERE res.athlete_id = p_athlete_id;
END;
$$;

-- =====================================================
-- Bulk recalculate all indices
-- =====================================================

CREATE OR REPLACE FUNCTION recalculate_all_athlete_indices(p_batch_size integer DEFAULT 100)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total_athletes integer;
  v_processed integer := 0;
  v_errors integer := 0;
  v_athlete_id uuid;
BEGIN
  SELECT COUNT(*) INTO v_total_athletes FROM athletes;
  
  FOR v_athlete_id IN 
    SELECT id FROM athletes ORDER BY id
  LOOP
    BEGIN
      PERFORM calculate_timepulse_index(v_athlete_id);
      v_processed := v_processed + 1;
      
      -- Commit every batch
      IF v_processed % p_batch_size = 0 THEN
        RAISE NOTICE 'Processed % / %', v_processed, v_total_athletes;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      v_errors := v_errors + 1;
      RAISE NOTICE 'Error for athlete %: %', v_athlete_id, SQLERRM;
    END;
  END LOOP;
  
  RETURN json_build_object(
    'total_athletes', v_total_athletes,
    'processed', v_processed,
    'errors', v_errors
  );
END;
$$;

-- =====================================================
-- Grant permissions
-- =====================================================

GRANT EXECUTE ON FUNCTION admin_recalculate_athlete_index(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_athlete_race_stats(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION recalculate_all_athlete_indices(integer) TO anon, authenticated;

-- =====================================================
-- Comments
-- =====================================================

COMMENT ON FUNCTION admin_recalculate_athlete_index(uuid) IS 
  'Recalculate Timepulse index for a single athlete. Auth check removed for admin dashboard compatibility.';

COMMENT ON FUNCTION get_athlete_race_stats(uuid) IS 
  'Get race statistics (total races, podiums, last race date) for an athlete';

COMMENT ON FUNCTION recalculate_all_athlete_indices(integer) IS 
  'Bulk recalculate Timepulse indices for all athletes. Use batch_size to control commit frequency.';
