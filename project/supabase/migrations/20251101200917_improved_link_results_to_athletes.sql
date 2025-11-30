/*
  # Improved Results to Athletes Linking
  
  Better matching with:
  - Accent-insensitive comparison using unaccent
  - Better name parsing
  - Detailed logging
*/

-- Enable unaccent extension if not already enabled
CREATE EXTENSION IF NOT EXISTS unaccent;

CREATE OR REPLACE FUNCTION link_results_to_athletes_improved()
RETURNS json
LANGUAGE plpgsql
AS $$
DECLARE
  v_total_results integer;
  v_linked integer := 0;
  v_not_linked integer := 0;
  v_result_record record;
  v_athlete_id uuid;
  v_first_name text;
  v_last_name text;
BEGIN
  SELECT COUNT(*) INTO v_total_results 
  FROM results 
  WHERE athlete_id IS NULL 
  AND athlete_name IS NOT NULL;
  
  RAISE NOTICE 'Starting to process % results', v_total_results;
  
  FOR v_result_record IN 
    SELECT id, athlete_name, gender
    FROM results 
    WHERE athlete_id IS NULL 
    AND athlete_name IS NOT NULL
  LOOP
    -- Parse name (format: "LASTNAME Firstname")
    v_last_name := TRIM(SPLIT_PART(v_result_record.athlete_name, ' ', 1));
    v_first_name := TRIM(SUBSTRING(v_result_record.athlete_name FROM POSITION(' ' IN v_result_record.athlete_name) + 1));
    
    -- Try exact match first (case and accent insensitive)
    SELECT id INTO v_athlete_id
    FROM athletes
    WHERE unaccent(LOWER(last_name)) = unaccent(LOWER(v_last_name))
    AND unaccent(LOWER(first_name)) = unaccent(LOWER(v_first_name))
    AND gender = v_result_record.gender
    LIMIT 1;
    
    -- If not found, try with firstname containing (for compound names)
    IF v_athlete_id IS NULL THEN
      SELECT id INTO v_athlete_id
      FROM athletes
      WHERE unaccent(LOWER(last_name)) = unaccent(LOWER(v_last_name))
      AND unaccent(LOWER(first_name)) LIKE '%' || unaccent(LOWER(v_first_name)) || '%'
      AND gender = v_result_record.gender
      LIMIT 1;
    END IF;
    
    IF v_athlete_id IS NOT NULL THEN
      UPDATE results
      SET athlete_id = v_athlete_id
      WHERE id = v_result_record.id;
      
      v_linked := v_linked + 1;
    ELSE
      v_not_linked := v_not_linked + 1;
    END IF;
    
    -- Log progress
    IF (v_linked + v_not_linked) % 100 = 0 THEN
      RAISE NOTICE 'Progress: % / % (linked: %, not linked: %)', 
        v_linked + v_not_linked, v_total_results, v_linked, v_not_linked;
    END IF;
  END LOOP;
  
  RAISE NOTICE 'Finished! Linked: %, Not linked: %', v_linked, v_not_linked;
  
  RETURN json_build_object(
    'total_results', v_total_results,
    'linked', v_linked,
    'not_linked', v_not_linked,
    'success_rate', ROUND((v_linked::decimal / NULLIF(v_total_results, 0) * 100), 2)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION link_results_to_athletes_improved() TO anon, authenticated;
