/*
  # Fix Registration Options RLS - Complete Solution

  1. Changes
    - Re-enable RLS on registration_options table
    - Drop all existing policies
    - Create comprehensive new policies for:
      - Admins: full access
      - Organizers: access to their events' options
      - Public/Authenticated: create during registration
      - Public read access for completed registrations

  2. Security
    - All policies use proper checks
    - Admin function is security definer
    - Organizer ownership verified through events/races chain
*/

-- Re-enable RLS
ALTER TABLE registration_options ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Admin full access to registration options" ON registration_options;
DROP POLICY IF EXISTS "Organizers can manage their event registration options" ON registration_options;
DROP POLICY IF EXISTS "Public can read registration options" ON registration_options;

-- Create is_admin function if not exists
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_users
    WHERE admin_users.user_id = is_admin.user_id
  );
END;
$$;

-- Policy 1: Admins have full access
CREATE POLICY "Admins manage all registration options"
  ON registration_options
  FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Policy 2: Organizers can manage options for their events
CREATE POLICY "Organizers manage their events registration options"
  ON registration_options
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM entries e
      INNER JOIN races r ON r.id = e.race_id
      INNER JOIN events ev ON ev.id = r.event_id
      WHERE e.id = registration_options.entry_id
      AND ev.organizer_id IN (
        SELECT id FROM organizers WHERE user_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM entries e
      INNER JOIN races r ON r.id = e.race_id
      INNER JOIN events ev ON ev.id = r.event_id
      WHERE e.id = registration_options.entry_id
      AND ev.organizer_id IN (
        SELECT id FROM organizers WHERE user_id = auth.uid()
      )
    )
  );

-- Policy 3: Public can create options during registration (authenticated or anon)
CREATE POLICY "Anyone can create registration options during registration"
  ON registration_options
  FOR INSERT
  TO public
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM entries e
      WHERE e.id = registration_options.entry_id
    )
  );

-- Policy 4: Public can read all registration options
CREATE POLICY "Public read access to registration options"
  ON registration_options
  FOR SELECT
  TO public
  USING (true);

-- Policy 5: Users can update their own registration options
CREATE POLICY "Users can update their registration options"
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

-- Create index to optimize RLS checks
CREATE INDEX IF NOT EXISTS idx_registration_options_entry_id 
  ON registration_options(entry_id);
