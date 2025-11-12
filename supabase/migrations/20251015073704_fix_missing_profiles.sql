/*
  # Correction des profils manquants

  1. Objectif
    - Créer les profils manquants pour tous les comptes auth.users existants
    - Garantir l'intégrité des données
    
  2. Actions
    - Insertion de profils pour tous les users sans profil
    - Utilise ON CONFLICT pour éviter les doublons
    
  3. Note
    - Cette migration est idempotente (peut être exécutée plusieurs fois)
    - Le trigger créé précédemment gère les futurs comptes
*/

-- Créer les profils manquants pour tous les comptes auth existants
INSERT INTO public.profiles (id, email, created_at, updated_at)
SELECT 
  au.id,
  au.email,
  au.created_at,
  NOW()
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Log le nombre de profils créés
DO $$
DECLARE
  orphan_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO orphan_count
  FROM auth.users au
  LEFT JOIN public.profiles p ON au.id = p.id
  WHERE p.id IS NULL;
  
  RAISE NOTICE 'Profils orphelins restants: %', orphan_count;
END $$;