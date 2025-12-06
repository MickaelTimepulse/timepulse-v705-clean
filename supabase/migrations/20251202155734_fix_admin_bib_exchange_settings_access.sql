/*
  # Add admin access to bib exchange settings

  1. Changes
    - Fix is_admin() function to use user_id instead of id
    - Add policy for admins to manage bib_exchange_settings

  2. Security
    - Only users with role in ('super_admin', 'timepulse_staff', 'staff') can manage settings
    - Uses user_id to match auth.uid()
*/

-- Fix is_admin() to use user_id
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
BEGIN
  -- Vérifier dans profiles (ancien système)
  IF EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  ) THEN
    RETURN true;
  END IF;

  -- Vérifier dans admin_users (nouveau système) - USE user_id!
  IF EXISTS (
    SELECT 1 FROM admin_users
    WHERE user_id = auth.uid()
    AND is_active = true
    AND role IN ('super_admin', 'timepulse_staff', 'staff')
  ) THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Add admin policy for bib_exchange_settings
CREATE POLICY "Admins can manage all bib exchange settings"
  ON bib_exchange_settings FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());
