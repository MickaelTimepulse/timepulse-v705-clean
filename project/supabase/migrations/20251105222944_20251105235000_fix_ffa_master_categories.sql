/*
  # Fix FFA Master categories calculation

  1. Changes
    - Correct Master categories age ranges according to FFA official rules
    - M0: 35-39 years (not 40-44)
    - M1: 40-44 years (not 45-49)
    - M2: 45-49 years (not 50-54)
    - M3: 50-54 years (not 55-59)
    - M4: 55-59 years (not 60-64)
    - M5: 60-64 years (not 65-69)
    - M6: 65-69 years (not 70-74)
    - M7: 70-74 years (not 75-79)
    - M8: 75-79 years (not 80-84)
    - M9: 80-84 years (not 85-89)
    - M10: 85+ years (not 90+)

  2. Reference
    - Age calculation based on September 1st of event year
    - Source: https://werun.world/technique/categories-age/
*/

CREATE OR REPLACE FUNCTION calculate_ffa_category(
  p_birthdate DATE,
  p_event_date DATE
) RETURNS TEXT AS $$
DECLARE
  v_age INT;
  v_ffa_reference_date DATE;
BEGIN
  -- Calculate FFA reference date (September 1st of event year)
  v_ffa_reference_date := DATE_TRUNC('year', p_event_date) + INTERVAL '8 months';
  
  -- Calculate age at September 1st
  v_age := DATE_PART('year', v_ffa_reference_date) - DATE_PART('year', p_birthdate);
  
  IF (DATE_PART('month', v_ffa_reference_date) < DATE_PART('month', p_birthdate)) OR
     (DATE_PART('month', v_ffa_reference_date) = DATE_PART('month', p_birthdate) AND 
      DATE_PART('day', v_ffa_reference_date) < DATE_PART('day', p_birthdate)) THEN
    v_age := v_age - 1;
  END IF;
  
  -- Return category according to age (FFA 2025-2026 season)
  IF v_age < 7 THEN RETURN 'SE';
  ELSIF v_age >= 7 AND v_age <= 9 THEN RETURN 'EA';
  ELSIF v_age >= 10 AND v_age <= 11 THEN RETURN 'PO';
  ELSIF v_age >= 12 AND v_age <= 13 THEN RETURN 'BE';
  ELSIF v_age >= 14 AND v_age <= 15 THEN RETURN 'MI';
  ELSIF v_age >= 16 AND v_age <= 17 THEN RETURN 'CA';
  ELSIF v_age >= 18 AND v_age <= 19 THEN RETURN 'JU';
  ELSIF v_age >= 20 AND v_age <= 22 THEN RETURN 'ES';
  ELSIF v_age >= 23 AND v_age <= 34 THEN RETURN 'SE';
  -- Master categories (CORRECTED)
  ELSIF v_age >= 35 AND v_age <= 39 THEN RETURN 'M0';
  ELSIF v_age >= 40 AND v_age <= 44 THEN RETURN 'M1';
  ELSIF v_age >= 45 AND v_age <= 49 THEN RETURN 'M2';
  ELSIF v_age >= 50 AND v_age <= 54 THEN RETURN 'M3';
  ELSIF v_age >= 55 AND v_age <= 59 THEN RETURN 'M4';
  ELSIF v_age >= 60 AND v_age <= 64 THEN RETURN 'M5';
  ELSIF v_age >= 65 AND v_age <= 69 THEN RETURN 'M6';
  ELSIF v_age >= 70 AND v_age <= 74 THEN RETURN 'M7';
  ELSIF v_age >= 75 AND v_age <= 79 THEN RETURN 'M8';
  ELSIF v_age >= 80 AND v_age <= 84 THEN RETURN 'M9';
  ELSIF v_age >= 85 THEN RETURN 'M10';
  ELSE RETURN 'SE';
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;