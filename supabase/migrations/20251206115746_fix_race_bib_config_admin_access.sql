/*
  # Fix admin access to race_bib_config

  1. Problem
    - Admins cannot create or modify race bib configurations
    - Error: "new row violates row-level security policy"

  2. Solution
    - Add admin policies to allow super_admin and admin_manager to manage all race bib configs
    - Keep existing organizer policies

  3. Security
    - Super admins and admin managers can manage all bib configs
    - Organizers can only manage their own race bib configs
*/

-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Organizers can view their race bib config" ON race_bib_config;
DROP POLICY IF EXISTS "Organizers can manage their race bib config" ON race_bib_config;

-- Admins can view all race bib configs
CREATE POLICY "Admins can view all race bib configs"
  ON race_bib_config
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE user_id = auth.uid()
      AND role IN ('super_admin', 'admin_manager')
    )
  );

-- Admins can create race bib configs
CREATE POLICY "Admins can create race bib configs"
  ON race_bib_config
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE user_id = auth.uid()
      AND role IN ('super_admin', 'admin_manager')
    )
  );

-- Admins can update race bib configs
CREATE POLICY "Admins can update race bib configs"
  ON race_bib_config
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE user_id = auth.uid()
      AND role IN ('super_admin', 'admin_manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE user_id = auth.uid()
      AND role IN ('super_admin', 'admin_manager')
    )
  );

-- Admins can delete race bib configs
CREATE POLICY "Admins can delete race bib configs"
  ON race_bib_config
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE user_id = auth.uid()
      AND role IN ('super_admin', 'admin_manager')
    )
  );

-- Organizers can view config for their races
CREATE POLICY "Organizers can view their race bib config"
  ON race_bib_config
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM races
      JOIN events ON races.event_id = events.id
      JOIN organizers ON events.organizer_id = organizers.id
      WHERE races.id = race_bib_config.race_id
      AND organizers.user_id = auth.uid()
    )
  );

-- Organizers can create config for their races
CREATE POLICY "Organizers can create their race bib config"
  ON race_bib_config
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM races
      JOIN events ON races.event_id = events.id
      JOIN organizers ON events.organizer_id = organizers.id
      WHERE races.id = race_bib_config.race_id
      AND organizers.user_id = auth.uid()
    )
  );

-- Organizers can update config for their races
CREATE POLICY "Organizers can update their race bib config"
  ON race_bib_config
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM races
      JOIN events ON races.event_id = events.id
      JOIN organizers ON events.organizer_id = organizers.id
      WHERE races.id = race_bib_config.race_id
      AND organizers.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM races
      JOIN events ON races.event_id = events.id
      JOIN organizers ON events.organizer_id = organizers.id
      WHERE races.id = race_bib_config.race_id
      AND organizers.user_id = auth.uid()
    )
  );

-- Organizers can delete config for their races
CREATE POLICY "Organizers can delete their race bib config"
  ON race_bib_config
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM races
      JOIN events ON races.event_id = events.id
      JOIN organizers ON events.organizer_id = organizers.id
      WHERE races.id = race_bib_config.race_id
      AND organizers.user_id = auth.uid()
    )
  );
