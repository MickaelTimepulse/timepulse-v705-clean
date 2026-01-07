/*
  # Clean All Registration Options Policies

  1. Changes
    - Drop ALL existing policies
    - Create only 5 clean, non-overlapping policies
    - Ensure admins have full access
    - Ensure organizers can manage their events
    - Allow public to create during registration

  2. Security
    - Proper RLS with minimal necessary policies
    - No duplicate or conflicting policies
*/

-- Drop ALL existing policies
DROP POLICY IF EXISTS "Admins manage all registration options" ON registration_options;
DROP POLICY IF EXISTS "Organizers manage their events registration options" ON registration_options;
DROP POLICY IF EXISTS "Organizers can delete registration options for their entries" ON registration_options;
DROP POLICY IF EXISTS "Admins can insert options for any entry" ON registration_options;
DROP POLICY IF EXISTS "Anyone can create registration options during registration" ON registration_options;
DROP POLICY IF EXISTS "Anyone can create registration options for online entries" ON registration_options;
DROP POLICY IF EXISTS "Organizers can insert options for entries" ON registration_options;
DROP POLICY IF EXISTS "TEMP - Allow all authenticated to insert" ON registration_options;
DROP POLICY IF EXISTS "Organizers can view registration options for their entries" ON registration_options;
DROP POLICY IF EXISTS "Public read access to registration options" ON registration_options;
DROP POLICY IF EXISTS "Organizers can update registration options for their entries" ON registration_options;
DROP POLICY IF EXISTS "Users can update their registration options" ON registration_options;

-- Policy 1: Admins have full access
CREATE POLICY "admins_full_access"
  ON registration_options
  FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Policy 2: Organizers can manage their events' options
CREATE POLICY "organizers_manage_own_events"
  ON registration_options
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM entries e
      INNER JOIN races r ON r.id = e.race_id
      INNER JOIN events ev ON ev.id = r.event_id
      INNER JOIN organizers o ON o.id = ev.organizer_id
      WHERE e.id = registration_options.entry_id
      AND o.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM entries e
      INNER JOIN races r ON r.id = e.race_id
      INNER JOIN events ev ON ev.id = r.event_id
      INNER JOIN organizers o ON o.id = ev.organizer_id
      WHERE e.id = registration_options.entry_id
      AND o.user_id = auth.uid()
    )
  );

-- Policy 3: Public can create options during registration
CREATE POLICY "public_insert_during_registration"
  ON registration_options
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Policy 4: Public read access
CREATE POLICY "public_read_access"
  ON registration_options
  FOR SELECT
  TO public
  USING (true);

-- Policy 5: Athletes can update their own options
CREATE POLICY "athletes_update_own_options"
  ON registration_options
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM entries e
      INNER JOIN athletes a ON a.id = e.athlete_id
      WHERE e.id = registration_options.entry_id
      AND a.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM entries e
      INNER JOIN athletes a ON a.id = e.athlete_id
      WHERE e.id = registration_options.entry_id
      AND a.user_id = auth.uid()
    )
  );
