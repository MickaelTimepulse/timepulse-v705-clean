/*
  # Corriger l'accès admin aux entries pour l'import CSV

  1. Problème
    - Les admins utilisent Supabase Auth avec des emails internes (admin-{uuid}@timepulse.internal)
    - La fonction is_admin() ne détecte pas correctement ces utilisateurs
    - L'import CSV échoue avec 403 Forbidden

  2. Solution
    - Améliorer is_admin() pour vérifier les métadonnées Supabase Auth
    - Vérifier si l'email contient @timepulse.internal
    - Ou si admin_role est défini dans user_metadata
*/

-- Recréer la fonction is_admin() pour supporter Supabase Auth
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
DECLARE
  v_email text;
  v_admin_id uuid;
BEGIN
  -- Récupérer l'email de l'utilisateur Supabase Auth
  SELECT email INTO v_email
  FROM auth.users
  WHERE id = auth.uid();

  -- Vérifier si c'est un utilisateur admin interne
  IF v_email LIKE '%@timepulse.internal' THEN
    RETURN true;
  END IF;

  -- Vérifier dans les métadonnées Supabase Auth
  SELECT (raw_user_meta_data->>'admin_id')::uuid INTO v_admin_id
  FROM auth.users
  WHERE id = auth.uid();

  IF v_admin_id IS NOT NULL THEN
    -- Vérifier que l'admin existe et est actif
    IF EXISTS (
      SELECT 1 FROM admin_users
      WHERE id = v_admin_id
      AND is_active = true
    ) THEN
      RETURN true;
    END IF;
  END IF;

  -- Vérifier dans profiles (ancien système)
  IF EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  ) THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Commentaire
COMMENT ON FUNCTION is_admin() IS
  'Vérifie si l''utilisateur actuel est un admin via Supabase Auth ou profiles';
