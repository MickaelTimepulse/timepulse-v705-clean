/*
  # Add Admin RLS Policies for Supabase Auth Admins

  1. Purpose
    - Admins now authenticate via Supabase Auth (not custom admin_users auth)
    - When an admin logs in, a Supabase Auth user is created with admin metadata
    - Need RLS policies that allow these Supabase Auth users to modify data

  2. How it works
    - Admin login creates a Supabase Auth user with metadata containing admin_id
    - We check if this Supabase Auth user_id exists in admin_users table
    - If yes, grant full access to all tables

  3. New Policies
    - Admin UPDATE/DELETE policies on: events, races, entries, organizers
    - These policies check if auth.uid() corresponds to an admin
*/

-- Helper function to check if current Supabase Auth user is an admin
CREATE OR REPLACE FUNCTION is_supabase_admin()
RETURNS boolean AS $$
BEGIN
  -- Check if there's an admin_users record with this Supabase Auth user_id
  -- The user_id is set when admin logs in via Supabase Auth
  RETURN EXISTS (
    SELECT 1 FROM admin_users
    WHERE user_id = auth.uid()
    AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Events: Admin policies
CREATE POLICY "Supabase Auth admins can view all events"
  ON events FOR SELECT
  TO authenticated
  USING (is_supabase_admin());

CREATE POLICY "Supabase Auth admins can update all events"
  ON events FOR UPDATE
  TO authenticated
  USING (is_supabase_admin());

CREATE POLICY "Supabase Auth admins can delete all events"
  ON events FOR DELETE
  TO authenticated
  USING (is_supabase_admin());

CREATE POLICY "Supabase Auth admins can insert events"
  ON events FOR INSERT
  TO authenticated
  WITH CHECK (is_supabase_admin());

-- Races: Admin policies
CREATE POLICY "Supabase Auth admins can view all races"
  ON races FOR SELECT
  TO authenticated
  USING (is_supabase_admin());

CREATE POLICY "Supabase Auth admins can update all races"
  ON races FOR UPDATE
  TO authenticated
  USING (is_supabase_admin());

CREATE POLICY "Supabase Auth admins can delete all races"
  ON races FOR DELETE
  TO authenticated
  USING (is_supabase_admin());

CREATE POLICY "Supabase Auth admins can insert races"
  ON races FOR INSERT
  TO authenticated
  WITH CHECK (is_supabase_admin());

-- Entries: Admin policies
CREATE POLICY "Supabase Auth admins can view all entries"
  ON entries FOR SELECT
  TO authenticated
  USING (is_supabase_admin());

CREATE POLICY "Supabase Auth admins can update all entries"
  ON entries FOR UPDATE
  TO authenticated
  USING (is_supabase_admin());

CREATE POLICY "Supabase Auth admins can delete all entries"
  ON entries FOR DELETE
  TO authenticated
  USING (is_supabase_admin());

CREATE POLICY "Supabase Auth admins can insert entries"
  ON entries FOR INSERT
  TO authenticated
  WITH CHECK (is_supabase_admin());

-- Organizers: Admin policies
CREATE POLICY "Supabase Auth admins can view all organizers"
  ON organizers FOR SELECT
  TO authenticated
  USING (is_supabase_admin());

CREATE POLICY "Supabase Auth admins can update all organizers"
  ON organizers FOR UPDATE
  TO authenticated
  USING (is_supabase_admin());

CREATE POLICY "Supabase Auth admins can delete all organizers"
  ON organizers FOR DELETE
  TO authenticated
  USING (is_supabase_admin());

-- Registrations: Admin policies
CREATE POLICY "Supabase Auth admins can view all registrations"
  ON registrations FOR SELECT
  TO authenticated
  USING (is_supabase_admin());

CREATE POLICY "Supabase Auth admins can update all registrations"
  ON registrations FOR UPDATE
  TO authenticated
  USING (is_supabase_admin());

CREATE POLICY "Supabase Auth admins can delete all registrations"
  ON registrations FOR DELETE
  TO authenticated
  USING (is_supabase_admin());

-- Athletes: Admin policies
CREATE POLICY "Supabase Auth admins can view all athletes"
  ON athletes FOR SELECT
  TO authenticated
  USING (is_supabase_admin());

CREATE POLICY "Supabase Auth admins can update all athletes"
  ON athletes FOR UPDATE
  TO authenticated
  USING (is_supabase_admin());

-- Race Pricing: Admin policies
CREATE POLICY "Supabase Auth admins can view all race_pricing"
  ON race_pricing FOR SELECT
  TO authenticated
  USING (is_supabase_admin());

CREATE POLICY "Supabase Auth admins can update all race_pricing"
  ON race_pricing FOR UPDATE
  TO authenticated
  USING (is_supabase_admin());

CREATE POLICY "Supabase Auth admins can insert race_pricing"
  ON race_pricing FOR INSERT
  TO authenticated
  WITH CHECK (is_supabase_admin());

CREATE POLICY "Supabase Auth admins can delete race_pricing"
  ON race_pricing FOR DELETE
  TO authenticated
  USING (is_supabase_admin());

-- Race Options: Admin policies
CREATE POLICY "Supabase Auth admins can view all race_options"
  ON race_options FOR SELECT
  TO authenticated
  USING (is_supabase_admin());

CREATE POLICY "Supabase Auth admins can update all race_options"
  ON race_options FOR UPDATE
  TO authenticated
  USING (is_supabase_admin());

CREATE POLICY "Supabase Auth admins can insert race_options"
  ON race_options FOR INSERT
  TO authenticated
  WITH CHECK (is_supabase_admin());

CREATE POLICY "Supabase Auth admins can delete race_options"
  ON race_options FOR DELETE
  TO authenticated
  USING (is_supabase_admin());

-- Race Category Restrictions: Admin policies
CREATE POLICY "Supabase Auth admins can view all race_category_restrictions"
  ON race_category_restrictions FOR SELECT
  TO authenticated
  USING (is_supabase_admin());

CREATE POLICY "Supabase Auth admins can update all race_category_restrictions"
  ON race_category_restrictions FOR UPDATE
  TO authenticated
  USING (is_supabase_admin());

CREATE POLICY "Supabase Auth admins can insert race_category_restrictions"
  ON race_category_restrictions FOR INSERT
  TO authenticated
  WITH CHECK (is_supabase_admin());

CREATE POLICY "Supabase Auth admins can delete race_category_restrictions"
  ON race_category_restrictions FOR DELETE
  TO authenticated
  USING (is_supabase_admin());

-- Invitations: Admin policies
CREATE POLICY "Supabase Auth admins can view all invitations"
  ON invitations FOR SELECT
  TO authenticated
  USING (is_supabase_admin());

CREATE POLICY "Supabase Auth admins can update all invitations"
  ON invitations FOR UPDATE
  TO authenticated
  USING (is_supabase_admin());

CREATE POLICY "Supabase Auth admins can insert invitations"
  ON invitations FOR INSERT
  TO authenticated
  WITH CHECK (is_supabase_admin());

CREATE POLICY "Supabase Auth admins can delete invitations"
  ON invitations FOR DELETE
  TO authenticated
  USING (is_supabase_admin());

-- Promo Codes: Admin policies
CREATE POLICY "Supabase Auth admins can view all promo_codes"
  ON promo_codes FOR SELECT
  TO authenticated
  USING (is_supabase_admin());

CREATE POLICY "Supabase Auth admins can update all promo_codes"
  ON promo_codes FOR UPDATE
  TO authenticated
  USING (is_supabase_admin());

CREATE POLICY "Supabase Auth admins can insert promo_codes"
  ON promo_codes FOR INSERT
  TO authenticated
  WITH CHECK (is_supabase_admin());

CREATE POLICY "Supabase Auth admins can delete promo_codes"
  ON promo_codes FOR DELETE
  TO authenticated
  USING (is_supabase_admin());

-- Event Characteristics: Admin policies
CREATE POLICY "Supabase Auth admins can view all event_characteristics"
  ON event_characteristics FOR SELECT
  TO authenticated
  USING (is_supabase_admin());

CREATE POLICY "Supabase Auth admins can insert event_characteristics"
  ON event_characteristics FOR INSERT
  TO authenticated
  WITH CHECK (is_supabase_admin());

CREATE POLICY "Supabase Auth admins can delete event_characteristics"
  ON event_characteristics FOR DELETE
  TO authenticated
  USING (is_supabase_admin());
