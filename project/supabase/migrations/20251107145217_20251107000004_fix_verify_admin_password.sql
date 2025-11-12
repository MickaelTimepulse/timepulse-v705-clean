/*
  # Correction de la fonction verify_admin_password
  
  1. Actions
    - Recréer la fonction avec le bon schéma pour pgcrypto
    - S'assurer que crypt est accessible
*/

-- Recréer la fonction verify_admin_password avec search_path
CREATE OR REPLACE FUNCTION verify_admin_password(
  p_email text,
  p_password text
)
RETURNS TABLE(
  user_id uuid,
  user_email text,
  user_name text,
  user_role text,
  org_id uuid
) 
SECURITY DEFINER
SET search_path = public, extensions
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    au.id,
    au.email,
    au.name,
    au.role,
    au.org_id
  FROM admin_users au
  WHERE au.email = p_email
    AND au.hashed_password = extensions.crypt(p_password, au.hashed_password)
    AND au.is_active = true;
END;
$$;

-- Recréer la fonction update_last_login
CREATE OR REPLACE FUNCTION update_last_login(p_user_id uuid)
RETURNS void 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE admin_users
  SET last_login_at = now(),
      updated_at = now()
  WHERE id = p_user_id;
END;
$$;
