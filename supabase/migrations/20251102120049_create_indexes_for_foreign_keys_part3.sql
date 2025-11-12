/*
  # Create Indexes for Foreign Keys - Part 3

  1. Changes
    - Add indexes to foreign key columns for optimal query performance
    - Part 3: Carpooling, Design, Entries, Events, Invitations

  2. Tables Covered
    - carpooling_offers
    - design_versions
    - entries
    - events
    - invitations
    - organizer_bank_details
    - organizer_federations
    - organizers
    - payment_transactions
*/

-- Carpooling offers
CREATE INDEX IF NOT EXISTS idx_carpooling_offers_event_id 
  ON carpooling_offers(event_id);

-- Design versions
CREATE INDEX IF NOT EXISTS idx_design_versions_created_by 
  ON design_versions(created_by);

-- Entries
CREATE INDEX IF NOT EXISTS idx_entries_organizer_id 
  ON entries(organizer_id);
CREATE INDEX IF NOT EXISTS idx_entries_updated_by 
  ON entries(updated_by);

-- Events
CREATE INDEX IF NOT EXISTS idx_events_organizer_id 
  ON events(organizer_id);

-- Invitations
CREATE INDEX IF NOT EXISTS idx_invitations_created_by 
  ON invitations(created_by);
CREATE INDEX IF NOT EXISTS idx_invitations_race_id 
  ON invitations(race_id);
CREATE INDEX IF NOT EXISTS idx_invitations_used_by_registration_id 
  ON invitations(used_by_registration_id);

-- Organizer bank details
CREATE INDEX IF NOT EXISTS idx_organizer_bank_details_verified_by 
  ON organizer_bank_details(verified_by);

-- Organizer federations
CREATE INDEX IF NOT EXISTS idx_organizer_federations_federation_id 
  ON organizer_federations(federation_id);

-- Organizers
CREATE INDEX IF NOT EXISTS idx_organizers_user_id 
  ON organizers(user_id);

-- Payment transactions
CREATE INDEX IF NOT EXISTS idx_payment_transactions_entry_id 
  ON payment_transactions(entry_id);