/*
  # Fix Bib Exchange Settings - Allow Public Read Access
  
  1. Changes
    - Drop restrictive RLS policies that filter by is_enabled
    - Create new policies allowing public read access to all settings
    - Keep write restrictions for admins and organizers only
  
  2. Security
    - Anonymous and authenticated users can read ALL bib exchange settings
    - Only admins and event organizers can modify settings
    - This allows the frontend to properly display "not enabled" messages
*/

-- Drop existing restrictive read policies
DROP POLICY IF EXISTS "Anonymous users can view enabled settings" ON bib_exchange_settings;
DROP POLICY IF EXISTS "Authenticated users can view enabled settings" ON bib_exchange_settings;

-- Create new public read policy (no is_enabled filter)
CREATE POLICY "Public users can view all bib exchange settings"
  ON bib_exchange_settings
  FOR SELECT
  TO anon, authenticated
  USING (true);
