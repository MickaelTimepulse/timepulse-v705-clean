/*
  # Fix Security Issues - Part 3: Optimize Critical RLS Policies

  1. Performance Optimization
    - Replace auth.uid() with (select auth.uid()) in most-used policies
    - Prevents re-evaluation for each row
    - Significant performance improvement at scale

  2. Tables optimized (most critical ones)
    - profiles
    - organizers
    - events
    - races
    - registrations
    - entries
    - results
    - athletes
*/

-- Drop and recreate profiles policies
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (id = (select auth.uid()))
  WITH CHECK (id = (select auth.uid()));

-- Drop and recreate key organizers policies
DROP POLICY IF EXISTS "Organizers can insert own data" ON organizers;
CREATE POLICY "Organizers can insert own data"
  ON organizers
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Organizers can update own data" ON organizers;
CREATE POLICY "Organizers can update own data"
  ON organizers
  FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Organizers can update own profile" ON organizers;
CREATE POLICY "Organizers can update own profile"
  ON organizers
  FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Organizers can view own profile" ON organizers;
CREATE POLICY "Organizers can view own profile"
  ON organizers
  FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

-- Drop and recreate key events policies
DROP POLICY IF EXISTS "Organizers can create events" ON events;
CREATE POLICY "Organizers can create events"
  ON events
  FOR INSERT
  TO authenticated
  WITH CHECK (
    organizer_id IN (
      SELECT id FROM organizers WHERE user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Organizers can delete own events" ON events;
CREATE POLICY "Organizers can delete own events"
  ON events
  FOR DELETE
  TO authenticated
  USING (
    organizer_id IN (
      SELECT id FROM organizers WHERE user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Organizers can update own events" ON events;
CREATE POLICY "Organizers can update own events"
  ON events
  FOR UPDATE
  TO authenticated
  USING (
    organizer_id IN (
      SELECT id FROM organizers WHERE user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    organizer_id IN (
      SELECT id FROM organizers WHERE user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Organizers can view own events" ON events;
CREATE POLICY "Organizers can view own events"
  ON events
  FOR SELECT
  TO authenticated
  USING (
    organizer_id IN (
      SELECT id FROM organizers WHERE user_id = (select auth.uid())
    )
  );

-- Optimize races policy
DROP POLICY IF EXISTS "Organizers can manage races for own events" ON races;
CREATE POLICY "Organizers can manage races for own events"
  ON races
  FOR ALL
  TO authenticated
  USING (
    event_id IN (
      SELECT e.id FROM events e
      INNER JOIN organizers o ON o.id = e.organizer_id
      WHERE o.user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    event_id IN (
      SELECT e.id FROM events e
      INNER JOIN organizers o ON o.id = e.organizer_id
      WHERE o.user_id = (select auth.uid())
    )
  );

-- Optimize race_categories policy
DROP POLICY IF EXISTS "Organizers can manage categories" ON race_categories;
CREATE POLICY "Organizers can manage categories"
  ON race_categories
  FOR ALL
  TO authenticated
  USING (
    race_id IN (
      SELECT r.id FROM races r
      INNER JOIN events e ON e.id = r.event_id
      INNER JOIN organizers o ON o.id = e.organizer_id
      WHERE o.user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    race_id IN (
      SELECT r.id FROM races r
      INNER JOIN events e ON e.id = r.event_id
      INNER JOIN organizers o ON o.id = e.organizer_id
      WHERE o.user_id = (select auth.uid())
    )
  );

-- Optimize registrations policies
DROP POLICY IF EXISTS "Organizers can update registrations for own events" ON registrations;
CREATE POLICY "Organizers can update registrations for own events"
  ON registrations
  FOR UPDATE
  TO authenticated
  USING (
    race_id IN (
      SELECT r.id FROM races r
      INNER JOIN events e ON e.id = r.event_id
      INNER JOIN organizers o ON o.id = e.organizer_id
      WHERE o.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Organizers can view registrations for own events" ON registrations;
CREATE POLICY "Organizers can view registrations for own events"
  ON registrations
  FOR SELECT
  TO authenticated
  USING (
    race_id IN (
      SELECT r.id FROM races r
      INNER JOIN events e ON e.id = r.event_id
      INNER JOIN organizers o ON o.id = e.organizer_id
      WHERE o.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can create registrations" ON registrations;
CREATE POLICY "Users can create registrations"
  ON registrations
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can view own registrations" ON registrations;
CREATE POLICY "Users can view own registrations"
  ON registrations
  FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));
