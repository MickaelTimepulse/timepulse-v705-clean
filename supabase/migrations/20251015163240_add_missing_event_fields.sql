/*
  # Add missing fields to events table for backward compatibility
  
  1. Changes
    - Add `website` (text) - Alias for website_url
    - Add `registration_url` (text) - URL for external registration
    - Add `city` (text) - Alias for location_city
    - Add `postal_code` (text) - Alias for location_postal_code
    - Add `image_url` (text) - Alias for cover_image_url
    
  2. Notes
    - These fields provide compatibility with frontend code
    - Fields are nullable since they duplicate existing data
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'events' AND column_name = 'website'
  ) THEN
    ALTER TABLE events ADD COLUMN website text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'events' AND column_name = 'registration_url'
  ) THEN
    ALTER TABLE events ADD COLUMN registration_url text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'events' AND column_name = 'city'
  ) THEN
    ALTER TABLE events ADD COLUMN city text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'events' AND column_name = 'postal_code'
  ) THEN
    ALTER TABLE events ADD COLUMN postal_code text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'events' AND column_name = 'image_url'
  ) THEN
    ALTER TABLE events ADD COLUMN image_url text;
  END IF;
END $$;
