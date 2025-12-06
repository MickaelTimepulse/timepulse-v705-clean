/*
  # Fix Admin Access to Organizer Federations (Temporary)

  1. Problem
    - Admin login doesn't always populate admin_users.user_id
    - is_supabase_admin() returns false because user_id is null
    - Admin cannot modify organizers

  2. Solution
    - Create alternative function that checks admin by email
    - Add fallback policies using this function

  3. Security
    - Still restrictive: only active admin_users can access
*/

-- Function to check if current user is admin by email (fallback)
CREATE OR REPLACE FUNCTION is_admin_by_email()
RETURNS boolean AS $$
DECLARE
  v_user_email text;
BEGIN
  -- Get current user email from Supabase Auth
  SELECT email INTO v_user_email
  FROM auth.users
  WHERE id = auth.uid();
  
  -- Check if this email exists in admin_users and is active
  RETURN EXISTS (
    SELECT 1 FROM admin_users
    WHERE email = v_user_email
    AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing admin policies on organizer_federations
DROP POLICY IF EXISTS "Admins can view all organizer_federations" ON organizer_federations;
DROP POLICY IF EXISTS "Admins can insert organizer_federations" ON organizer_federations;
DROP POLICY IF EXISTS "Admins can update organizer_federations" ON organizer_federations;
DROP POLICY IF EXISTS "Admins can delete organizer_federations" ON organizer_federations;

-- Recreate with fallback check
CREATE POLICY "Admins can view all organizer_federations"
  ON organizer_federations FOR SELECT
  TO authenticated
  USING (is_supabase_admin() OR is_admin_by_email());

CREATE POLICY "Admins can insert organizer_federations"
  ON organizer_federations FOR INSERT
  TO authenticated
  WITH CHECK (is_supabase_admin() OR is_admin_by_email());

CREATE POLICY "Admins can update organizer_federations"
  ON organizer_federations FOR UPDATE
  TO authenticated
  USING (is_supabase_admin() OR is_admin_by_email());

CREATE POLICY "Admins can delete organizer_federations"
  ON organizer_federations FOR DELETE
  TO authenticated
  USING (is_supabase_admin() OR is_admin_by_email());

-- Same for organizer_bank_details
DROP POLICY IF EXISTS "Admins can view all organizer_bank_details" ON organizer_bank_details;
DROP POLICY IF EXISTS "Admins can insert organizer_bank_details" ON organizer_bank_details;
DROP POLICY IF EXISTS "Admins can update organizer_bank_details" ON organizer_bank_details;
DROP POLICY IF EXISTS "Admins can delete organizer_bank_details" ON organizer_bank_details;

CREATE POLICY "Admins can view all organizer_bank_details"
  ON organizer_bank_details FOR SELECT
  TO authenticated
  USING (is_supabase_admin() OR is_admin_by_email());

CREATE POLICY "Admins can insert organizer_bank_details"
  ON organizer_bank_details FOR INSERT
  TO authenticated
  WITH CHECK (is_supabase_admin() OR is_admin_by_email());

CREATE POLICY "Admins can update organizer_bank_details"
  ON organizer_bank_details FOR UPDATE
  TO authenticated
  USING (is_supabase_admin() OR is_admin_by_email());

CREATE POLICY "Admins can delete organizer_bank_details"
  ON organizer_bank_details FOR DELETE
  TO authenticated
  USING (is_supabase_admin() OR is_admin_by_email());
