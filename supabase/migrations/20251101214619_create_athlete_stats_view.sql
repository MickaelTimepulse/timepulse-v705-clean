/*
  # Create Athlete Stats View
  
  Create a view that efficiently aggregates athlete statistics:
  - Total number of races
  - Total number of podiums (top 3)
  - Date of last race
  
  This view will be used by AdminAthletes page to display stats efficiently.
*/

-- Drop existing view if exists
DROP VIEW IF EXISTS athlete_stats;

-- Create efficient view for athlete statistics
CREATE VIEW athlete_stats AS
SELECT 
  a.id,
  a.first_name,
  a.last_name,
  a.birthdate,
  a.gender,
  a.email,
  a.slug,
  a.is_public,
  a.timepulse_index,
  a.user_id,
  a.nationality,
  a.city,
  a.license_club,
  a.license_number,
  a.created_at,
  a.updated_at,
  (a.user_id IS NOT NULL) as has_user_account,
  COUNT(DISTINCT r.id) FILTER (WHERE r.status = 'finished') as total_races,
  COUNT(DISTINCT r.id) FILTER (WHERE r.status = 'finished' AND r.overall_rank <= 3) as total_podiums,
  MAX(ra.start_time) as last_race_date
FROM athletes a
LEFT JOIN results r ON r.athlete_id = a.id
LEFT JOIN races ra ON ra.id = r.race_id
GROUP BY a.id;

-- Grant permissions
GRANT SELECT ON athlete_stats TO anon, authenticated;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_results_athlete_status 
  ON results(athlete_id, status) 
  WHERE status = 'finished';

COMMENT ON VIEW athlete_stats IS 
  'Aggregated statistics for each athlete including race count, podiums, and last race date';
