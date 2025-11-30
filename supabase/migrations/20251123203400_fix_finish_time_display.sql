/*
  # Fix finish_time_display values

  1. Updates
    - Sync finish_time_display with finish_time for all external_results
    - This corrects the display values that were incorrectly parsed

  2. Notes
    - finish_time contains the correct parsed time (HH:MM:SS)
    - finish_time_display should show the same value for consistency
    - This migration fixes all existing records
*/

-- Update all external_results to sync finish_time_display with finish_time
UPDATE external_results
SET finish_time_display = finish_time
WHERE finish_time IS NOT NULL;
