/*
  # Fix Security Issues - Part 1: Missing Foreign Key Indexes

  1. Performance Optimization
    - Add indexes for all foreign keys without covering indexes
    - Improves query performance significantly
    - Reduces table scan overhead

  2. Tables affected (26 foreign keys)
    - admin_user_permissions (2 indexes)
    - admin_users (1 index)
    - backups (1 index)
    - bib_exchange_alerts (1 index)
    - bib_exchange_transfers (3 indexes)
    - bib_number_config (1 index)
    - design_versions (1 index)
    - entries (1 index)
    - events (1 index)
    - invitations (2 indexes)
    - organizer_bank_details (1 index)
    - organizers (1 index)
    - promo_codes (2 indexes)
    - race_categories (1 index)
    - race_category_restrictions (1 index)
    - registrations (3 indexes)
    - result_imports (1 index)
    - results (1 index)
    - timepulse_commission_settings (1 index)
*/

-- admin_user_permissions indexes
CREATE INDEX IF NOT EXISTS idx_admin_user_permissions_granted_by 
  ON admin_user_permissions(granted_by);

CREATE INDEX IF NOT EXISTS idx_admin_user_permissions_permission_id 
  ON admin_user_permissions(permission_id);

-- admin_users indexes
CREATE INDEX IF NOT EXISTS idx_admin_users_role_id 
  ON admin_users(role_id);

-- backups indexes
CREATE INDEX IF NOT EXISTS idx_backups_created_by 
  ON backups(created_by);

-- bib_exchange_alerts indexes
CREATE INDEX IF NOT EXISTS idx_bib_exchange_alerts_race_id 
  ON bib_exchange_alerts(race_id);

-- bib_exchange_transfers indexes
CREATE INDEX IF NOT EXISTS idx_bib_exchange_transfers_buyer_reg 
  ON bib_exchange_transfers(buyer_registration_id);

CREATE INDEX IF NOT EXISTS idx_bib_exchange_transfers_race_id 
  ON bib_exchange_transfers(race_id);

CREATE INDEX IF NOT EXISTS idx_bib_exchange_transfers_seller_reg 
  ON bib_exchange_transfers(seller_registration_id);

-- bib_number_config indexes
CREATE INDEX IF NOT EXISTS idx_bib_number_config_locked_by 
  ON bib_number_config(locked_by);

-- design_versions indexes
CREATE INDEX IF NOT EXISTS idx_design_versions_created_by 
  ON design_versions(created_by);

-- entries indexes
CREATE INDEX IF NOT EXISTS idx_entries_updated_by 
  ON entries(updated_by);

-- events indexes
CREATE INDEX IF NOT EXISTS idx_events_organizer_id 
  ON events(organizer_id);

-- invitations indexes
CREATE INDEX IF NOT EXISTS idx_invitations_created_by 
  ON invitations(created_by);

CREATE INDEX IF NOT EXISTS idx_invitations_used_by_reg 
  ON invitations(used_by_registration_id);

-- organizer_bank_details indexes
CREATE INDEX IF NOT EXISTS idx_organizer_bank_details_verified_by 
  ON organizer_bank_details(verified_by);

-- organizers indexes
CREATE INDEX IF NOT EXISTS idx_organizers_user_id 
  ON organizers(user_id);

-- promo_codes indexes
CREATE INDEX IF NOT EXISTS idx_promo_codes_created_by 
  ON promo_codes(created_by);

CREATE INDEX IF NOT EXISTS idx_promo_codes_license_type_id 
  ON promo_codes(license_type_id);

-- race_categories indexes
CREATE INDEX IF NOT EXISTS idx_race_categories_race_id 
  ON race_categories(race_id);

-- race_category_restrictions indexes
CREATE INDEX IF NOT EXISTS idx_race_category_restrictions_category 
  ON race_category_restrictions(category_code);

-- registrations indexes
CREATE INDEX IF NOT EXISTS idx_registrations_category_id 
  ON registrations(category_id);

CREATE INDEX IF NOT EXISTS idx_registrations_invitation_id 
  ON registrations(invitation_id);

CREATE INDEX IF NOT EXISTS idx_registrations_promo_code_id 
  ON registrations(promo_code_id);

-- result_imports indexes
CREATE INDEX IF NOT EXISTS idx_result_imports_imported_by 
  ON result_imports(imported_by);

-- results indexes
CREATE INDEX IF NOT EXISTS idx_results_registration_id 
  ON results(registration_id);

-- timepulse_commission_settings indexes
CREATE INDEX IF NOT EXISTS idx_timepulse_commission_created_by 
  ON timepulse_commission_settings(created_by);
