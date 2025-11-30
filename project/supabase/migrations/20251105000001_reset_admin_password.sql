/*
  # Reset Admin Password

  1. Purpose
    - Réinitialise le mot de passe de l'administrateur mickael@timepulse.fr
    - Mot de passe: Timepulse2025@!

  2. Security
    - Utilise crypt() pour hasher le mot de passe
    - Active le compte si nécessaire
*/

-- Vérifier si l'utilisateur existe, sinon le créer
INSERT INTO admin_users (
  email,
  name,
  role,
  hashed_password,
  is_active
) VALUES (
  'mickael@timepulse.fr',
  'Mickael (Super Admin)',
  'super_admin',
  crypt('Timepulse2025@!', gen_salt('bf')),
  true
)
ON CONFLICT (email)
DO UPDATE SET
  hashed_password = crypt('Timepulse2025@!', gen_salt('bf')),
  is_active = true,
  updated_at = now();

-- Vérification: afficher l'utilisateur
DO $$
DECLARE
  v_user_exists boolean;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM admin_users WHERE email = 'mickael@timepulse.fr'
  ) INTO v_user_exists;

  IF v_user_exists THEN
    RAISE NOTICE 'Admin user mickael@timepulse.fr successfully configured';
  ELSE
    RAISE EXCEPTION 'Failed to create/update admin user';
  END IF;
END $$;
