/*
  # Create Indexes for Foreign Keys - Part 1

  1. Changes
    - Add indexes to foreign key columns for optimal query performance
    - Part 1: Admin and Athlete related tables

  2. Tables Covered
    - admin_user_permissions
    - admin_users
    - athlete_badges
    - athlete_photos
    - athlete_records
    - backups
    - badges
    - timepulse_index_history
    - training_logs
*/

-- Admin user permissions
CREATE INDEX IF NOT EXISTS idx_admin_user_permissions_permission_id 
  ON admin_user_permissions(permission_id);

-- Admin users
CREATE INDEX IF NOT EXISTS idx_admin_users_role_id 
  ON admin_users(role_id);

-- Athlete badges
CREATE INDEX IF NOT EXISTS idx_athlete_badges_badge_id 
  ON athlete_badges(badge_id);
CREATE INDEX IF NOT EXISTS idx_athlete_badges_race_id 
  ON athlete_badges(race_id);
CREATE INDEX IF NOT EXISTS idx_athlete_badges_result_id 
  ON athlete_badges(result_id);

-- Athlete photos
CREATE INDEX IF NOT EXISTS idx_athlete_photos_athlete_id 
  ON athlete_photos(athlete_id);
CREATE INDEX IF NOT EXISTS idx_athlete_photos_race_id 
  ON athlete_photos(race_id);

-- Athlete records
CREATE INDEX IF NOT EXISTS idx_athlete_records_race_id 
  ON athlete_records(race_id);
CREATE INDEX IF NOT EXISTS idx_athlete_records_race_type_id 
  ON athlete_records(race_type_id);
CREATE INDEX IF NOT EXISTS idx_athlete_records_result_id 
  ON athlete_records(result_id);

-- Backups
CREATE INDEX IF NOT EXISTS idx_backups_created_by 
  ON backups(created_by);

-- Badges
CREATE INDEX IF NOT EXISTS idx_badges_category_id 
  ON badges(category_id);

-- Timepulse index history
CREATE INDEX IF NOT EXISTS idx_timepulse_index_history_athlete_id 
  ON timepulse_index_history(athlete_id);

-- Training logs
CREATE INDEX IF NOT EXISTS idx_training_logs_athlete_id 
  ON training_logs(athlete_id);