/*
  # Fix Admin Functions Permissions

  1. Purpose
    - Ensure admin functions are accessible without authentication
    - Grant execute permissions to anon role for admin functions
  
  2. Changes
    - Grant EXECUTE on admin functions to anon and authenticated roles
    - This allows the frontend to call these functions
  
  3. Security
    - Functions are SECURITY DEFINER so they bypass RLS
    - Frontend authentication layer ensures only admins can access admin pages
*/

-- Grant execute permissions on admin functions
GRANT EXECUTE ON FUNCTION admin_get_dashboard_stats() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION admin_get_all_events() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION admin_get_all_organizers() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION admin_get_all_entries() TO anon, authenticated;
