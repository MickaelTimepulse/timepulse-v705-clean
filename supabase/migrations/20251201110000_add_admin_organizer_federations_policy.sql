/*
  # Add Admin Policy for Organizer Federations

  1. Changes
    - Add policy allowing admins to insert/update/delete organizer_federations
    - Fixes RLS error when admin modifies organizer federations

  2. Security
    - Only authenticated admins can modify organizer_federations
    - Uses is_supabase_admin() function to check admin status
*/

-- Admin can view all organizer federations
CREATE POLICY "Admins can view all organizer_federations"
  ON organizer_federations FOR SELECT
  TO authenticated
  USING (is_supabase_admin());

-- Admin can insert organizer federations
CREATE POLICY "Admins can insert organizer_federations"
  ON organizer_federations FOR INSERT
  TO authenticated
  WITH CHECK (is_supabase_admin());

-- Admin can update organizer federations
CREATE POLICY "Admins can update organizer_federations"
  ON organizer_federations FOR UPDATE
  TO authenticated
  USING (is_supabase_admin());

-- Admin can delete organizer federations
CREATE POLICY "Admins can delete organizer_federations"
  ON organizer_federations FOR DELETE
  TO authenticated
  USING (is_supabase_admin());

-- Admin policies for organizer_bank_details
CREATE POLICY "Admins can view all organizer_bank_details"
  ON organizer_bank_details FOR SELECT
  TO authenticated
  USING (is_supabase_admin());

CREATE POLICY "Admins can insert organizer_bank_details"
  ON organizer_bank_details FOR INSERT
  TO authenticated
  WITH CHECK (is_supabase_admin());

CREATE POLICY "Admins can update organizer_bank_details"
  ON organizer_bank_details FOR UPDATE
  TO authenticated
  USING (is_supabase_admin());

CREATE POLICY "Admins can delete organizer_bank_details"
  ON organizer_bank_details FOR DELETE
  TO authenticated
  USING (is_supabase_admin());
