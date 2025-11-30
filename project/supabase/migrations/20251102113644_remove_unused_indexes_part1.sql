/*
  # Remove Unused Indexes - Part 1

  1. Changes
    - Drop unused indexes on various tables
    - These indexes are not being used and consume storage space
    - Part 1: Payment transactions, events, registrations, service pages

  2. Tables Affected
    - payment_transactions
    - events
    - registrations
    - service_pages
*/

-- Payment transactions indexes
DROP INDEX IF EXISTS idx_payment_transactions_entry_id;
DROP INDEX IF EXISTS idx_payment_transactions_order_id;
DROP INDEX IF EXISTS idx_payment_transactions_transaction_id;
DROP INDEX IF EXISTS idx_payment_transactions_status;

-- Events indexes
DROP INDEX IF EXISTS idx_events_city;

-- Registrations indexes
DROP INDEX IF EXISTS idx_registrations_user_id;

-- Service pages indexes
DROP INDEX IF EXISTS idx_service_pages_published;