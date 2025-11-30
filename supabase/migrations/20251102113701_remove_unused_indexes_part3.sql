/*
  # Remove Unused Indexes - Part 3

  1. Changes
    - Drop unused indexes on audit logs, bib config, organizers, federations

  2. Tables Affected
    - audit_logs
    - bib_number_config
    - organizers
    - federations
*/

-- Audit logs indexes
DROP INDEX IF EXISTS idx_audit_logs_entity;
DROP INDEX IF EXISTS idx_audit_logs_actor;
DROP INDEX IF EXISTS idx_audit_logs_created;
DROP INDEX IF EXISTS idx_audit_logs_action;

-- Bib config indexes
DROP INDEX IF EXISTS idx_bib_config_locked;

-- Organizers indexes
DROP INDEX IF EXISTS idx_organizers_imported;
DROP INDEX IF EXISTS idx_organizers_legacy_id;
DROP INDEX IF EXISTS idx_organizers_type;
DROP INDEX IF EXISTS idx_organizers_complete;

-- Federations indexes
DROP INDEX IF EXISTS idx_federations_active;
DROP INDEX IF EXISTS idx_federations_code;
DROP INDEX IF EXISTS idx_federations_has_api;