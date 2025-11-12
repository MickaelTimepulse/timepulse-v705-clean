/*
  # Remove Unused Indexes - Part 2

  1. Changes
    - Drop unused indexes on race pricing, settings, promo codes, license types

  2. Tables Affected
    - race_pricing
    - settings
    - promo_codes
    - license_types
*/

-- Race pricing indexes
DROP INDEX IF EXISTS idx_race_pricing_period;
DROP INDEX IF EXISTS idx_race_pricing_license;
DROP INDEX IF EXISTS idx_race_pricing_active;

-- Settings indexes
DROP INDEX IF EXISTS idx_settings_category;

-- Promo codes indexes
DROP INDEX IF EXISTS idx_promo_codes_race;
DROP INDEX IF EXISTS idx_promo_codes_code;

-- License types indexes
DROP INDEX IF EXISTS idx_license_types_active;
DROP INDEX IF EXISTS idx_license_types_code;