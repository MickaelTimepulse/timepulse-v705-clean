/*
  # Add automatic average speed calculation for external results

  1. Function
    - `calculate_average_speed_external_results()` - Calculates average speed when results are inserted/updated
  
  2. Trigger
    - Triggers on INSERT/UPDATE of external_results
    - Automatically calculates average_speed_kmh based on finish_time and event distance
*/

-- Function to calculate average speed for external results
CREATE OR REPLACE FUNCTION calculate_average_speed_external_results()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  event_distance numeric;
  time_seconds numeric;
BEGIN
  -- Get the event distance
  SELECT distance_km INTO event_distance
  FROM external_events
  WHERE id = NEW.external_event_id;

  -- If we have a distance and finish_time, calculate speed
  IF event_distance IS NOT NULL 
     AND event_distance > 0 
     AND NEW.finish_time IS NOT NULL 
     AND NEW.finish_time > interval '0 seconds' THEN
    
    -- Convert interval to seconds
    time_seconds := EXTRACT(EPOCH FROM NEW.finish_time);
    
    -- Calculate speed in km/h: distance / (time_in_seconds / 3600)
    IF time_seconds > 0 THEN
      NEW.average_speed_kmh := event_distance / (time_seconds / 3600.0);
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_calculate_average_speed_external_results ON external_results;

-- Create trigger
CREATE TRIGGER trigger_calculate_average_speed_external_results
  BEFORE INSERT OR UPDATE ON external_results
  FOR EACH ROW
  EXECUTE FUNCTION calculate_average_speed_external_results();
