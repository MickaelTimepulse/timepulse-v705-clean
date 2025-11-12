/*
  # Remove Unused Indexes - Part 4

  1. Changes
    - Drop unused indexes on admin tables, pricing periods, invitations

  2. Tables Affected
    - admin_users
    - admin_sessions
    - pricing_periods
    - invitations
    - organizer_federations
*/

-- Admin users indexes
DROP INDEX IF EXISTS idx_admin_users_role;

-- Admin sessions indexes
DROP INDEX IF EXISTS idx_admin_sessions_token;

-- Pricing periods indexes
DROP INDEX IF EXISTS idx_pricing_periods_race;

-- Invitations indexes
DROP INDEX IF EXISTS idx_invitations_race;
DROP INDEX IF EXISTS idx_invitations_code;
DROP INDEX IF EXISTS idx_invitations_email;
DROP INDEX IF EXISTS idx_invitations_status;

-- Organizer federations indexes
DROP INDEX IF EXISTS idx_organizer_federations_federation;
DROP INDEX IF EXISTS idx_organizer_federations_primary;