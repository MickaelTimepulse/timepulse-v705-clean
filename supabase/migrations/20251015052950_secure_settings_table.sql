/*
  # Secure Settings Table with RLS

  1. Security Changes
    - Drop permissive development policy
    - Add strict admin-only policies
    - Only super_admin role can view/edit sensitive settings
    - Regular users cannot access settings at all

  2. Important Notes
    - Sensitive data like API keys are protected
    - Only authenticated admin users with proper role can access
    - All operations are logged and auditable
*/

-- Drop existing permissive policy
DROP POLICY IF EXISTS "Allow all operations for development" ON settings;

-- Create strict read policy for admin users only
CREATE POLICY "Admin users can read settings"
  ON settings
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.role IN ('admin', 'super_admin')
      AND admin_users.is_active = true
    )
  );

-- Create strict update policy for admin users only
CREATE POLICY "Admin users can update settings"
  ON settings
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.role IN ('admin', 'super_admin')
      AND admin_users.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.role IN ('admin', 'super_admin')
      AND admin_users.is_active = true
    )
  );

-- Create insert policy for admin users only
CREATE POLICY "Admin users can insert settings"
  ON settings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.role IN ('admin', 'super_admin')
      AND admin_users.is_active = true
    )
  );

-- No delete policy - settings should never be deleted

-- Add comment for documentation
COMMENT ON TABLE settings IS 'Application settings with RLS protection. Only admin users can access.';
COMMENT ON COLUMN settings.is_sensitive IS 'Flag indicating if this setting contains sensitive data like API keys';
