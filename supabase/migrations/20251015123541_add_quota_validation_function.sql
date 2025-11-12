/*
  # Add Quota Validation Function

  1. New Functions
    - validate_license_quotas: Validates that cumulative license quotas don't exceed race max_participants
    - check_pricing_quota_consistency: Trigger function to enforce quota rules

  2. Changes
    - Add trigger on race_pricing to validate quotas on INSERT/UPDATE
    - Ensures sum of license quotas <= race max_participants (if race has a limit)

  3. Business Rules
    - If race has max_participants set, sum of all license max_registrations must not exceed it
    - If a license has no max_registrations, it's considered unlimited
    - Validates only when race has a participant limit
*/

-- Function to check if cumulative quotas exceed race limit
CREATE OR REPLACE FUNCTION validate_license_quotas()
RETURNS trigger AS $$
DECLARE
  v_race_max_participants integer;
  v_total_license_quota integer;
BEGIN
  -- Get the race max_participants
  SELECT max_participants INTO v_race_max_participants
  FROM races
  WHERE id = NEW.race_id;

  -- Only validate if race has a participant limit
  IF v_race_max_participants IS NOT NULL THEN
    -- Calculate sum of all license quotas for this race and pricing period
    SELECT COALESCE(SUM(max_registrations), 0) INTO v_total_license_quota
    FROM race_pricing
    WHERE race_id = NEW.race_id
      AND pricing_period_id = NEW.pricing_period_id
      AND max_registrations IS NOT NULL
      AND id != NEW.id; -- Exclude current record if updating

    -- Add the current quota being inserted/updated
    IF NEW.max_registrations IS NOT NULL THEN
      v_total_license_quota := v_total_license_quota + NEW.max_registrations;
    END IF;

    -- Check if total exceeds race limit
    IF v_total_license_quota > v_race_max_participants THEN
      RAISE EXCEPTION 'Total license quotas (%) exceed race participant limit (%)', 
        v_total_license_quota, v_race_max_participants
        USING HINT = 'Reduce individual license quotas or increase race participant limit';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS check_pricing_quota_consistency ON race_pricing;
CREATE TRIGGER check_pricing_quota_consistency
  BEFORE INSERT OR UPDATE ON race_pricing
  FOR EACH ROW
  EXECUTE FUNCTION validate_license_quotas();
