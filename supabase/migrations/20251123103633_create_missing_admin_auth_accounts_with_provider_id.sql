/*
  # Création des comptes auth manquants pour les admins

  Crée les comptes auth pour laurine, morgane et timepulseteam
  Mot de passe : TimePulse2025!
*/

-- Créer le compte pour laurine@timepulse.fr
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  aud,
  role
)
VALUES (
  'cb0f6186-4963-4692-838a-123fbe2565b5',
  '00000000-0000-0000-0000-000000000000',
  'laurine@timepulse.fr',
  crypt('TimePulse2025!', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"name":"Laurine"}',
  'authenticated',
  'authenticated'
)
ON CONFLICT (id) DO NOTHING;

-- Créer le compte pour morgane@timepulse.fr
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  aud,
  role
)
VALUES (
  '869e54d3-9b82-47a9-b18b-b3b7a11bc37c',
  '00000000-0000-0000-0000-000000000000',
  'morgane@timepulse.fr',
  crypt('TimePulse2025!', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"name":"Morgane"}',
  'authenticated',
  'authenticated'
)
ON CONFLICT (id) DO NOTHING;

-- Créer le compte pour timepulseteam@timepulse.fr
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  aud,
  role
)
VALUES (
  '77dc6420-fab7-4722-a527-50857a64b495',
  '00000000-0000-0000-0000-000000000000',
  'timepulseteam@timepulse.fr',
  crypt('TimePulse2025!', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"name":"TimePulse Team"}',
  'authenticated',
  'authenticated'
)
ON CONFLICT (id) DO NOTHING;

-- Créer les identités avec provider_id
INSERT INTO auth.identities (
  provider_id,
  user_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
)
SELECT 
  'cb0f6186-4963-4692-838a-123fbe2565b5',
  'cb0f6186-4963-4692-838a-123fbe2565b5',
  '{"sub":"cb0f6186-4963-4692-838a-123fbe2565b5","email":"laurine@timepulse.fr"}',
  'email',
  now(),
  now(),
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM auth.identities 
  WHERE provider = 'email' AND provider_id = 'cb0f6186-4963-4692-838a-123fbe2565b5'
);

INSERT INTO auth.identities (
  provider_id,
  user_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
)
SELECT 
  '869e54d3-9b82-47a9-b18b-b3b7a11bc37c',
  '869e54d3-9b82-47a9-b18b-b3b7a11bc37c',
  '{"sub":"869e54d3-9b82-47a9-b18b-b3b7a11bc37c","email":"morgane@timepulse.fr"}',
  'email',
  now(),
  now(),
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM auth.identities 
  WHERE provider = 'email' AND provider_id = '869e54d3-9b82-47a9-b18b-b3b7a11bc37c'
);

INSERT INTO auth.identities (
  provider_id,
  user_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
)
SELECT 
  '77dc6420-fab7-4722-a527-50857a64b495',
  '77dc6420-fab7-4722-a527-50857a64b495',
  '{"sub":"77dc6420-fab7-4722-a527-50857a64b495","email":"timepulseteam@timepulse.fr"}',
  'email',
  now(),
  now(),
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM auth.identities 
  WHERE provider = 'email' AND provider_id = '77dc6420-fab7-4722-a527-50857a64b495'
);
