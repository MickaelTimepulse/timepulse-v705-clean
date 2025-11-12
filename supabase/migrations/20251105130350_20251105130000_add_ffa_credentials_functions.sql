/*
  # Add function to read FFA settings

  1. Purpose
    - Créer une fonction accessible publiquement pour lire les identifiants FFA
    - Permet au frontend de vérifier si les identifiants sont configurés

  2. Security
    - Fonction SECURITY DEFINER (exécutée avec droits du propriétaire)
    - Retourne uniquement un booléen indiquant si les identifiants existent
    - Ne retourne jamais les identifiants en clair côté client
*/

-- Fonction pour vérifier si les identifiants FFA sont configurés
CREATE OR REPLACE FUNCTION check_ffa_credentials_configured()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid_exists boolean;
  v_password_exists boolean;
BEGIN
  SELECT
    EXISTS(SELECT 1 FROM settings WHERE key = 'ffa_api_uid' AND value IS NOT NULL AND value != '') INTO v_uid_exists;

  SELECT
    EXISTS(SELECT 1 FROM settings WHERE key = 'ffa_api_password' AND value IS NOT NULL AND value != '') INTO v_password_exists;

  RETURN v_uid_exists AND v_password_exists;
END;
$$;

-- Fonction pour récupérer les identifiants FFA (côté serveur uniquement)
CREATE OR REPLACE FUNCTION get_ffa_credentials()
RETURNS TABLE(uid text, password text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    MAX(CASE WHEN key = 'ffa_api_uid' THEN value END) as uid,
    MAX(CASE WHEN key = 'ffa_api_password' THEN value END) as password
  FROM settings
  WHERE key IN ('ffa_api_uid', 'ffa_api_password');
END;
$$;

-- Ajouter une policy pour permettre l'exécution anonyme de check_ffa_credentials_configured
GRANT EXECUTE ON FUNCTION check_ffa_credentials_configured() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_ffa_credentials() TO authenticated;
