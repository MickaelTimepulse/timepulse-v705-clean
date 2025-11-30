/*
  # Add legacy import fields to organizers table
  
  1. Changes
    - Add `legacy_id` (text, optional) - ID from old timepulse.fr system
    - Add `legacy_data` (jsonb, optional) - Any additional data from legacy system
    - Add `imported_at` (timestamptz, optional) - Date of import from legacy
    - Add `import_notes` (text, optional) - Notes about the import
    - Add `contact_name` (text) - Principal contact name (missing from current schema)
    - Add `contact_phone` (text) - Contact phone (missing from current schema)
  
  2. Indexes
    - Add index on legacy_id for quick lookups during import
    - Add index on imported_at for tracking imported records
  
  3. Notes
    - These fields prepare for migrating existing organizers from timepulse.fr
    - legacy_id allows mapping between old and new systems
    - legacy_data stores any custom fields that don't fit the new schema
    - Fields are optional to not break existing records
*/

-- Add legacy tracking fields
DO $$
BEGIN
  -- Add legacy_id if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organizers' AND column_name = 'legacy_id'
  ) THEN
    ALTER TABLE organizers ADD COLUMN legacy_id text;
  END IF;

  -- Add legacy_data if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organizers' AND column_name = 'legacy_data'
  ) THEN
    ALTER TABLE organizers ADD COLUMN legacy_data jsonb DEFAULT '{}';
  END IF;

  -- Add imported_at if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organizers' AND column_name = 'imported_at'
  ) THEN
    ALTER TABLE organizers ADD COLUMN imported_at timestamptz;
  END IF;

  -- Add import_notes if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organizers' AND column_name = 'import_notes'
  ) THEN
    ALTER TABLE organizers ADD COLUMN import_notes text;
  END IF;

  -- Add contact_name if not exists (important for organizer management)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organizers' AND column_name = 'contact_name'
  ) THEN
    ALTER TABLE organizers ADD COLUMN contact_name text;
  END IF;

  -- Add contact_phone if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organizers' AND column_name = 'contact_phone'
  ) THEN
    ALTER TABLE organizers ADD COLUMN contact_phone text;
  END IF;

  -- Add status field if not exists (for managing organizer accounts)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organizers' AND column_name = 'status'
  ) THEN
    ALTER TABLE organizers ADD COLUMN status text DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'inactive'));
  END IF;
END $$;

-- Create indexes for legacy fields
CREATE INDEX IF NOT EXISTS idx_organizers_legacy_id ON organizers(legacy_id) WHERE legacy_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_organizers_imported ON organizers(imported_at) WHERE imported_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_organizers_status ON organizers(status) WHERE status = 'active';

-- Add comment for documentation
COMMENT ON COLUMN organizers.legacy_id IS 'ID from previous timepulse.fr system for migration tracking';
COMMENT ON COLUMN organizers.legacy_data IS 'Additional data from legacy system that does not fit current schema';
COMMENT ON COLUMN organizers.imported_at IS 'Timestamp when this organizer was imported from legacy system';
COMMENT ON COLUMN organizers.import_notes IS 'Notes about the import process or data transformations';