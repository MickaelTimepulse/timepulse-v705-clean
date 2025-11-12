/*
  # Remove Unused Indexes - Part 7

  1. Changes
    - Drop unused indexes on carpooling, admin permissions, backups, bib exchange

  2. Tables Affected
    - carpooling_offers
    - admin_user_permissions
    - admin_users
    - backups
    - bib_exchange_alerts
    - bib_exchange_transfers
    - bib_exchange_listings
    - email_logs
*/

-- Carpooling offers indexes
DROP INDEX IF EXISTS idx_carpooling_offers_event_id;
DROP INDEX IF EXISTS idx_carpooling_offers_management_code;
DROP INDEX IF EXISTS idx_carpooling_offers_meeting_city;

-- Admin user permissions indexes
DROP INDEX IF EXISTS idx_admin_user_permissions_permission_id;

-- Admin users indexes
DROP INDEX IF EXISTS idx_admin_users_role_id;

-- Backups indexes
DROP INDEX IF EXISTS idx_backups_created_by;

-- Bib exchange alerts indexes
DROP INDEX IF EXISTS idx_bib_exchange_alerts_race_id;
DROP INDEX IF EXISTS idx_bib_exchange_alerts_event;
DROP INDEX IF EXISTS idx_bib_exchange_alerts_email;

-- Bib exchange transfers indexes
DROP INDEX IF EXISTS idx_bib_exchange_transfers_buyer_reg;
DROP INDEX IF EXISTS idx_bib_exchange_transfers_race_id;
DROP INDEX IF EXISTS idx_bib_exchange_transfers_seller_reg;
DROP INDEX IF EXISTS idx_bib_exchange_transfers_listing;

-- Bib exchange listings indexes
DROP INDEX IF EXISTS idx_bib_exchange_listings_race_status;
DROP INDEX IF EXISTS idx_bib_exchange_listings_registration;

-- Email logs indexes
DROP INDEX IF EXISTS idx_email_logs_status;
DROP INDEX IF EXISTS idx_email_logs_to_email;