/*
  # Remove Unused Indexes - Part 9 (Athlete Ecosystem)

  1. Changes
    - Drop unused indexes on athlete-related tables

  2. Tables Affected
    - athletes
    - athlete_records
    - training_logs
    - athlete_photos
    - timepulse_index_history
    - badges
    - athlete_badges
    - european_cities
*/

-- Athletes indexes
DROP INDEX IF EXISTS idx_athletes_search;
DROP INDEX IF EXISTS idx_athletes_license_number;

-- Athlete records indexes
DROP INDEX IF EXISTS idx_athlete_records_athlete;
DROP INDEX IF EXISTS idx_athlete_records_type;
DROP INDEX IF EXISTS idx_athlete_records_race_id;
DROP INDEX IF EXISTS idx_athlete_records_result_id;

-- Training logs indexes
DROP INDEX IF EXISTS idx_training_logs_athlete;
DROP INDEX IF EXISTS idx_training_logs_date;
DROP INDEX IF EXISTS idx_training_logs_public;

-- Athlete photos indexes
DROP INDEX IF EXISTS idx_athlete_photos_athlete;
DROP INDEX IF EXISTS idx_athlete_photos_race;
DROP INDEX IF EXISTS idx_athlete_photos_public;
DROP INDEX IF EXISTS idx_athlete_photos_profile;

-- Timepulse index history indexes
DROP INDEX IF EXISTS idx_timepulse_history_athlete;

-- Badges indexes
DROP INDEX IF EXISTS idx_badges_category;
DROP INDEX IF EXISTS idx_badges_active;
DROP INDEX IF EXISTS idx_badges_rarity;

-- Athlete badges indexes
DROP INDEX IF EXISTS idx_athlete_badges_athlete;
DROP INDEX IF EXISTS idx_athlete_badges_badge;
DROP INDEX IF EXISTS idx_athlete_badges_earned;
DROP INDEX IF EXISTS idx_athlete_badges_featured;
DROP INDEX IF EXISTS idx_athlete_badges_race_id;
DROP INDEX IF EXISTS idx_athlete_badges_result_id;

-- European cities indexes
DROP INDEX IF EXISTS idx_european_cities_name;
DROP INDEX IF EXISTS idx_european_cities_name_country;