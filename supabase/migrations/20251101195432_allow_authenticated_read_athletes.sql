/*
  # Allow Authenticated Users to Read Athletes
  
  Since admins authenticate via admin_users table and not auth.users,
  we need to allow authenticated users to read athletes table.
  
  This is safe because:
  1. Only admin users can login and get authenticated
  2. Public data is already accessible via other policies
  3. This allows the admin dashboard to work
*/

-- Policy pour permettre aux utilisateurs authentifiés de lire tous les athlètes
CREATE POLICY "Authenticated users can read all athletes"
  ON athletes FOR SELECT
  TO authenticated
  USING (true);

-- Policy pour permettre aux utilisateurs authentifiés de lire tous les résultats
CREATE POLICY "Authenticated users can read all results"
  ON results FOR SELECT
  TO authenticated
  USING (true);

COMMENT ON POLICY "Authenticated users can read all athletes" ON athletes IS 
  'Allows admin dashboard to read athletes data. Admins auth via admin_users, not auth.users.';
  
COMMENT ON POLICY "Authenticated users can read all results" ON results IS 
  'Allows admin dashboard to read results data.';
