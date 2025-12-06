/*
  # Add Team Configuration to Races

  1. Changes
    - Add `is_team_race` boolean to races table
    - Add `team_config` jsonb to races table for flexible team configuration

  2. Team Configuration Structure
    ```json
    {
      "enabled": true,
      "min_members": 2,
      "max_members": 6,
      "team_types": ["hommes", "femmes", "mixte", "entreprise", "club"],
      "allow_mixed_gender": true,
      "require_full_team": false,
      "payment_mode": "team",
      "allow_individual_payment": true,
      "modify_deadline_days": 7,
      "allow_multi_registration": false,
      "bib_format": "sequential"
    }
    ```

  3. Security
    - Organizers can configure teams for their races
*/

-- Add team configuration fields to races
ALTER TABLE races
ADD COLUMN IF NOT EXISTS is_team_race boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS team_config jsonb DEFAULT '{
  "enabled": false,
  "min_members": 2,
  "max_members": 6,
  "team_types": ["mixte", "hommes", "femmes"],
  "allow_mixed_gender": true,
  "require_full_team": false,
  "payment_mode": "team",
  "allow_individual_payment": true,
  "modify_deadline_days": 7,
  "allow_multi_registration": false,
  "bib_format": "sequential",
  "auto_assign_bibs": true
}'::jsonb;

-- Create index for team races
CREATE INDEX IF NOT EXISTS idx_races_is_team_race ON races(is_team_race) WHERE is_team_race = true;

-- Function to validate team config
CREATE OR REPLACE FUNCTION validate_team_config(config jsonb)
RETURNS boolean
LANGUAGE plpgsql
AS $$
BEGIN
  -- Check required fields
  IF NOT (config ? 'min_members' AND config ? 'max_members') THEN
    RETURN false;
  END IF;

  -- Validate min/max
  IF (config->>'min_members')::integer < 2 THEN
    RETURN false;
  END IF;

  IF (config->>'max_members')::integer < (config->>'min_members')::integer THEN
    RETURN false;
  END IF;

  RETURN true;
END;
$$;

-- Add check constraint
ALTER TABLE races
ADD CONSTRAINT check_team_config_valid
CHECK (
  NOT is_team_race OR validate_team_config(team_config)
);