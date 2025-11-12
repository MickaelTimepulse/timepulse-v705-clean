/*
  # Fix admin_create_user function
  
  1. Actions
    - Recrée la fonction admin_create_user avec le bon search_path
    - Ajoute des permissions appropriées
    - Gère les erreurs potentielles
*/

-- Supprimer la fonction existante
DROP FUNCTION IF EXISTS admin_create_user(text, text, text, uuid);

-- Recréer avec le bon search_path et la gestion d'erreurs
CREATE OR REPLACE FUNCTION admin_create_user(
  p_email text,
  p_name text,
  p_password text,
  p_role_id uuid DEFAULT NULL
)
RETURNS uuid 
SECURITY DEFINER
SET search_path = public, extensions
LANGUAGE plpgsql
AS $$
DECLARE
  v_user_id uuid;
  v_hashed_password text;
BEGIN
  -- Vérifier que l'email n'existe pas déjà
  IF EXISTS (SELECT 1 FROM admin_users WHERE email = p_email) THEN
    RAISE EXCEPTION 'Un utilisateur avec cet email existe déjà';
  END IF;

  -- Hash du mot de passe avec pgcrypto
  v_hashed_password := crypt(p_password, gen_salt('bf'));

  -- Insertion du nouvel utilisateur
  INSERT INTO admin_users (
    email,
    name,
    hashed_password,
    role_id,
    role,
    is_active,
    created_at,
    updated_at
  )
  VALUES (
    lower(trim(p_email)),
    trim(p_name),
    v_hashed_password,
    p_role_id,
    COALESCE((SELECT name FROM admin_roles WHERE id = p_role_id), 'user'),
    true,
    now(),
    now()
  )
  RETURNING id INTO v_user_id;

  -- Log de création
  INSERT INTO admin_activity_logs (
    user_id,
    action,
    module,
    entity_type,
    entity_id,
    details
  )
  VALUES (
    v_user_id,
    'create_user',
    'admin_users',
    'admin_user',
    v_user_id,
    jsonb_build_object(
      'email', p_email,
      'name', p_name
    )
  );

  RETURN v_user_id;
EXCEPTION
  WHEN unique_violation THEN
    RAISE EXCEPTION 'Un utilisateur avec cet email existe déjà';
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Erreur lors de la création de l''utilisateur: %', SQLERRM;
END;
$$;

-- Permissions
GRANT EXECUTE ON FUNCTION admin_create_user(text, text, text, uuid) TO authenticated;

-- Commentaire
COMMENT ON FUNCTION admin_create_user IS 'Crée un nouvel utilisateur admin avec mot de passe hashé';
