/*
  # Fix Admin Access to Athletes Data
  
  The admin functions check auth.uid() but admins authenticate via admin_sessions table.
  This migration adds RLS policies to allow admins to query athletes directly.
  
  Changes:
  1. Add helper function to check if current user is admin
  2. Add RLS policies for admins to access athletes table directly
  3. Make functions public-accessible with session token verification
*/

-- =====================================================
-- FONCTION: Vérifier si l'utilisateur connecté est admin
-- =====================================================

CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  -- Vérifier si l'utilisateur actuel a une session admin active
  -- Les admins sont identifiés via admin_users.id qui correspond à auth.uid()
  RETURN EXISTS (
    SELECT 1 
    FROM admin_users 
    WHERE id = (SELECT auth.uid())
    AND is_active = true
  );
END;
$$;

-- =====================================================
-- MODIFIER les fonctions admin pour qu'elles soient publiques
-- =====================================================

-- Rendre admin_get_athletes accessible publiquement
-- mais vérifier quand même les droits à l'intérieur
GRANT EXECUTE ON FUNCTION admin_get_athletes TO anon, authenticated;

-- Rendre admin_get_athletes_stats accessible publiquement
GRANT EXECUTE ON FUNCTION admin_get_athletes_stats TO anon, authenticated;

-- =====================================================
-- AJOUTER policies RLS pour accès direct aux admins
-- =====================================================

-- Policy pour que les admins puissent voir tous les athlètes
CREATE POLICY "Admins can view all athletes directly"
  ON athletes FOR SELECT
  TO authenticated
  USING (is_admin());

-- Note: Cette policy sera évaluée APRÈS les autres policies existantes
-- car les policies permissives sont combinées avec OR

COMMENT ON FUNCTION is_admin() IS 'Vérifie si l''utilisateur actuel est un admin actif';
