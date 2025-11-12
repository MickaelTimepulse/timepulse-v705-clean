/*
  # Create calculate_rankings function

  1. New Function
    - `calculate_rankings(p_race_id uuid)` - Calculates overall, gender, and category rankings
    - Updates the rank fields in the results table
    - Orders by finish_time for completed results

  2. Logic
    - Overall rank: All finishers ordered by finish_time
    - Gender rank: Finishers of same gender ordered by finish_time
    - Category rank: Finishers in same category ordered by finish_time
*/

CREATE OR REPLACE FUNCTION calculate_rankings(p_race_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Calculate overall rank
  WITH ranked AS (
    SELECT 
      id,
      ROW_NUMBER() OVER (ORDER BY finish_time) as rank
    FROM results
    WHERE race_id = p_race_id 
      AND status = 'finished'
      AND finish_time IS NOT NULL
  )
  UPDATE results r
  SET overall_rank = ranked.rank
  FROM ranked
  WHERE r.id = ranked.id;

  -- Calculate gender rank
  WITH ranked AS (
    SELECT 
      id,
      ROW_NUMBER() OVER (PARTITION BY gender ORDER BY finish_time) as rank
    FROM results
    WHERE race_id = p_race_id 
      AND status = 'finished'
      AND finish_time IS NOT NULL
  )
  UPDATE results r
  SET gender_rank = ranked.rank
  FROM ranked
  WHERE r.id = ranked.id;

  -- Calculate category rank
  WITH ranked AS (
    SELECT 
      id,
      ROW_NUMBER() OVER (PARTITION BY category ORDER BY finish_time) as rank
    FROM results
    WHERE race_id = p_race_id 
      AND status = 'finished'
      AND finish_time IS NOT NULL
      AND category IS NOT NULL
  )
  UPDATE results r
  SET category_rank = ranked.rank
  FROM ranked
  WHERE r.id = ranked.id;
END;
$$;
