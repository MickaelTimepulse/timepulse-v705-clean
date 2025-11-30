/*
  # Create Indexes for Foreign Keys - Part 2

  1. Changes
    - Add indexes to foreign key columns for optimal query performance
    - Part 2: Bib Exchange tables

  2. Tables Covered
    - bib_exchange_alerts
    - bib_exchange_listings
    - bib_exchange_transfers
*/

-- Bib exchange alerts
CREATE INDEX IF NOT EXISTS idx_bib_exchange_alerts_race_id 
  ON bib_exchange_alerts(race_id);

-- Bib exchange listings
CREATE INDEX IF NOT EXISTS idx_bib_exchange_listings_race_id 
  ON bib_exchange_listings(race_id);
CREATE INDEX IF NOT EXISTS idx_bib_exchange_listings_registration_id 
  ON bib_exchange_listings(registration_id);

-- Bib exchange transfers
CREATE INDEX IF NOT EXISTS idx_bib_exchange_transfers_buyer_registration_id 
  ON bib_exchange_transfers(buyer_registration_id);
CREATE INDEX IF NOT EXISTS idx_bib_exchange_transfers_listing_id 
  ON bib_exchange_transfers(listing_id);
CREATE INDEX IF NOT EXISTS idx_bib_exchange_transfers_race_id 
  ON bib_exchange_transfers(race_id);
CREATE INDEX IF NOT EXISTS idx_bib_exchange_transfers_seller_registration_id 
  ON bib_exchange_transfers(seller_registration_id);