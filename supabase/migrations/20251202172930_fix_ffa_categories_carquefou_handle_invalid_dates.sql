/*
  # Fix FFA Categories - Handle Invalid Birthdates

  1. Purpose
    - Set category to "SE" (Senior) for entries with invalid birthdates (year 1900)
    - These are entries where birthdate was missing from CSV import

  2. Process
    - Identify athletes with birthdate year = 1900
    - Set their category to "SE" (Senior) as default
*/

-- Update entries with invalid birthdates to Senior category
UPDATE entries e
SET category = 'SE'
FROM athletes a
WHERE e.athlete_id = a.id
  AND e.race_id = '629867e2-f851-489d-b9c1-4920cbab129d'
  AND EXTRACT(YEAR FROM a.birthdate) = 1900;

-- Verify the results
SELECT 
  category,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 1) as percentage
FROM entries
WHERE race_id = '629867e2-f851-489d-b9c1-4920cbab129d'
GROUP BY category
ORDER BY 
  CASE category
    WHEN 'EA' THEN 1 WHEN 'PO' THEN 2 WHEN 'BE' THEN 3 WHEN 'MI' THEN 4
    WHEN 'CA' THEN 5 WHEN 'JU' THEN 6 WHEN 'ES' THEN 7 WHEN 'SE' THEN 8
    WHEN 'M0' THEN 9 WHEN 'M1' THEN 10 WHEN 'M2' THEN 11 WHEN 'M3' THEN 12
    WHEN 'M4' THEN 13 WHEN 'M5' THEN 14 WHEN 'M6' THEN 15 WHEN 'M7' THEN 16
    ELSE 20
  END;
