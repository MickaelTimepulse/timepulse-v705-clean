/*
  # Remove Unused Indexes - Part 6

  1. Changes
    - Drop unused indexes on entries, entry payments, design versions, registration options

  2. Tables Affected
    - entries
    - entry_payments
    - design_versions
    - registration_options
    - registration_attempts
*/

-- Entries indexes
DROP INDEX IF EXISTS idx_entries_source;
DROP INDEX IF EXISTS idx_entries_organizer;
DROP INDEX IF EXISTS idx_entries_session_token;
DROP INDEX IF EXISTS idx_entries_updated_by;

-- Entry payments indexes
DROP INDEX IF EXISTS idx_entry_payments_status;

-- Design versions indexes
DROP INDEX IF EXISTS idx_design_versions_reference;
DROP INDEX IF EXISTS idx_design_versions_created_by;

-- Registration options indexes
DROP INDEX IF EXISTS idx_registration_options_option;
DROP INDEX IF EXISTS idx_registration_options_choice;

-- Registration attempts indexes
DROP INDEX IF EXISTS idx_registration_attempts_session_time;
DROP INDEX IF EXISTS idx_registration_attempts_status_time;
DROP INDEX IF EXISTS idx_registration_attempts_race;
DROP INDEX IF EXISTS idx_registration_attempts_event;