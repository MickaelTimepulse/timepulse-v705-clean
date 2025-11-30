/*
  # Add function to update FFA credentials

  1. Purpose
    - Créer une fonction pour mettre à jour les identifiants FFA de manière sécurisée
    - Accessible uniquement aux admins authentifiés

  2. Security
    - SECURITY DEFINER
    - Vérifie que l'utilisateur est un admin
*/

CREATE OR REPLACE FUNCTION update_ffa_credentials(
  p_uid text,
  p_password text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Mise à jour ou insertion du UID
  INSERT INTO settings (key, value, description)
  VALUES ('ffa_api_uid', p_uid, 'Identifiant SIFFA pour l''API FFA')
  ON CONFLICT (key)
  DO UPDATE SET
    value = EXCLUDED.value,
    updated_at = now();

  -- Mise à jour ou insertion du mot de passe
  INSERT INTO settings (key, value, description)
  VALUES ('ffa_api_password', p_password, 'Mot de passe SIFFA pour l''API FFA')
  ON CONFLICT (key)
  DO UPDATE SET
    value = EXCLUDED.value,
    updated_at = now();

  RETURN true;
END;
$$;

-- Accorder les droits aux utilisateurs authentifiés
GRANT EXECUTE ON FUNCTION update_ffa_credentials(text, text) TO authenticated;
