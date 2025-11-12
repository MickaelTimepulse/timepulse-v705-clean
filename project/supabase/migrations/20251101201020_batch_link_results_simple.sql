/*
  # Simple Batch Link Results to Athletes
  
  Direct UPDATE statement to link results to athletes
  using simple name matching.
*/

-- Create temporary function for name parsing
CREATE OR REPLACE FUNCTION get_last_name_from_athlete_name(name text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT TRIM(SPLIT_PART(name, ' ', 1));
$$;

CREATE OR REPLACE FUNCTION get_first_name_from_athlete_name(name text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT TRIM(SUBSTRING(name FROM POSITION(' ' IN name) + 1));
$$;

-- Perform the batch update
UPDATE results r
SET athlete_id = a.id
FROM athletes a
WHERE r.athlete_id IS NULL
  AND r.athlete_name IS NOT NULL
  AND LOWER(a.last_name) = LOWER(get_last_name_from_athlete_name(r.athlete_name))
  AND LOWER(a.first_name) = LOWER(get_first_name_from_athlete_name(r.athlete_name))
  AND a.gender = r.gender;

-- Report results
DO $$
DECLARE
  v_linked integer;
  v_total integer;
BEGIN
  SELECT 
    COUNT(*) FILTER (WHERE athlete_id IS NOT NULL),
    COUNT(*)
  INTO v_linked, v_total
  FROM results;
  
  RAISE NOTICE 'Results linked: % / % (%.1f%%)', 
    v_linked, v_total, 
    (v_linked::decimal / v_total * 100);
END $$;

COMMENT ON FUNCTION get_last_name_from_athlete_name(text) IS 
  'Extract last name from "LASTNAME Firstname" format';

COMMENT ON FUNCTION get_first_name_from_athlete_name(text) IS 
  'Extract first name from "LASTNAME Firstname" format';
