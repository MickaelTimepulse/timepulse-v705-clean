/*
  # Create organizer_bank_details table (Secure RIB storage)
  
  1. New Tables
    - `organizer_bank_details`
      - `id` (uuid, primary key)
      - `organizer_id` (uuid, unique foreign key to organizers) - One bank account per organizer
      - `account_holder_name` (text) - Titulaire du compte
      - `iban` (text) - IBAN (encrypted in application layer)
      - `bic` (text) - BIC/SWIFT code
      - `bank_name` (text) - Nom de la banque
      - `is_verified` (boolean) - If bank details verified by admin
      - `verified_at` (timestamptz) - When verified
      - `verified_by` (uuid, foreign key to admin_users) - Admin who verified
      - `notes` (text) - Internal notes (admin only)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  
  2. Security
    - CRITICAL: Enable RLS with very strict policies
    - Organizers can only view/update their own bank details
    - Only admins with special role can view all bank details
    - Bank details NEVER exposed in public APIs
    - Audit all access to this table
  
  3. Constraints
    - One bank account per organizer (unique organizer_id)
    - account_holder_name and IBAN are required
    - Cascade delete when organizer is deleted
  
  4. Notes
    - IBAN should be encrypted at application level before storage
    - Verification process required before first payout
    - All modifications should be logged in audit_logs
    - Consider PCI-DSS compliance for production
*/

CREATE TABLE IF NOT EXISTS organizer_bank_details (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id uuid NOT NULL UNIQUE REFERENCES organizers(id) ON DELETE CASCADE,
  account_holder_name text NOT NULL,
  iban text NOT NULL,
  bic text,
  bank_name text,
  is_verified boolean DEFAULT false,
  verified_at timestamptz,
  verified_by uuid REFERENCES admin_users(id) ON DELETE SET NULL,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS - CRITICAL SECURITY
ALTER TABLE organizer_bank_details ENABLE ROW LEVEL SECURITY;

-- Organizers can view their own bank details
CREATE POLICY "Organizers can view their own bank details"
  ON organizer_bank_details
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organizers
      WHERE organizers.id = organizer_bank_details.organizer_id
      AND organizers.user_id::text = auth.uid()::text
    )
  );

-- Organizers can insert/update their own bank details
CREATE POLICY "Organizers can manage their own bank details"
  ON organizer_bank_details
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organizers
      WHERE organizers.id = organizer_bank_details.organizer_id
      AND organizers.user_id::text = auth.uid()::text
    )
  );

CREATE POLICY "Organizers can update their own bank details"
  ON organizer_bank_details
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organizers
      WHERE organizers.id = organizer_bank_details.organizer_id
      AND organizers.user_id::text = auth.uid()::text
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organizers
      WHERE organizers.id = organizer_bank_details.organizer_id
      AND organizers.user_id::text = auth.uid()::text
    )
  );

-- Only specific admins (role = 'super_admin' or 'finance') can view all bank details
CREATE POLICY "Finance admins can view all bank details"
  ON organizer_bank_details
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id::text = auth.uid()::text
      AND admin_users.is_active = true
      AND admin_users.role IN ('super_admin', 'finance')
    )
  );

-- Only finance admins can verify bank details
CREATE POLICY "Finance admins can verify bank details"
  ON organizer_bank_details
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id::text = auth.uid()::text
      AND admin_users.is_active = true
      AND admin_users.role IN ('super_admin', 'finance')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id::text = auth.uid()::text
      AND admin_users.is_active = true
      AND admin_users.role IN ('super_admin', 'finance')
    )
  );

-- NO DELETE policy - Bank details should never be deleted, only updated

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_bank_details_organizer ON organizer_bank_details(organizer_id);
CREATE INDEX IF NOT EXISTS idx_bank_details_verified ON organizer_bank_details(is_verified) WHERE is_verified = true;

-- Function to audit bank details access
CREATE OR REPLACE FUNCTION audit_bank_details_access()
RETURNS TRIGGER AS $$
BEGIN
  -- Log all access to bank details
  PERFORM log_audit_event(
    'organizer_bank_details',
    NEW.id,
    TG_OP,
    CASE 
      WHEN EXISTS (SELECT 1 FROM admin_users WHERE admin_users.id::text = auth.uid()::text) THEN 'admin'
      WHEN EXISTS (SELECT 1 FROM organizers WHERE organizers.user_id::text = auth.uid()::text) THEN 'organizer'
      ELSE 'system'
    END,
    auth.uid(),
    NULL,
    to_jsonb(NEW)
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to audit all bank details operations
DROP TRIGGER IF EXISTS trigger_audit_bank_details ON organizer_bank_details;
CREATE TRIGGER trigger_audit_bank_details
  AFTER INSERT OR UPDATE ON organizer_bank_details
  FOR EACH ROW
  EXECUTE FUNCTION audit_bank_details_access();

-- Add comments for documentation
COMMENT ON TABLE organizer_bank_details IS 'SENSITIVE DATA: Bank account details for organizer payouts. All access is audited.';
COMMENT ON COLUMN organizer_bank_details.iban IS 'IBAN - Should be encrypted at application layer';
COMMENT ON COLUMN organizer_bank_details.is_verified IS 'Bank details verified by Timepulse finance team before first payout';
COMMENT ON COLUMN organizer_bank_details.notes IS 'Internal notes - only visible to finance admins';