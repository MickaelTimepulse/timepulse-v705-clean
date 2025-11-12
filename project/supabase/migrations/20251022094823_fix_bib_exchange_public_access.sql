/*
  # Fix Bib Exchange Public Access

  1. Changes
    - Drop existing public read policy for bib_exchange_settings
    - Create new policies that allow both authenticated and anonymous users to view enabled settings
    - Also fix the public access to bib_exchange_listings

  2. Security
    - Maintains security by only exposing settings where is_enabled = true
    - Allows public (unauthenticated) users to see if bib exchange is enabled
*/

-- Drop the existing policies
DROP POLICY IF EXISTS "Public can view bib exchange settings" ON bib_exchange_settings;
DROP POLICY IF EXISTS "Public can view available listings" ON bib_exchange_listings;

-- Create new policies for anonymous users (unauthenticated)
CREATE POLICY "Anonymous can view enabled bib exchange settings"
  ON bib_exchange_settings FOR SELECT
  TO anon
  USING (is_enabled = true);

-- Also ensure authenticated users can view
CREATE POLICY "Authenticated can view enabled bib exchange settings"
  ON bib_exchange_settings FOR SELECT
  TO authenticated
  USING (is_enabled = true);

-- Fix listings access for anonymous users
CREATE POLICY "Anonymous can view available listings"
  ON bib_exchange_listings FOR SELECT
  TO anon
  USING (status = 'available');

-- Also ensure authenticated users can view (in addition to their own listings policy)
CREATE POLICY "Authenticated can view available listings"
  ON bib_exchange_listings FOR SELECT
  TO authenticated
  USING (status = 'available');