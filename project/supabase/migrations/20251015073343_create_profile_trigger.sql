/*
  # Création automatique des profils

  1. Fonction trigger
    - Crée automatiquement un profil dans `profiles` quand un user est créé dans `auth.users`
    - Extrait l'email depuis les métadonnées
    
  2. Trigger
    - S'exécute après insertion dans `auth.users`
    - Garantit qu'il y a toujours un profil pour chaque user
*/

-- Fonction pour créer automatiquement le profil
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, created_at)
  VALUES (NEW.id, NEW.email, NOW())
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger sur auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();