/*
  # Fonction pour lier les résultats aux athlètes

  Cette migration crée des fonctions pour automatiser le matching entre :
  - results (résultats de course)
  - athletes (base unifiée)

  ## Stratégies de matching
  1. Via entry_id : Si le résultat est lié à une inscription
  2. Via (nom, prénom, date_naissance) : Matching exact
  3. Via (nom, prénom) : Matching approximatif (risqué)
*/

-- ============================================
-- 1. LIAISON VIA ENTRIES
-- ============================================

CREATE OR REPLACE FUNCTION link_results_via_entries()
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
  v_updated integer := 0;
BEGIN
  -- Lier les résultats qui ont un entry_id et où l'entry a un athlete_id
  UPDATE results r
  SET athlete_id = e.athlete_id,
      updated_at = NOW()
  FROM entries e
  WHERE r.entry_id = e.id
    AND r.athlete_id IS NULL
    AND e.athlete_id IS NOT NULL;
  
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  
  RETURN v_updated;
END;
$$;

-- ============================================
-- 2. LIAISON VIA MATCHING NOM/PRÉNOM/DATE
-- ============================================

CREATE OR REPLACE FUNCTION link_result_to_athlete_by_entry(p_result_id uuid)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  v_athlete_id uuid;
  v_entry_id uuid;
  v_first_name text;
  v_last_name text;
  v_birthdate date;
BEGIN
  -- Récupérer l'entry_id du résultat
  SELECT entry_id INTO v_entry_id
  FROM results
  WHERE id = p_result_id;
  
  IF v_entry_id IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Récupérer les infos de l'entry
  SELECT e.first_name, e.last_name, a.birthdate
  INTO v_first_name, v_last_name, v_birthdate
  FROM entries e
  LEFT JOIN athletes a ON e.athlete_id = a.id
  WHERE e.id = v_entry_id;
  
  IF v_first_name IS NULL OR v_last_name IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Si on a la date de naissance, matching exact
  IF v_birthdate IS NOT NULL THEN
    v_athlete_id := match_athlete_by_identity(v_first_name, v_last_name, v_birthdate);
  ELSE
    -- Sinon, chercher par nom/prénom uniquement (risqué !)
    SELECT id INTO v_athlete_id
    FROM athletes
    WHERE LOWER(first_name) = LOWER(v_first_name)
      AND LOWER(last_name) = LOWER(v_last_name)
    LIMIT 1;
  END IF;
  
  -- Mettre à jour le résultat
  IF v_athlete_id IS NOT NULL THEN
    UPDATE results
    SET athlete_id = v_athlete_id,
        updated_at = NOW()
    WHERE id = p_result_id;
  END IF;
  
  RETURN v_athlete_id;
END;
$$;

-- ============================================
-- 3. FONCTION BATCH POUR LIER TOUS LES RÉSULTATS
-- ============================================

CREATE OR REPLACE FUNCTION link_all_results_to_athletes(batch_size integer DEFAULT 1000)
RETURNS TABLE(total_processed integer, total_linked integer)
LANGUAGE plpgsql
AS $$
DECLARE
  v_total_processed integer := 0;
  v_total_linked integer := 0;
  v_result_id uuid;
  v_athlete_id uuid;
BEGIN
  -- Étape 1 : Liaison directe via entries
  SELECT link_results_via_entries() INTO v_total_linked;
  
  RAISE NOTICE 'Étape 1 : % résultats liés via entries', v_total_linked;
  
  -- Étape 2 : Traiter les résultats restants un par un
  FOR v_result_id IN 
    SELECT id 
    FROM results 
    WHERE athlete_id IS NULL 
      AND entry_id IS NOT NULL
    LIMIT batch_size
  LOOP
    v_athlete_id := link_result_to_athlete_by_entry(v_result_id);
    
    v_total_processed := v_total_processed + 1;
    
    IF v_athlete_id IS NOT NULL THEN
      v_total_linked := v_total_linked + 1;
    END IF;
    
    -- Log tous les 100
    IF v_total_processed % 100 = 0 THEN
      RAISE NOTICE 'Traités : %, Liés : %', v_total_processed, v_total_linked;
    END IF;
  END LOOP;
  
  RETURN QUERY SELECT v_total_processed, v_total_linked;
END;
$$;

-- ============================================
-- 4. TRIGGER AUTOMATIQUE POUR NOUVEAUX RÉSULTATS
-- ============================================

-- Quand un résultat est inséré avec un entry_id, essayer de le lier
CREATE OR REPLACE FUNCTION trigger_link_result_to_athlete()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Si on a un entry_id mais pas d'athlete_id, tenter le matching
  IF NEW.entry_id IS NOT NULL AND NEW.athlete_id IS NULL THEN
    NEW.athlete_id := link_result_to_athlete_by_entry(NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS auto_link_result_to_athlete ON results;
CREATE TRIGGER auto_link_result_to_athlete
  BEFORE INSERT ON results
  FOR EACH ROW
  EXECUTE FUNCTION trigger_link_result_to_athlete();

-- ============================================
-- 5. FONCTION POUR NETTOYER LES DOUBLONS
-- ============================================

-- Identifier les athlètes potentiellement dupliqués
CREATE OR REPLACE FUNCTION find_duplicate_athletes()
RETURNS TABLE(
  first_name text,
  last_name text,
  birthdate date,
  athlete_ids uuid[],
  count bigint
)
LANGUAGE sql
STABLE
AS $$
  SELECT 
    MIN(a.first_name) as first_name,
    MIN(a.last_name) as last_name,
    a.birthdate,
    ARRAY_AGG(a.id) as athlete_ids,
    COUNT(*) as count
  FROM athletes a
  GROUP BY 
    LOWER(a.first_name),
    LOWER(a.last_name),
    a.birthdate
  HAVING COUNT(*) > 1
  ORDER BY COUNT(*) DESC;
$$;

-- Fusionner deux athlètes (garder le premier, supprimer le second)
CREATE OR REPLACE FUNCTION merge_athletes(
  p_keep_athlete_id uuid,
  p_delete_athlete_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
AS $$
BEGIN
  -- Vérifier que les 2 athlètes existent
  IF NOT EXISTS (SELECT 1 FROM athletes WHERE id = p_keep_athlete_id) THEN
    RAISE EXCEPTION 'Athlete % not found', p_keep_athlete_id;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM athletes WHERE id = p_delete_athlete_id) THEN
    RAISE EXCEPTION 'Athlete % not found', p_delete_athlete_id;
  END IF;
  
  -- Transférer tous les résultats
  UPDATE results
  SET athlete_id = p_keep_athlete_id
  WHERE athlete_id = p_delete_athlete_id;
  
  -- Transférer toutes les entrées
  UPDATE entries
  SET athlete_id = p_keep_athlete_id
  WHERE athlete_id = p_delete_athlete_id;
  
  -- Transférer les records (en évitant les conflits)
  INSERT INTO athlete_records (athlete_id, race_type_id, best_time, result_id, race_id, achieved_at)
  SELECT p_keep_athlete_id, race_type_id, best_time, result_id, race_id, achieved_at
  FROM athlete_records
  WHERE athlete_id = p_delete_athlete_id
  ON CONFLICT (athlete_id, race_type_id) DO NOTHING;
  
  DELETE FROM athlete_records WHERE athlete_id = p_delete_athlete_id;
  
  -- Transférer les badges (en évitant les conflits)
  INSERT INTO athlete_badges (athlete_id, badge_id, earned_at, result_id, race_id, is_featured)
  SELECT p_keep_athlete_id, badge_id, earned_at, result_id, race_id, is_featured
  FROM athlete_badges
  WHERE athlete_id = p_delete_athlete_id
  ON CONFLICT (athlete_id, badge_id) DO NOTHING;
  
  DELETE FROM athlete_badges WHERE athlete_id = p_delete_athlete_id;
  
  -- Supprimer l'athlète en double
  DELETE FROM athletes WHERE id = p_delete_athlete_id;
  
  -- Recalculer l'indice de l'athlète conservé
  PERFORM calculate_timepulse_index(p_keep_athlete_id);
  
  RETURN true;
END;
$$;
