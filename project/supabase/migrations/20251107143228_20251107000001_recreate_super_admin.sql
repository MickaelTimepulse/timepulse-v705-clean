/*
  # Recréation du compte super admin
  
  1. Actions
    - Suppression de l'ancien compte admin si existant
    - Création du nouveau compte super admin
    - Email : admintimepulse@timepulse.fr
    - Mot de passe : Timepulse2025@!
    
  2. Sécurité
    - Mot de passe hashé avec bcrypt
    - Rôle super_admin
    - Toutes les permissions activées
*/

-- Supprimer les anciens comptes admin si ils existent
DELETE FROM admin_users WHERE email IN ('admin@timepulse.fr', 'admintimepulse@timepulse.fr');

-- Créer le nouveau compte super admin
INSERT INTO admin_users (
  id,
  email,
  hashed_password,
  name,
  role,
  is_active,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'admintimepulse@timepulse.fr',
  '$2b$10$j7w/5Jd2OqBhynAejOwUcOcnVIVrxIfvCibXzFZwGSAqgPB/uGwiS',
  'Super Admin Timepulse',
  'super_admin',
  true,
  now(),
  now()
)
ON CONFLICT (email) DO UPDATE SET
  hashed_password = EXCLUDED.hashed_password,
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  is_active = EXCLUDED.is_active,
  updated_at = now();

-- Log de confirmation
DO $$
DECLARE
  admin_record RECORD;
BEGIN
  SELECT id, email, name, role, is_active INTO admin_record 
  FROM admin_users 
  WHERE email = 'admintimepulse@timepulse.fr';
  
  IF admin_record.id IS NULL THEN
    RAISE EXCEPTION 'Échec de la création du compte super admin';
  ELSE
    RAISE NOTICE 'Compte super admin créé avec succès';
    RAISE NOTICE 'Email: %', admin_record.email;
    RAISE NOTICE 'Nom: %', admin_record.name;
    RAISE NOTICE 'Rôle: %', admin_record.role;
    RAISE NOTICE 'Actif: %', admin_record.is_active;
  END IF;
END $$;
