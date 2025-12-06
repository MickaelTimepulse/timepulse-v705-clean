/*
  # Recalculate FFA Categories for Carquefou Event

  1. Purpose
    - Fix incorrect "Senior" categories for all participants
    - Calculate proper FFA categories based on birthdate and event date
    - Uses FFA reference date (September 1st of event year)

  2. Process
    - For each entry in the Carquefou 10km race
    - Calculate age at FFA reference date (Sept 1, 2026)
    - Assign correct FFA category code (EA, PO, BE, MI, CA, JU, ES, SE, M0-M10)
*/

-- Recalculate categories for the Carquefou 10km race
DO $$
DECLARE
  v_race_id uuid := '629867e2-f851-489d-b9c1-4920cbab129d';
  v_event_date date := '2026-03-01';
  v_ffa_reference_date date;
  v_entry record;
  v_age integer;
  v_category text;
BEGIN
  -- Calculate FFA reference date (September 1st of event year)
  v_ffa_reference_date := DATE_TRUNC('year', v_event_date)::date + INTERVAL '8 months';
  
  RAISE NOTICE 'FFA Reference Date: %', v_ffa_reference_date;
  RAISE NOTICE 'Starting category recalculation for race: %', v_race_id;

  -- Loop through all entries for this race
  FOR v_entry IN 
    SELECT e.id, a.birthdate, a.first_name, a.last_name
    FROM entries e
    JOIN athletes a ON a.id = e.athlete_id
    WHERE e.race_id = v_race_id
  LOOP
    -- Calculate age at FFA reference date
    v_age := EXTRACT(YEAR FROM AGE(v_ffa_reference_date, v_entry.birthdate));
    
    -- Determine category based on age
    v_category := CASE
      WHEN v_age < 7 THEN NULL
      WHEN v_age >= 7 AND v_age <= 9 THEN 'EA'
      WHEN v_age >= 10 AND v_age <= 11 THEN 'PO'
      WHEN v_age >= 12 AND v_age <= 13 THEN 'BE'
      WHEN v_age >= 14 AND v_age <= 15 THEN 'MI'
      WHEN v_age >= 16 AND v_age <= 17 THEN 'CA'
      WHEN v_age >= 18 AND v_age <= 19 THEN 'JU'
      WHEN v_age >= 20 AND v_age <= 22 THEN 'ES'
      WHEN v_age >= 23 AND v_age <= 39 THEN 'SE'
      WHEN v_age >= 40 AND v_age <= 44 THEN 'M0'
      WHEN v_age >= 45 AND v_age <= 49 THEN 'M1'
      WHEN v_age >= 50 AND v_age <= 54 THEN 'M2'
      WHEN v_age >= 55 AND v_age <= 59 THEN 'M3'
      WHEN v_age >= 60 AND v_age <= 64 THEN 'M4'
      WHEN v_age >= 65 AND v_age <= 69 THEN 'M5'
      WHEN v_age >= 70 AND v_age <= 74 THEN 'M6'
      WHEN v_age >= 75 AND v_age <= 79 THEN 'M7'
      WHEN v_age >= 80 AND v_age <= 84 THEN 'M8'
      WHEN v_age >= 85 AND v_age <= 89 THEN 'M9'
      WHEN v_age >= 90 THEN 'M10'
      ELSE NULL
    END;

    -- Update the entry with the calculated category
    IF v_category IS NOT NULL THEN
      UPDATE entries
      SET category = v_category
      WHERE id = v_entry.id;
    END IF;
  END LOOP;

  RAISE NOTICE 'Category recalculation completed';
END $$;

-- Verify the results
SELECT 
  category,
  COUNT(*) as count
FROM entries
WHERE race_id = '629867e2-f851-489d-b9c1-4920cbab129d'
GROUP BY category
ORDER BY 
  CASE category
    WHEN 'EA' THEN 1
    WHEN 'PO' THEN 2
    WHEN 'BE' THEN 3
    WHEN 'MI' THEN 4
    WHEN 'CA' THEN 5
    WHEN 'JU' THEN 6
    WHEN 'ES' THEN 7
    WHEN 'SE' THEN 8
    WHEN 'M0' THEN 9
    WHEN 'M1' THEN 10
    WHEN 'M2' THEN 11
    WHEN 'M3' THEN 12
    WHEN 'M4' THEN 13
    WHEN 'M5' THEN 14
    WHEN 'M6' THEN 15
    WHEN 'M7' THEN 16
    WHEN 'M8' THEN 17
    WHEN 'M9' THEN 18
    WHEN 'M10' THEN 19
    ELSE 20
  END;
