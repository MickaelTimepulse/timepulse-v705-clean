/*
  # Create Indexes for Foreign Keys - Part 4

  1. Changes
    - Add indexes to foreign key columns for optimal query performance
    - Part 4: Promo codes, Race tables, Registrations, Results

  2. Tables Covered
    - promo_codes
    - race_categories
    - race_category_restrictions
    - race_pricing
    - registration_attempts
    - registration_options
    - registrations
    - result_imports
    - results
    - timepulse_commission_settings
*/

-- Promo codes
CREATE INDEX IF NOT EXISTS idx_promo_codes_created_by 
  ON promo_codes(created_by);
CREATE INDEX IF NOT EXISTS idx_promo_codes_license_type_id 
  ON promo_codes(license_type_id);
CREATE INDEX IF NOT EXISTS idx_promo_codes_race_id 
  ON promo_codes(race_id);

-- Race categories
CREATE INDEX IF NOT EXISTS idx_race_categories_race_id 
  ON race_categories(race_id);

-- Race category restrictions
CREATE INDEX IF NOT EXISTS idx_race_category_restrictions_category_code 
  ON race_category_restrictions(category_code);

-- Race pricing
CREATE INDEX IF NOT EXISTS idx_race_pricing_license_type_id 
  ON race_pricing(license_type_id);
CREATE INDEX IF NOT EXISTS idx_race_pricing_pricing_period_id 
  ON race_pricing(pricing_period_id);

-- Registration attempts
CREATE INDEX IF NOT EXISTS idx_registration_attempts_event_id 
  ON registration_attempts(event_id);
CREATE INDEX IF NOT EXISTS idx_registration_attempts_race_id 
  ON registration_attempts(race_id);

-- Registration options
CREATE INDEX IF NOT EXISTS idx_registration_options_choice_id 
  ON registration_options(choice_id);
CREATE INDEX IF NOT EXISTS idx_registration_options_option_id 
  ON registration_options(option_id);

-- Registrations
CREATE INDEX IF NOT EXISTS idx_registrations_category_id 
  ON registrations(category_id);
CREATE INDEX IF NOT EXISTS idx_registrations_invitation_id 
  ON registrations(invitation_id);
CREATE INDEX IF NOT EXISTS idx_registrations_promo_code_id 
  ON registrations(promo_code_id);
CREATE INDEX IF NOT EXISTS idx_registrations_user_id 
  ON registrations(user_id);

-- Result imports
CREATE INDEX IF NOT EXISTS idx_result_imports_imported_by 
  ON result_imports(imported_by);

-- Results
CREATE INDEX IF NOT EXISTS idx_results_registration_id 
  ON results(registration_id);

-- Timepulse commission settings
CREATE INDEX IF NOT EXISTS idx_timepulse_commission_settings_created_by 
  ON timepulse_commission_settings(created_by);