/*
  # Fix athlete_profiles trigger RLS policy

  1. Changes
    - Modifier la fonction trigger pour utiliser SECURITY DEFINER
    - Ajouter une politique permettant les insertions automatiques

  2. Security
    - La fonction trigger s'exécute avec les droits du créateur (postgres)
    - Permet les inscriptions publiques sans erreur RLS
*/

-- Recréer la fonction avec SECURITY DEFINER pour bypasser RLS
CREATE OR REPLACE FUNCTION create_athlete_profile_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER -- Important: exécute avec les droits du propriétaire
SET search_path = public
AS $$
BEGIN
  INSERT INTO athlete_profiles (athlete_id)
  VALUES (NEW.id)
  ON CONFLICT (athlete_id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Activer RLS si pas déjà fait
ALTER TABLE athlete_profiles ENABLE ROW LEVEL SECURITY;

-- Ajouter une politique pour permettre les insertions via trigger
DROP POLICY IF EXISTS "Allow trigger insertions for athlete profiles" ON athlete_profiles;
CREATE POLICY "Allow trigger insertions for athlete profiles"
  ON athlete_profiles FOR INSERT
  WITH CHECK (true);
