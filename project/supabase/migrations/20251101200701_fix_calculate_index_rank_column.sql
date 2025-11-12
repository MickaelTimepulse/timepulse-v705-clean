/*
  # Fix Rank Column Reference in calculate_timepulse_index
  
  The function references rank_scratch but only overall_rank exists.
  
  Changes:
  - Remove rank_scratch reference, use only overall_rank
*/

CREATE OR REPLACE FUNCTION calculate_timepulse_index(p_athlete_id uuid)
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
  v_performance_score decimal(5,2) := 0;
  v_progression_score decimal(5,2) := 0;
  v_regularity_score decimal(5,2) := 0;
  v_versatility_score decimal(5,2) := 0;
  v_podium_score decimal(5,2) := 0;
  
  v_races_last_year integer := 0;
  v_total_podiums integer := 0;
  v_total_sports integer := 0;
  
  v_best_10km_time interval;
  v_avg_time_recent interval;
  v_avg_time_old interval;
  
  v_final_index integer := 0;
BEGIN
  -- ============================================
  -- 1. PERFORMANCE (40%)
  -- ============================================
  SELECT MIN(finish_time) INTO v_best_10km_time
  FROM results r
  JOIN races ra ON r.race_id = ra.id
  WHERE r.athlete_id = p_athlete_id
    AND r.status = 'finished'
    AND r.finish_time IS NOT NULL
    AND ra.distance BETWEEN 9.5 AND 10.5;
  
  IF v_best_10km_time IS NOT NULL THEN
    v_performance_score := GREATEST(0, LEAST(100,
      100 - ((EXTRACT(EPOCH FROM v_best_10km_time) - 2100) / 15)
    ));
  ELSE
    v_performance_score := 30;
  END IF;
  
  -- ============================================
  -- 2. PROGRESSION (25%)
  -- ============================================
  SELECT AVG(finish_time) INTO v_avg_time_recent
  FROM results
  WHERE athlete_id = p_athlete_id
    AND status = 'finished'
    AND finish_time IS NOT NULL
    AND created_at >= NOW() - INTERVAL '3 months';
  
  SELECT AVG(finish_time) INTO v_avg_time_old
  FROM results
  WHERE athlete_id = p_athlete_id
    AND status = 'finished'
    AND finish_time IS NOT NULL
    AND created_at >= NOW() - INTERVAL '6 months'
    AND created_at < NOW() - INTERVAL '3 months';
  
  IF v_avg_time_recent IS NOT NULL AND v_avg_time_old IS NOT NULL THEN
    DECLARE
      improvement_percent decimal(5,2);
    BEGIN
      improvement_percent := (
        (EXTRACT(EPOCH FROM v_avg_time_old) - EXTRACT(EPOCH FROM v_avg_time_recent)) 
        / EXTRACT(EPOCH FROM v_avg_time_old)
      ) * 100;
      
      v_progression_score := GREATEST(0, LEAST(100, 50 + (improvement_percent * 5)));
    END;
  ELSE
    v_progression_score := 50;
  END IF;
  
  -- ============================================
  -- 3. RÉGULARITÉ (20%)
  -- ============================================
  SELECT COUNT(*) INTO v_races_last_year
  FROM results
  WHERE athlete_id = p_athlete_id
    AND status = 'finished'
    AND created_at >= NOW() - INTERVAL '12 months';
  
  v_regularity_score := CASE
    WHEN v_races_last_year = 0 THEN 0
    WHEN v_races_last_year <= 5 THEN 20
    WHEN v_races_last_year <= 10 THEN 50
    WHEN v_races_last_year <= 20 THEN 80
    ELSE 100
  END;
  
  -- ============================================
  -- 4. POLYVALENCE (10%)
  -- ============================================
  SELECT COUNT(DISTINCT COALESCE(ra.sport_type, 'running')) INTO v_total_sports
  FROM results r
  JOIN races ra ON r.race_id = ra.id
  WHERE r.athlete_id = p_athlete_id
    AND r.status = 'finished';
  
  IF v_total_sports = 0 THEN
    v_total_sports := 1;
  END IF;
  
  v_versatility_score := CASE
    WHEN v_total_sports = 1 THEN 30
    WHEN v_total_sports = 2 THEN 60
    ELSE 100
  END;
  
  -- ============================================
  -- 5. PODIUMS (5%) - FIXED: use only overall_rank
  -- ============================================
  SELECT COUNT(*) INTO v_total_podiums
  FROM results
  WHERE athlete_id = p_athlete_id
    AND status = 'finished'
    AND overall_rank <= 3;
  
  v_podium_score := CASE
    WHEN v_total_podiums = 0 THEN 0
    WHEN v_total_podiums <= 3 THEN 40
    WHEN v_total_podiums <= 10 THEN 70
    ELSE 100
  END;
  
  -- ============================================
  -- CALCUL FINAL
  -- ============================================
  v_final_index := ROUND(
    (v_performance_score * 0.40) +
    (v_progression_score * 0.25) +
    (v_regularity_score * 0.20) +
    (v_versatility_score * 0.10) +
    (v_podium_score * 0.05)
  );
  
  -- Mettre à jour l'athlète
  UPDATE athletes
  SET timepulse_index = v_final_index,
      updated_at = NOW()
  WHERE id = p_athlete_id;
  
  -- Enregistrer dans l'historique
  BEGIN
    INSERT INTO timepulse_index_history (
      athlete_id,
      index_value,
      performance_score,
      progression_score,
      regularity_score,
      versatility_score,
      podium_score
    ) VALUES (
      p_athlete_id,
      v_final_index,
      v_performance_score,
      v_progression_score,
      v_regularity_score,
      v_versatility_score,
      v_podium_score
    );
  EXCEPTION WHEN undefined_table THEN
    NULL;
  END;
  
  RETURN v_final_index;
END;
$$;
