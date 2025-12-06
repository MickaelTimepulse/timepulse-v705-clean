/*
  # Fix Admin Manager Permissions
  
  Ce fichier corrige les permissions pour que les utilisateurs avec le rôle "Manager" 
  puissent modifier les organisateurs, événements, épreuves et athlètes.
  
  ## Problème identifié
  - Morgane et Laurine ont le rôle "Manager" mais ne peuvent pas modifier
  - Les policies RLS vérifient uniquement `is_admin()` qui ne tient pas compte du rôle
  - Il faut mettre à jour la fonction `is_admin()` pour qu'elle vérifie aussi le rôle
  
  ## Solution
  1. Modifier la fonction `is_admin()` pour qu'elle accepte les utilisateurs avec un rôle actif
  2. Les super admins gardent tous les accès
  3. Les managers peuvent modifier organizers, events, races, athletes
*/

-- 1. Recréer la fonction is_admin() pour qu'elle vérifie le role_id
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text;
  v_admin_id uuid;
  v_has_role boolean;
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
  
  -- NOUVEAU: Vérifier si l'utilisateur a un rôle admin actif via user_id
  SELECT EXISTS (
    SELECT 1 FROM admin_users au
    WHERE au.user_id = auth.uid()
      AND au.is_active = true
      AND au.role_id IS NOT NULL
  ) INTO v_has_role;
  
  IF v_has_role THEN
    RETURN true;
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
$$;
