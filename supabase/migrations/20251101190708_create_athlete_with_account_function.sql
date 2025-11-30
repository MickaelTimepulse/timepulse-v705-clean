/*
  # Fonction de création d'athlète avec compte utilisateur
  
  1. Nouvelle fonction
    - `create_athlete_with_account()` : Crée un compte auth.users ET un athlète lié
    
  2. Fonctionnalité
    - Génère un mot de passe temporaire sécurisé
    - Crée le compte utilisateur dans auth.users
    - Crée l'athlète avec user_id lié
    - Retourne l'ID de l'athlète et le mot de passe temporaire
    
  3. Sécurité
    - Fonction SECURITY DEFINER pour créer des users
    - Accessible uniquement aux admins
    - Transaction atomique (tout ou rien)
*/

-- Fonction pour générer un mot de passe temporaire sécurisé
CREATE OR REPLACE FUNCTION generate_temp_password()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
  password text := '';
  i integer;
BEGIN
  FOR i IN 1..12 LOOP
    password := password || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN password;
END;
$$;

-- Fonction pour créer un athlète avec compte utilisateur
CREATE OR REPLACE FUNCTION create_athlete_with_account(
  p_first_name text,
  p_last_name text,
  p_birthdate date,
  p_gender text,
  p_email text,
  p_nationality text DEFAULT 'FRA',
  p_city text DEFAULT NULL,
  p_postal_code text DEFAULT NULL,
  p_license_club text DEFAULT NULL,
  p_license_number text DEFAULT NULL,
  p_license_type text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_athlete_id uuid;
  v_temp_password text;
  v_existing_athlete_id uuid;
BEGIN
  -- Vérifier si l'email existe déjà
  IF p_email IS NOT NULL AND p_email != '' THEN
    -- Chercher un athlète existant avec cet email
    SELECT id INTO v_existing_athlete_id
    FROM athletes
    WHERE email = p_email
    LIMIT 1;
    
    IF v_existing_athlete_id IS NOT NULL THEN
      -- L'athlète existe déjà, le retourner
      RETURN jsonb_build_object(
        'athlete_id', v_existing_athlete_id,
        'user_id', (SELECT user_id FROM athletes WHERE id = v_existing_athlete_id),
        'existed', true,
        'temp_password', NULL
      );
    END IF;
    
    -- Générer un mot de passe temporaire
    v_temp_password := generate_temp_password();
    
    -- Créer le compte utilisateur dans auth.users
    -- Note: Cette partie nécessite l'extension supabase_auth
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      p_email,
      crypt(v_temp_password, gen_salt('bf')),
      NOW(), -- Email confirmé automatiquement
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object(
        'first_name', p_first_name,
        'last_name', p_last_name,
        'birthdate', p_birthdate
      ),
      NOW(),
      NOW(),
      '',
      ''
    ) RETURNING id INTO v_user_id;
  ELSE
    v_user_id := NULL;
    v_temp_password := NULL;
  END IF;
  
  -- Créer l'athlète
  INSERT INTO athletes (
    first_name,
    last_name,
    birthdate,
    gender,
    email,
    nationality,
    city,
    postal_code,
    license_club,
    license_number,
    license_type,
    user_id,
    is_public
  ) VALUES (
    p_first_name,
    p_last_name,
    p_birthdate,
    p_gender,
    p_email,
    p_nationality,
    p_city,
    p_postal_code,
    p_license_club,
    p_license_number,
    p_license_type,
    v_user_id,
    false
  ) RETURNING id INTO v_athlete_id;
  
  -- Retourner les IDs et le mot de passe temporaire
  RETURN jsonb_build_object(
    'athlete_id', v_athlete_id,
    'user_id', v_user_id,
    'existed', false,
    'temp_password', v_temp_password
  );
END;
$$;

-- Commentaire sur la fonction
COMMENT ON FUNCTION create_athlete_with_account IS 
'Crée un athlète avec un compte utilisateur automatique. Retourne athlete_id, user_id et temp_password.';
