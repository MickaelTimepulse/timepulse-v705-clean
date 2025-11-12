/*
  # Temporary Anon Access for Admin Dashboard
  
  TEMPORARY FIX: Allow anon role to read athletes and results.
  This is needed because admin auth system doesn't create Supabase auth sessions.
  
  TODO: Long-term fix - Create proper Supabase auth sessions for admins
  
  Security Note: 
  - This allows read access to athlete data without authentication
  - Only SELECT is allowed, no INSERT/UPDATE/DELETE
  - Admin pages should be protected at routing level
*/

-- Policy temporaire pour permettre l'accès anon en lecture
CREATE POLICY "Temporary anon read access for admin"
  ON athletes FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Temporary anon read access to results for admin"
  ON results FOR SELECT
  TO anon
  USING (true);

COMMENT ON POLICY "Temporary anon read access for admin" ON athletes IS 
  'TEMPORARY: Allows admin dashboard to work. TODO: Implement proper admin auth with Supabase sessions.';

COMMENT ON POLICY "Temporary anon read access to results for admin" ON results IS 
  'TEMPORARY: Allows admin dashboard to work. TODO: Implement proper admin auth with Supabase sessions.';
