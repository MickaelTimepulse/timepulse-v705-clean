/*
  # Remove Unused Indexes - Part 5

  1. Changes
    - Drop unused indexes on bank details, results, race types, athletes

  2. Tables Affected
    - organizer_bank_details
    - result_imports
    - results
    - timepulse_commission_settings
    - races
    - license_types
    - admin_login_sessions
    - admin_activity_logs
    - athletes
*/

-- Bank details indexes
DROP INDEX IF EXISTS idx_bank_details_verified;

-- Result imports indexes
DROP INDEX IF EXISTS idx_result_imports_imported_by;
DROP INDEX IF EXISTS idx_result_imports_status;

-- Results indexes
DROP INDEX IF EXISTS idx_results_registration_id;

-- Timepulse commission indexes
DROP INDEX IF EXISTS idx_timepulse_commission_created_by;

-- Races indexes
DROP INDEX IF EXISTS idx_races_sport_type;

-- License types indexes
DROP INDEX IF EXISTS idx_license_types_federation;

-- Admin login sessions indexes
DROP INDEX IF EXISTS idx_admin_login_sessions_logged_in_at;

-- Admin activity logs indexes
DROP INDEX IF EXISTS idx_admin_activity_logs_module;

-- Athletes indexes
DROP INDEX IF EXISTS idx_athletes_birthdate;