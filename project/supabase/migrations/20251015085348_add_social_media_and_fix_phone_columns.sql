/*
  # Add Social Media and Fix Phone Columns

  1. Changes
    - Add `instagram_url` column for Instagram profile links
    - Add `facebook_url` column for Facebook page/profile links
    - Rename `contact_phone` to `landline_phone` for consistency
    
  2. Notes
    - Social media URLs are optional
    - Migration handles existing data safely
*/

DO $$
BEGIN
  -- Add Instagram URL column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'organizers' 
    AND column_name = 'instagram_url'
  ) THEN
    ALTER TABLE organizers ADD COLUMN instagram_url TEXT;
  END IF;

  -- Add Facebook URL column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'organizers' 
    AND column_name = 'facebook_url'
  ) THEN
    ALTER TABLE organizers ADD COLUMN facebook_url TEXT;
  END IF;

  -- Rename contact_phone to landline_phone if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'organizers' 
    AND column_name = 'contact_phone'
  ) THEN
    ALTER TABLE organizers RENAME COLUMN contact_phone TO landline_phone;
  END IF;

  -- Add landline_phone if neither exists (safety check)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'organizers' 
    AND column_name = 'landline_phone'
  ) THEN
    ALTER TABLE organizers ADD COLUMN landline_phone TEXT;
  END IF;
END $$;