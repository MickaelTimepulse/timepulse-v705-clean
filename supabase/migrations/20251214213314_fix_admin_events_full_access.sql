/*
  # Fix Admin Full Access to Events

  1. Changes
    - Drop old admin policies on events
    - Create new comprehensive admin policies using is_admin() function
    - Ensure admins can view, create, update, and delete ALL events

  2. Security
    - Uses is_admin() function to verify admin status
    - Maintains organizer policies unchanged
    - Admins bypass organizer_id checks
*/

-- Drop old admin policies
DROP POLICY IF EXISTS "Supabase Auth admins can view all events" ON events;
DROP POLICY IF EXISTS "Supabase Auth admins can insert events" ON events;
DROP POLICY IF EXISTS "Supabase Auth admins can update all events" ON events;
DROP POLICY IF EXISTS "Supabase Auth admins can delete all events" ON events;

-- Create new admin policies with is_admin() function

-- Admin can view ALL events
CREATE POLICY "admins_view_all_events"
  ON events
  FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- Admin can insert events for any organizer
CREATE POLICY "admins_insert_any_event"
  ON events
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

-- Admin can update ALL events
CREATE POLICY "admins_update_all_events"
  ON events
  FOR UPDATE
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Admin can delete ALL events
CREATE POLICY "admins_delete_all_events"
  ON events
  FOR DELETE
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- Also ensure the same for races table
DROP POLICY IF EXISTS "Supabase Auth admins can manage races" ON races;
DROP POLICY IF EXISTS "admins_full_access_races" ON races;

CREATE POLICY "admins_manage_all_races"
  ON races
  FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- And for entries table
DROP POLICY IF EXISTS "Admins can manage all entries" ON entries;

CREATE POLICY "admins_manage_all_entries"
  ON entries
  FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Add admin policies for pricing_periods
DROP POLICY IF EXISTS "admins_manage_pricing" ON pricing_periods;

CREATE POLICY "admins_manage_pricing_periods"
  ON pricing_periods
  FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Add admin policies for race_pricing
DROP POLICY IF EXISTS "admins_manage_race_pricing" ON race_pricing;

CREATE POLICY "admins_manage_all_race_pricing"
  ON race_pricing
  FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));
