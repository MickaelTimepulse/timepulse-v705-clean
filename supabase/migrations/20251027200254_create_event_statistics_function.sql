/*
  # Create Event Statistics Function

  Creates a PostgreSQL function to efficiently calculate event statistics without pagination limits.

  1. Function
    - `get_event_statistics(p_event_id uuid)` - Returns aggregated statistics for an event
    - Calculates total results, unique athletes, gender distribution, category distribution, and race distribution
    - Uses direct SQL aggregation for optimal performance

  2. Returns
    - JSON object with all event statistics pre-calculated
*/

CREATE OR REPLACE FUNCTION get_event_statistics(p_event_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
  total_count integer;
  unique_athletes integer;
  gender_stats jsonb;
  category_stats jsonb;
  race_stats jsonb;
BEGIN
  -- Get total results count
  SELECT COUNT(*)
  INTO total_count
  FROM results r
  INNER JOIN races ra ON ra.id = r.race_id
  WHERE ra.event_id = p_event_id
    AND r.status = 'finished';

  -- Get unique athletes count
  SELECT COUNT(DISTINCT r.athlete_name)
  INTO unique_athletes
  FROM results r
  INNER JOIN races ra ON ra.id = r.race_id
  WHERE ra.event_id = p_event_id
    AND r.status = 'finished'
    AND r.athlete_name IS NOT NULL;

  -- Get gender distribution
  SELECT jsonb_build_object(
    'male', COALESCE(SUM(CASE WHEN r.gender = 'M' THEN 1 ELSE 0 END), 0),
    'female', COALESCE(SUM(CASE WHEN r.gender = 'F' THEN 1 ELSE 0 END), 0)
  )
  INTO gender_stats
  FROM results r
  INNER JOIN races ra ON ra.id = r.race_id
  WHERE ra.event_id = p_event_id
    AND r.status = 'finished';

  -- Get category distribution (top 20)
  SELECT jsonb_object_agg(category, count)
  INTO category_stats
  FROM (
    SELECT r.category, COUNT(*) as count
    FROM results r
    INNER JOIN races ra ON ra.id = r.race_id
    WHERE ra.event_id = p_event_id
      AND r.status = 'finished'
      AND r.category IS NOT NULL
    GROUP BY r.category
    ORDER BY count DESC
    LIMIT 20
  ) cat;

  -- Get race distribution
  SELECT jsonb_object_agg(race_name, count)
  INTO race_stats
  FROM (
    SELECT ra.name as race_name, COUNT(*) as count
    FROM results r
    INNER JOIN races ra ON ra.id = r.race_id
    WHERE ra.event_id = p_event_id
      AND r.status = 'finished'
    GROUP BY ra.name
    ORDER BY count DESC
  ) races;

  -- Build final result
  result := jsonb_build_object(
    'total_results', total_count,
    'unique_athletes', unique_athletes,
    'by_gender', COALESCE(gender_stats, '{"male": 0, "female": 0}'::jsonb),
    'by_age_group', COALESCE(category_stats, '{}'::jsonb),
    'by_license', '{}'::jsonb,
    'by_race', COALESCE(race_stats, '{}'::jsonb)
  );

  RETURN result;
END;
$$;