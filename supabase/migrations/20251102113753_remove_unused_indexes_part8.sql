/*
  # Remove Unused Indexes - Part 8

  1. Changes
    - Drop unused indexes on various organizer and race tables

  2. Tables Affected
    - events
    - invitations
    - organizer_bank_details
    - organizers
    - promo_codes
    - race_categories
    - race_category_restrictions
    - registrations
    - race_types
*/

-- Events indexes
DROP INDEX IF EXISTS idx_events_organizer_id;

-- Invitations indexes
DROP INDEX IF EXISTS idx_invitations_created_by;
DROP INDEX IF EXISTS idx_invitations_used_by_reg;

-- Organizer bank details indexes
DROP INDEX IF EXISTS idx_organizer_bank_details_verified_by;

-- Organizers indexes
DROP INDEX IF EXISTS idx_organizers_user_id;

-- Promo codes indexes
DROP INDEX IF EXISTS idx_promo_codes_created_by;
DROP INDEX IF EXISTS idx_promo_codes_license_type_id;

-- Race categories indexes
DROP INDEX IF EXISTS idx_race_categories_race_id;

-- Race category restrictions indexes
DROP INDEX IF EXISTS idx_race_category_restrictions_category;

-- Registrations indexes
DROP INDEX IF EXISTS idx_registrations_category_id;
DROP INDEX IF EXISTS idx_registrations_invitation_id;
DROP INDEX IF EXISTS idx_registrations_promo_code_id;

-- Race types indexes
DROP INDEX IF EXISTS idx_race_types_sport;
DROP INDEX IF EXISTS idx_race_types_slug;
DROP INDEX IF EXISTS idx_race_types_active;