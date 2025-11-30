/*
  # Fix average speed calculation to use race distance

  1. Changes
    - Update trigger function to look for distance in external_races if not found in external_events
    - Handles both single-race events (distance on event) and multi-race events (distance on race)

  2. Logic
    - First tries to get distance from external_events.distance_km
    - If null or 0, looks for the first race distance in external_races
    - Calculates speed based on whichever distance is found
*/

-- Drop existing trigger
DROP TRIGGER IF EXISTS trigger_calculate_average_speed_external_results ON external_results;

-- Drop existing function
DROP FUNCTION IF EXISTS calculate_average_speed_external_results();

-- Recreate function with improved logic
CREATE OR REPLACE FUNCTION calculate_average_speed_external_results()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  event_distance numeric;
  race_distance numeric;
  final_distance numeric;
  time_seconds numeric;
BEGIN
  -- Try to get distance from external_events first
  SELECT distance_km INTO event_distance
  FROM external_events
  WHERE id = NEW.external_event_id;

  -- If event distance is null or 0, try to get it from external_races
  IF event_distance IS NULL OR event_distance = 0 THEN
    SELECT distance_km INTO race_distance
    FROM external_races
    WHERE external_event_id = NEW.external_event_id
    ORDER BY distance_km DESC
    LIMIT 1;

    final_distance := race_distance;
  ELSE
    final_distance := event_distance;
  END IF;

  -- If we have a distance and finish_time, calculate speed
  IF final_distance IS NOT NULL
     AND final_distance > 0
     AND NEW.finish_time IS NOT NULL
     AND NEW.finish_time > interval '0 seconds' THEN

    -- Convert interval to seconds
    time_seconds := EXTRACT(EPOCH FROM NEW.finish_time);

    -- Calculate speed in km/h: distance / (time_in_seconds / 3600)
    IF time_seconds > 0 THEN
      NEW.average_speed_kmh := final_distance / (time_seconds / 3600.0);
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Recreate trigger
CREATE TRIGGER trigger_calculate_average_speed_external_results
  BEFORE INSERT OR UPDATE ON external_results
  FOR EACH ROW
  EXECUTE FUNCTION calculate_average_speed_external_results();

-- Force recalculation of all existing records by updating them
DO $$
DECLARE
  result_record RECORD;
BEGIN
  FOR result_record IN 
    SELECT id FROM external_results
    WHERE finish_time IS NOT NULL
  LOOP
    UPDATE external_results
    SET updated_at = now()
    WHERE id = result_record.id;
  END LOOP;
END $$;
