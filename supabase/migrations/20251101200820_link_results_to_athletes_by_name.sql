/*
  # Link Results to Athletes by Name Matching
  
  Creates a function to match results.athlete_name to athletes table
  based on last_name and first_name fuzzy matching.
  
  Matching logic:
  1. Split athlete_name into last_name and first_name
  2. Match with athletes table using case-insensitive comparison
  3. Update results.athlete_id when match found
*/

CREATE OR REPLACE FUNCTION link_results_to_athletes()
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
  -- Count total results without athlete_id
  SELECT COUNT(*) INTO v_total_results 
  FROM results 
  WHERE athlete_id IS NULL 
  AND athlete_name IS NOT NULL;
  
  -- Process each result
  FOR v_result_record IN 
    SELECT id, athlete_name, gender
    FROM results 
    WHERE athlete_id IS NULL 
    AND athlete_name IS NOT NULL
  LOOP
    -- Parse athlete_name (format: "LASTNAME Firstname")
    -- Split on space and take first part as last name, rest as first name
    v_last_name := SPLIT_PART(v_result_record.athlete_name, ' ', 1);
    v_first_name := SPLIT_PART(v_result_record.athlete_name, ' ', 2);
    
    -- If there are more parts, join them
    IF SPLIT_PART(v_result_record.athlete_name, ' ', 3) != '' THEN
      v_first_name := v_first_name || ' ' || SPLIT_PART(v_result_record.athlete_name, ' ', 3);
    END IF;
    
    -- Try to find matching athlete (case-insensitive, trimmed)
    BEGIN
      SELECT id INTO v_athlete_id
      FROM athletes
      WHERE LOWER(TRIM(last_name)) = LOWER(TRIM(v_last_name))
      AND LOWER(TRIM(first_name)) = LOWER(TRIM(v_first_name))
      AND gender = v_result_record.gender
      LIMIT 1;
      
      -- If found, update the result
      IF v_athlete_id IS NOT NULL THEN
        UPDATE results
        SET athlete_id = v_athlete_id
        WHERE id = v_result_record.id;
        
        v_linked := v_linked + 1;
      ELSE
        v_not_linked := v_not_linked + 1;
      END IF;
      
      -- Log progress every 100 records
      IF (v_linked + v_not_linked) % 100 = 0 THEN
        RAISE NOTICE 'Progress: % / % (linked: %, not linked: %)', 
          v_linked + v_not_linked, v_total_results, v_linked, v_not_linked;
      END IF;
      
    EXCEPTION WHEN OTHERS THEN
      v_not_linked := v_not_linked + 1;
      RAISE NOTICE 'Error processing result %: %', v_result_record.id, SQLERRM;
    END;
  END LOOP;
  
  RETURN json_build_object(
    'total_results', v_total_results,
    'linked', v_linked,
    'not_linked', v_not_linked,
    'success_rate', ROUND((v_linked::decimal / NULLIF(v_total_results, 0) * 100), 2)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION link_results_to_athletes() TO anon, authenticated;

COMMENT ON FUNCTION link_results_to_athletes() IS 
  'Match results to athletes by name. Expects athlete_name format: "LASTNAME Firstname"';
