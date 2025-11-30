/*
  # Système de Calcul de l'Indice Timepulse™

  ## Formule de l'Indice
  Index = (Performance × 40%) + (Progression × 25%) + (Régularité × 20%) + (Polyvalence × 10%) + (Podiums × 5%)

  ## Composantes (échelle 0-100 chacune)
  
  1. **Performance** (40%) - Temps relatif vs meilleur temps de la catégorie
     - Compare le meilleur temps de l'athlète avec le record de sa catégorie d'âge
     - Formule : 100 - ((temps_athlete - record) / record × 100)
  
  2. **Progression** (25%) - Amélioration sur 6 mois / 1 an
     - Compare les temps moyens entre 2 périodes
     - Formule : (temps_ancien - temps_recent) / temps_ancien × 100
  
  3. **Régularité** (20%) - Nombre de courses par an
     - 0-5 courses = 20%
     - 6-10 courses = 50%
     - 11-20 courses = 80%
     - 20+ courses = 100%
  
  4. **Polyvalence** (10%) - Nombre de disciplines pratiquées
     - 1 discipline = 30%
     - 2 disciplines = 60%
     - 3+ disciplines = 100%
  
  5. **Podiums** (5%) - Classements top 3
     - 0 podium = 0%
     - 1-3 podiums = 40%
     - 4-10 podiums = 70%
     - 10+ podiums = 100%

  ## Recalcul
  - Automatique après chaque nouveau résultat
  - Historique conservé dans timepulse_index_history
*/

-- ============================================
-- FONCTION DE CALCUL DE L'INDICE TIMEPULSE
-- ============================================

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
  
  v_total_races integer := 0;
  v_total_podiums integer := 0;
  v_total_sports integer := 0;
  v_races_last_year integer := 0;
  
  v_best_10km_time interval;
  v_avg_time_recent interval;
  v_avg_time_old interval;
  
  v_final_index integer := 0;
BEGIN
  -- ============================================
  -- 1. PERFORMANCE (40%)
  -- ============================================
  -- Utiliser le meilleur temps sur 10km comme référence
  SELECT MIN(finish_time) INTO v_best_10km_time
  FROM results r
  JOIN races ra ON r.race_id = ra.id
  WHERE r.athlete_id = p_athlete_id
    AND r.status = 'finished'
    AND r.finish_time IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM race_types rt 
      WHERE rt.slug = '10km' 
        AND ra.distance_km BETWEEN 9.5 AND 10.5
    )
  LIMIT 1;
  
  -- Si temps 10km existe, calculer un score
  IF v_best_10km_time IS NOT NULL THEN
    -- Référence : 35 min = 100 points, 60 min = 0 points
    -- Formule simplifiée linéaire
    v_performance_score := GREATEST(0, LEAST(100,
      100 - ((EXTRACT(EPOCH FROM v_best_10km_time) - 2100) / 15) -- 2100s = 35min
    ));
  ELSE
    v_performance_score := 30; -- Score par défaut si pas de 10km
  END IF;
  
  -- ============================================
  -- 2. PROGRESSION (25%)
  -- ============================================
  -- Comparer temps moyens des 3 derniers mois vs 3 mois précédents
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
  
  -- Si on a les 2 périodes, calculer la progression
  IF v_avg_time_recent IS NOT NULL AND v_avg_time_old IS NOT NULL THEN
    DECLARE
      improvement_percent decimal(5,2);
    BEGIN
      improvement_percent := (
        (EXTRACT(EPOCH FROM v_avg_time_old) - EXTRACT(EPOCH FROM v_avg_time_recent)) 
        / EXTRACT(EPOCH FROM v_avg_time_old)
      ) * 100;
      
      -- Score : -10% = 0 pts, 0% = 50 pts, +10% = 100 pts
      v_progression_score := GREATEST(0, LEAST(100, 50 + (improvement_percent * 5)));
    END;
  ELSE
    v_progression_score := 50; -- Score neutre
  END IF;
  
  -- ============================================
  -- 3. RÉGULARITÉ (20%)
  -- ============================================
  -- Compter les courses des 12 derniers mois
  SELECT COUNT(*) INTO v_races_last_year
  FROM results
  WHERE athlete_id = p_athlete_id
    AND status = 'finished'
    AND created_at >= NOW() - INTERVAL '12 months';
  
  -- Score selon le nombre de courses
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
  -- Compter le nombre de sports différents pratiqués
  SELECT COUNT(DISTINCT rt.sport) INTO v_total_sports
  FROM results r
  JOIN races ra ON r.race_id = ra.id
  JOIN race_types rt ON rt.slug = LOWER(regexp_replace(ra.sport_type, '[^a-z0-9]', '', 'gi'))
  WHERE r.athlete_id = p_athlete_id
    AND r.status = 'finished';
  
  -- Fallback si pas de matching avec race_types
  IF v_total_sports = 0 THEN
    v_total_sports := 1;
  END IF;
  
  v_versatility_score := CASE
    WHEN v_total_sports = 1 THEN 30
    WHEN v_total_sports = 2 THEN 60
    ELSE 100
  END;
  
  -- ============================================
  -- 5. PODIUMS (5%)
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
  
  RETURN v_final_index;
END;
$$;

-- ============================================
-- FONCTION BATCH POUR RECALCULER TOUS LES INDICES
-- ============================================

CREATE OR REPLACE FUNCTION recalculate_all_indices(batch_size integer DEFAULT 1000)
RETURNS TABLE(processed integer, total integer)
LANGUAGE plpgsql
AS $$
DECLARE
  v_total integer;
  v_processed integer := 0;
  v_athlete_id uuid;
BEGIN
  -- Compter le total
  SELECT COUNT(*) INTO v_total FROM athletes;
  
  -- Traiter par batch
  FOR v_athlete_id IN 
    SELECT id FROM athletes 
    WHERE EXISTS (SELECT 1 FROM results WHERE athlete_id = athletes.id)
    ORDER BY id
  LOOP
    PERFORM calculate_timepulse_index(v_athlete_id);
    v_processed := v_processed + 1;
    
    -- Commit tous les X enregistrements
    IF v_processed % batch_size = 0 THEN
      RAISE NOTICE 'Processed % / % athletes', v_processed, v_total;
    END IF;
  END LOOP;
  
  RETURN QUERY SELECT v_processed, v_total;
END;
$$;

-- ============================================
-- TRIGGER POUR RECALCUL AUTOMATIQUE
-- ============================================

CREATE OR REPLACE FUNCTION trigger_recalculate_index_on_result()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Recalculer l'indice après insertion/update d'un résultat
  IF NEW.athlete_id IS NOT NULL AND NEW.status = 'finished' THEN
    PERFORM calculate_timepulse_index(NEW.athlete_id);
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS recalculate_index_on_result_insert ON results;
CREATE TRIGGER recalculate_index_on_result_insert
  AFTER INSERT ON results
  FOR EACH ROW
  EXECUTE FUNCTION trigger_recalculate_index_on_result();

DROP TRIGGER IF EXISTS recalculate_index_on_result_update ON results;
CREATE TRIGGER recalculate_index_on_result_update
  AFTER UPDATE ON results
  FOR EACH ROW
  WHEN (
    OLD.athlete_id IS DISTINCT FROM NEW.athlete_id OR 
    OLD.status IS DISTINCT FROM NEW.status OR
    OLD.finish_time IS DISTINCT FROM NEW.finish_time
  )
  EXECUTE FUNCTION trigger_recalculate_index_on_result();

-- ============================================
-- FONCTION POUR OBTENIR LE CLASSEMENT GLOBAL
-- ============================================

CREATE OR REPLACE FUNCTION get_timepulse_leaderboard(
  p_limit integer DEFAULT 100,
  p_offset integer DEFAULT 0,
  p_sport text DEFAULT NULL,
  p_gender text DEFAULT NULL
)
RETURNS TABLE(
  rank bigint,
  athlete_id uuid,
  first_name text,
  last_name text,
  slug text,
  profile_photo_url text,
  timepulse_index integer,
  total_races integer,
  total_podiums integer,
  city_display text,
  country_display text
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH athlete_stats AS (
    SELECT 
      a.id,
      COUNT(DISTINCT r.id) FILTER (WHERE r.status = 'finished') as races,
      COUNT(DISTINCT r.id) FILTER (WHERE r.status = 'finished' AND r.overall_rank <= 3) as podiums
    FROM athletes a
    LEFT JOIN results r ON r.athlete_id = a.id
    WHERE a.is_public = true
      AND (p_gender IS NULL OR a.gender = p_gender)
    GROUP BY a.id
  )
  SELECT
    ROW_NUMBER() OVER (ORDER BY a.timepulse_index DESC, a.last_name, a.first_name) as rank,
    a.id,
    a.first_name,
    a.last_name,
    a.slug,
    a.profile_photo_url,
    a.timepulse_index,
    COALESCE(s.races, 0)::integer as total_races,
    COALESCE(s.podiums, 0)::integer as total_podiums,
    a.city_display,
    a.country_display
  FROM athletes a
  LEFT JOIN athlete_stats s ON s.id = a.id
  WHERE a.is_public = true
    AND a.timepulse_index > 0
    AND (p_gender IS NULL OR a.gender = p_gender)
  ORDER BY a.timepulse_index DESC, a.last_name, a.first_name
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;
