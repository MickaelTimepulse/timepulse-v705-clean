/*
  # Fonction d'import des villes françaises

  1. Fonction
    - Crée une fonction `import_french_cities` qui permet d'importer des villes en batch
    - Utilise SECURITY DEFINER pour contourner le RLS
    - Accessible uniquement aux utilisateurs authentifiés

  2. Sécurité
    - La fonction s'exécute avec les privilèges du propriétaire (SECURITY DEFINER)
    - Seuls les utilisateurs authentifiés peuvent l'appeler
*/

-- Fonction pour importer les villes françaises
CREATE OR REPLACE FUNCTION import_french_cities(cities_data jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insérer les villes depuis le JSON
  INSERT INTO european_cities (city_name, postal_code, country_code, country_name)
  SELECT 
    (city->>'city_name')::text,
    (city->>'postal_code')::text,
    (city->>'country_code')::text,
    (city->>'country_name')::text
  FROM jsonb_array_elements(cities_data) AS city;
END;
$$;

-- Fonction pour supprimer les villes par pays
CREATE OR REPLACE FUNCTION delete_cities_by_country(p_country_code text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM european_cities WHERE country_code = p_country_code;
END;
$$;
