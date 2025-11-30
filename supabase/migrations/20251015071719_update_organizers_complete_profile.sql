/*
  # Update organizers table with complete profile fields
  
  1. New Fields
    - `organizer_type` (text) - Type: association, collectivity, company, individual
    - `full_address` (text) - Adresse postale complète
    - `mobile_phone` (text) - Numéro de portable
    - `website_url` (text) - Site web de l'organisation
    - `facebook_url` (text) - URL du compte Facebook
    - `instagram_url` (text) - URL du compte Instagram
    - `email` (text) - Email principal de contact
    - `public_description` (text) - Description publique visible sur les événements
    - `logo_file_url` (text) - URL du logo uploadé
    - `is_profile_complete` (boolean) - Si le profil est complété
  
  2. Update Existing Fields
    - Rename `organization_name` to match documentation
    - Ensure all contact fields are present
  
  3. Notes
    - Separate table for bank details (RIB) for security
    - Logo will appear on organizer page and event pages
    - Social media links will show icons when provided
    - Type determines form requirements and validations
*/

DO $$
BEGIN
  -- Add organizer_type if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organizers' AND column_name = 'organizer_type'
  ) THEN
    ALTER TABLE organizers ADD COLUMN organizer_type text DEFAULT 'association' 
      CHECK (organizer_type IN ('association', 'collectivity', 'company', 'individual'));
  END IF;

  -- Add full_address if not exists (different from address which might be shorter)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organizers' AND column_name = 'full_address'
  ) THEN
    ALTER TABLE organizers ADD COLUMN full_address text;
  END IF;

  -- Add mobile_phone if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organizers' AND column_name = 'mobile_phone'
  ) THEN
    ALTER TABLE organizers ADD COLUMN mobile_phone text;
  END IF;

  -- Add website_url if not exists (standardize naming)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organizers' AND column_name = 'website_url'
  ) THEN
    -- Copy existing website field if it exists
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'organizers' AND column_name = 'website'
    ) THEN
      ALTER TABLE organizers ADD COLUMN website_url text;
      UPDATE organizers SET website_url = website WHERE website IS NOT NULL;
    ELSE
      ALTER TABLE organizers ADD COLUMN website_url text;
    END IF;
  END IF;

  -- Add facebook_url if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organizers' AND column_name = 'facebook_url'
  ) THEN
    ALTER TABLE organizers ADD COLUMN facebook_url text;
  END IF;

  -- Add instagram_url if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organizers' AND column_name = 'instagram_url'
  ) THEN
    ALTER TABLE organizers ADD COLUMN instagram_url text;
  END IF;

  -- Add email if not exists (main contact email)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organizers' AND column_name = 'email'
  ) THEN
    ALTER TABLE organizers ADD COLUMN email text;
  END IF;

  -- Add public_description if not exists (different from internal description)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organizers' AND column_name = 'public_description'
  ) THEN
    ALTER TABLE organizers ADD COLUMN public_description text;
  END IF;

  -- Add logo_file_url if not exists (different from logo_url to be explicit)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organizers' AND column_name = 'logo_file_url'
  ) THEN
    -- Copy existing logo_url if it exists
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'organizers' AND column_name = 'logo_url'
    ) THEN
      ALTER TABLE organizers ADD COLUMN logo_file_url text;
      UPDATE organizers SET logo_file_url = logo_url WHERE logo_url IS NOT NULL;
    ELSE
      ALTER TABLE organizers ADD COLUMN logo_file_url text;
    END IF;
  END IF;

  -- Add is_profile_complete if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organizers' AND column_name = 'is_profile_complete'
  ) THEN
    ALTER TABLE organizers ADD COLUMN is_profile_complete boolean DEFAULT false;
  END IF;

  -- Add updated_at if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organizers' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE organizers ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;

END $$;

-- Create index for organizer type
CREATE INDEX IF NOT EXISTS idx_organizers_type ON organizers(organizer_type);
CREATE INDEX IF NOT EXISTS idx_organizers_complete ON organizers(is_profile_complete) WHERE is_profile_complete = true;
CREATE INDEX IF NOT EXISTS idx_organizers_email ON organizers(email);

-- Add comments for documentation
COMMENT ON COLUMN organizers.organizer_type IS 'Type of organizer: association, collectivity (commune/département), company, or individual';
COMMENT ON COLUMN organizers.full_address IS 'Complete postal address for official documents and communication';
COMMENT ON COLUMN organizers.mobile_phone IS 'Mobile phone number for urgent contact';
COMMENT ON COLUMN organizers.facebook_url IS 'Facebook page URL - icon displayed when provided';
COMMENT ON COLUMN organizers.instagram_url IS 'Instagram account URL - icon displayed when provided';
COMMENT ON COLUMN organizers.public_description IS 'Public description shown on event pages and organizer profile';
COMMENT ON COLUMN organizers.logo_file_url IS 'Logo URL - displayed on organizer profile and event pages';
COMMENT ON COLUMN organizers.is_profile_complete IS 'Flag indicating if organizer has completed all required profile fields';