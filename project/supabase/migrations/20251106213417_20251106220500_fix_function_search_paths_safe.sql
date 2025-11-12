/*
  # Correction des search_path des fonctions (version sécurisée)
  
  1. Problèmes corrigés
    - Ajout de search_path fixe pour toutes les fonctions existantes
    - Protection contre les attaques par manipulation du search_path
    
  2. Sécurité
    - search_path fixé à 'public, pg_temp'
    - Ignore les fonctions inexistantes
*/

-- =====================================================
-- Correction sécurisée avec DO block
-- =====================================================

DO $$
DECLARE
  func_record RECORD;
BEGIN
  -- Liste des fonctions à corriger
  FOR func_record IN 
    SELECT 
      p.proname as func_name,
      pg_get_function_identity_arguments(p.oid) as func_args
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
    AND p.proname IN (
      'get_active_commission',
      'generate_athlete_slug',
      'match_athlete_by_identity',
      'get_volunteer_post_stats',
      'calculate_rankings',
      'create_public_registration',
      'auto_assign_bib_number',
      'get_event_statistics',
      'admin_get_dashboard_stats',
      'admin_get_all_events',
      'admin_get_all_organizers',
      'admin_get_email_logs',
      'admin_get_athletes',
      'admin_get_athletes_stats',
      'admin_get_athlete_details',
      'admin_update_athlete',
      'admin_delete_athlete',
      'admin_link_user_to_athlete',
      'admin_search_athletes',
      'admin_reset_organizer_password',
      'admin_recalculate_athlete_index',
      'admin_get_all_users',
      'admin_get_user_permissions',
      'admin_update_user_permissions',
      'admin_get_activity_logs',
      'admin_log_activity',
      'admin_create_login_session',
      'admin_close_login_session',
      'admin_get_login_sessions',
      'admin_create_user',
      'create_athlete_profile_trigger',
      'create_athlete_with_account',
      'calculate_timepulse_index',
      'award_badge',
      'check_athlete_badges',
      'link_results_to_athletes',
      'link_results_to_athletes_improved',
      'recalculate_all_indices',
      'recalculate_all_athlete_indices',
      'get_timepulse_leaderboard',
      'link_results_via_entries',
      'link_result_to_athlete_by_entry',
      'link_all_results_to_athletes',
      'find_duplicate_athletes',
      'merge_athletes',
      'get_athlete_race_stats',
      'get_available_seats',
      'update_setting_as_admin',
      'upsert_athlete',
      'generate_management_code',
      'set_management_code',
      'calculate_seller_refund',
      'get_last_name_from_athlete_name',
      'get_first_name_from_athlete_name',
      'generate_temp_password',
      'verify_admin_password',
      'log_audit_event',
      'ensure_single_primary_federation',
      'audit_bank_details_access',
      'handle_new_user',
      'register_athlete_with_quota_check',
      'calculate_ffa_category',
      'generate_entry_management_code',
      'set_entry_management_code',
      'is_admin',
      'trigger_check_badges_on_result',
      'trigger_recalculate_index_on_result',
      'trigger_link_result_to_athlete',
      'update_volunteer_posts_updated_at',
      'update_volunteers_updated_at',
      'update_volunteer_assignments_updated_at',
      'update_bib_exchange_updated_at',
      'update_entry_modified_at',
      'import_french_cities',
      'delete_cities_by_country',
      'create_atomic_registration',
      'get_event_volunteer_summary'
    )
  LOOP
    BEGIN
      EXECUTE format(
        'ALTER FUNCTION %I(%s) SET search_path = public, pg_temp',
        func_record.func_name,
        func_record.func_args
      );
      RAISE NOTICE 'Fixed: %(%)', func_record.func_name, func_record.func_args;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE NOTICE 'Skipped: %(%)', func_record.func_name, func_record.func_args;
    END;
  END LOOP;
END $$;
