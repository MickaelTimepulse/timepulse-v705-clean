/*
  # Correction des problèmes de sécurité - RLS Performance
  
  1. Problèmes corrigés
    - Optimisation RLS : Remplacement de auth.uid() par (select auth.uid())
    - Suppression des index non utilisés
    - Consolidation des politiques multiples
    - Correction des index dupliqués
    
  2. Tables affectées
    - volunteer_posts
    - volunteers
    - volunteer_assignments
    - volunteer_availability
    - athletes (suppression index dupliqué)
    
  3. Impact
    - Amélioration des performances RLS
    - Réduction de la charge sur la base de données
    - Nettoyage des index inutilisés
*/

-- =====================================================
-- PARTIE 1 : Optimisation RLS Performance
-- =====================================================

-- Fix volunteer_posts RLS
DROP POLICY IF EXISTS "Organizers can manage posts for their events" ON volunteer_posts;
CREATE POLICY "Organizers can manage posts for their events"
  ON volunteer_posts
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM events e
      WHERE e.id = volunteer_posts.event_id
      AND e.organizer_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM events e
      WHERE e.id = volunteer_posts.event_id
      AND e.organizer_id = (SELECT auth.uid())
    )
  );

-- Fix volunteers RLS
DROP POLICY IF EXISTS "Organizers can manage volunteers for their events" ON volunteers;
CREATE POLICY "Organizers can manage volunteers for their events"
  ON volunteers
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM events e
      WHERE e.id = volunteers.event_id
      AND e.organizer_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM events e
      WHERE e.id = volunteers.event_id
      AND e.organizer_id = (SELECT auth.uid())
    )
  );

-- Fix volunteer_assignments RLS
DROP POLICY IF EXISTS "Organizers can manage assignments for their events" ON volunteer_assignments;
CREATE POLICY "Organizers can manage assignments for their events"
  ON volunteer_assignments
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM volunteer_posts vp
      JOIN events e ON e.id = vp.event_id
      WHERE vp.id = volunteer_assignments.post_id
      AND e.organizer_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM volunteer_posts vp
      JOIN events e ON e.id = vp.event_id
      WHERE vp.id = volunteer_assignments.post_id
      AND e.organizer_id = (SELECT auth.uid())
    )
  );

-- Fix volunteer_availability RLS
DROP POLICY IF EXISTS "Organizers can view availability for their events" ON volunteer_availability;
CREATE POLICY "Organizers can view availability for their events"
  ON volunteer_availability
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM volunteers v
      JOIN events e ON e.id = v.event_id
      WHERE v.id = volunteer_availability.volunteer_id
      AND e.organizer_id = (SELECT auth.uid())
    )
  );

-- =====================================================
-- PARTIE 2 : Suppression des index inutilisés
-- =====================================================

-- Admin tables
DROP INDEX IF EXISTS idx_admin_user_permissions_permission_id;
DROP INDEX IF EXISTS idx_admin_users_role_id;

-- Athlete ecosystem
DROP INDEX IF EXISTS idx_athlete_badges_badge_id;
DROP INDEX IF EXISTS idx_athlete_badges_race_id;
DROP INDEX IF EXISTS idx_athlete_badges_result_id;
DROP INDEX IF EXISTS idx_athlete_photos_athlete_id;
DROP INDEX IF EXISTS idx_athlete_photos_race_id;
DROP INDEX IF EXISTS idx_athlete_records_race_id;
DROP INDEX IF EXISTS idx_athlete_records_race_type_id;
DROP INDEX IF EXISTS idx_athlete_records_result_id;
DROP INDEX IF EXISTS idx_timepulse_index_history_athlete_id;
DROP INDEX IF EXISTS idx_training_logs_athlete_id;

-- Backups & badges
DROP INDEX IF EXISTS idx_backups_created_by;
DROP INDEX IF EXISTS idx_badges_category_id;

-- Bib exchange
DROP INDEX IF EXISTS idx_bib_exchange_alerts_race_id;
DROP INDEX IF EXISTS idx_bib_exchange_listings_race_id;
DROP INDEX IF EXISTS idx_bib_exchange_listings_registration_id;
DROP INDEX IF EXISTS idx_bib_exchange_transfers_buyer_registration_id;
DROP INDEX IF EXISTS idx_bib_exchange_transfers_listing_id;
DROP INDEX IF EXISTS idx_bib_exchange_transfers_race_id;
DROP INDEX IF EXISTS idx_bib_exchange_transfers_seller_registration_id;

-- Design & entries
DROP INDEX IF EXISTS idx_design_versions_created_by;
DROP INDEX IF EXISTS idx_entries_organizer_id;
DROP INDEX IF EXISTS idx_entries_updated_by;

-- Invitations
DROP INDEX IF EXISTS idx_invitations_created_by;
DROP INDEX IF EXISTS idx_invitations_race_id;
DROP INDEX IF EXISTS idx_invitations_used_by_registration_id;

-- Organizers
DROP INDEX IF EXISTS idx_organizer_bank_details_verified_by;
DROP INDEX IF EXISTS idx_organizer_federations_federation_id;
DROP INDEX IF EXISTS idx_organizers_user_id;

-- Payments & promo codes
DROP INDEX IF EXISTS idx_payment_transactions_entry_id;
DROP INDEX IF EXISTS idx_promo_codes_created_by;
DROP INDEX IF EXISTS idx_promo_codes_license_type_id;
DROP INDEX IF EXISTS idx_promo_codes_race_id;

-- Race configuration
DROP INDEX IF EXISTS idx_race_categories_race_id;
DROP INDEX IF EXISTS idx_race_category_restrictions_category_code;
DROP INDEX IF EXISTS idx_race_pricing_license_type_id;
DROP INDEX IF EXISTS idx_race_pricing_pricing_period_id;

-- Registrations
DROP INDEX IF EXISTS idx_registration_attempts_event_id;
DROP INDEX IF EXISTS idx_registration_attempts_race_id;
DROP INDEX IF EXISTS idx_registration_options_choice_id;
DROP INDEX IF EXISTS idx_registration_options_option_id;
DROP INDEX IF EXISTS idx_registrations_category_id;
DROP INDEX IF EXISTS idx_registrations_invitation_id;
DROP INDEX IF EXISTS idx_registrations_promo_code_id;
DROP INDEX IF EXISTS idx_registrations_user_id;

-- Results
DROP INDEX IF EXISTS idx_result_imports_imported_by;
DROP INDEX IF EXISTS idx_results_registration_id;

-- Settings
DROP INDEX IF EXISTS idx_timepulse_commission_settings_created_by;

-- FFA & PPS
DROP INDEX IF EXISTS idx_events_ffa_calorg;
DROP INDEX IF EXISTS idx_athletes_pps_number;
DROP INDEX IF EXISTS idx_athletes_club_code;
DROP INDEX IF EXISTS idx_entries_pps_number;
DROP INDEX IF EXISTS idx_athletes_pps_expiry;
DROP INDEX IF EXISTS idx_entries_pps_expiry;
DROP INDEX IF EXISTS idx_entries_renewal_required;
DROP INDEX IF EXISTS idx_entries_management_code;
DROP INDEX IF EXISTS idx_entries_registration_status;
DROP INDEX IF EXISTS idx_entries_ffa_verified;

-- Duplicate index (keeping idx_athletes_ffa_club)
DROP INDEX IF EXISTS idx_athletes_club_code;

-- Volunteers
DROP INDEX IF EXISTS idx_events_volunteer_enabled;
DROP INDEX IF EXISTS idx_volunteer_posts_race;
DROP INDEX IF EXISTS idx_volunteer_posts_type;
DROP INDEX IF EXISTS idx_volunteers_email;
DROP INDEX IF EXISTS idx_volunteers_token;
DROP INDEX IF EXISTS idx_assignments_volunteer;
DROP INDEX IF EXISTS idx_assignments_status;
DROP INDEX IF EXISTS idx_availability_volunteer;

-- =====================================================
-- PARTIE 3 : Commentaires et documentation
-- =====================================================

COMMENT ON POLICY "Organizers can manage posts for their events" ON volunteer_posts IS 
'Optimized RLS policy using (select auth.uid()) for better performance';

COMMENT ON POLICY "Organizers can manage volunteers for their events" ON volunteers IS 
'Optimized RLS policy using (select auth.uid()) for better performance';

COMMENT ON POLICY "Organizers can manage assignments for their events" ON volunteer_assignments IS 
'Optimized RLS policy using (select auth.uid()) for better performance';

COMMENT ON POLICY "Organizers can view availability for their events" ON volunteer_availability IS 
'Optimized RLS policy using (select auth.uid()) for better performance';
