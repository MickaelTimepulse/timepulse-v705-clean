/*
  # Corriger la fonction is_admin()

  1. Problème
    - La fonction référence la colonne is_super_admin qui n'existe pas
    - Utilise le champ role à la place

  2. Solution
    - Vérifier si role = 'super_admin' dans admin_users
    - Ou si role = 'admin' dans profiles
*/

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

  -- Vérifier dans admin_users (nouveau système)
  IF EXISTS (
    SELECT 1 FROM admin_users
    WHERE id = auth.uid()
    AND is_active = true
    AND role IN ('super_admin', 'timepulse_staff')
  ) THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;
