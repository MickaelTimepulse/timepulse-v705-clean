/*
  # Fix trigger_link_result_to_athlete function

  1. Changes
    - Replace reference to non-existent `entry_id` column with `registration_id`
    - Update the trigger to use the correct column name
*/

CREATE OR REPLACE FUNCTION trigger_link_result_to_athlete()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public', 'pg_temp'
AS $$
BEGIN
  -- Si on a un registration_id mais pas d'athlete_id, tenter le matching
  IF NEW.registration_id IS NOT NULL AND NEW.athlete_id IS NULL THEN
    NEW.athlete_id := link_result_to_athlete_by_entry(NEW.id);
  END IF;

  RETURN NEW;
END;
$$;
