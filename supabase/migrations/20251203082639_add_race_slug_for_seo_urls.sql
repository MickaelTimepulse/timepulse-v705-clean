/*
  # Ajout de slugs SEO pour les URLs des courses

  1. Modifications
    - Ajout colonne `slug` dans la table `races`
    - Génération automatique des slugs existants
    - Index unique sur slug pour éviter les doublons
    - Trigger pour générer automatiquement le slug

  2. Format des slugs
    - Format: nom-course-annee (ex: "10km-de-paris-2025")
    - Minuscules, sans accents, tirets au lieu d'espaces
    - Année extraite de la start_date de l'événement
*/

-- Ajouter la colonne slug
ALTER TABLE races ADD COLUMN IF NOT EXISTS slug text;

-- Index unique sur slug
CREATE UNIQUE INDEX IF NOT EXISTS idx_races_slug ON races(slug) WHERE slug IS NOT NULL;

-- Fonction pour générer un slug à partir d'un texte
CREATE OR REPLACE FUNCTION generate_slug(text text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  slug text;
BEGIN
  -- Convertir en minuscules, supprimer les accents, remplacer les espaces par des tirets
  slug := lower(unaccent(text));
  slug := regexp_replace(slug, '[^a-z0-9\s-]', '', 'g');
  slug := trim(slug);
  slug := regexp_replace(slug, '\s+', '-', 'g');
  slug := regexp_replace(slug, '-+', '-', 'g');
  slug := regexp_replace(slug, '^-|-$', '', 'g');

  RETURN slug;
END;
$$;

-- Fonction pour générer le slug d'une course avec l'année
CREATE OR REPLACE FUNCTION generate_race_slug()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  event_date date;
  event_year text;
  base_slug text;
  final_slug text;
  counter integer := 0;
BEGIN
  -- Récupérer la date de l'événement
  SELECT e.start_date INTO event_date
  FROM events e
  WHERE e.id = NEW.event_id;

  -- Si pas de date, utiliser l'année courante
  IF event_date IS NULL THEN
    event_year := EXTRACT(YEAR FROM CURRENT_DATE)::text;
  ELSE
    event_year := EXTRACT(YEAR FROM event_date)::text;
  END IF;

  -- Générer le slug de base
  base_slug := generate_slug(NEW.name);
  final_slug := base_slug || '-' || event_year;

  -- Gérer les doublons en ajoutant un suffixe numérique
  WHILE EXISTS (SELECT 1 FROM races WHERE slug = final_slug AND id != NEW.id) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || event_year || '-' || counter::text;
  END LOOP;

  NEW.slug := final_slug;

  RETURN NEW;
END;
$$;

-- Trigger pour générer automatiquement le slug lors de l'insertion
DROP TRIGGER IF EXISTS set_race_slug_insert ON races;
CREATE TRIGGER set_race_slug_insert
  BEFORE INSERT ON races
  FOR EACH ROW
  WHEN (NEW.slug IS NULL)
  EXECUTE FUNCTION generate_race_slug();

-- Trigger pour générer automatiquement le slug lors de la mise à jour
DROP TRIGGER IF EXISTS set_race_slug_update ON races;
CREATE TRIGGER set_race_slug_update
  BEFORE UPDATE OF name, event_id ON races
  FOR EACH ROW
  EXECUTE FUNCTION generate_race_slug();

-- Générer les slugs pour les courses existantes
UPDATE races r
SET slug = generate_slug(r.name) || '-' || COALESCE(EXTRACT(YEAR FROM e.start_date)::text, EXTRACT(YEAR FROM CURRENT_DATE)::text)
FROM events e
WHERE r.event_id = e.id
  AND r.slug IS NULL;

-- Gérer les doublons existants
DO $$
DECLARE
  race_record RECORD;
  counter integer;
  new_slug text;
  base_slug text;
BEGIN
  FOR race_record IN
    SELECT r.id, r.slug
    FROM races r
    WHERE r.slug IN (
      SELECT slug
      FROM races
      WHERE slug IS NOT NULL
      GROUP BY slug
      HAVING COUNT(*) > 1
    )
    ORDER BY r.created_at
  LOOP
    -- Extraire le slug de base sans le suffixe numérique s'il existe
    base_slug := race_record.slug;
    counter := 1;
    new_slug := base_slug || '-' || counter::text;

    -- Trouver un slug unique
    WHILE EXISTS (SELECT 1 FROM races WHERE slug = new_slug) LOOP
      counter := counter + 1;
      new_slug := base_slug || '-' || counter::text;
    END LOOP;

    -- Mettre à jour avec le nouveau slug unique
    UPDATE races SET slug = new_slug WHERE id = race_record.id;
  END LOOP;
END $$;

-- Fonction pour obtenir une course par slug ou UUID
CREATE OR REPLACE FUNCTION get_race_by_slug_or_id(identifier text)
RETURNS TABLE (
  id uuid,
  name text,
  event_id uuid,
  slug text,
  distance numeric,
  price numeric,
  registration_opens_at timestamptz,
  registration_closes_at timestamptz,
  quota integer,
  registered_count integer,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Si c'est un UUID
  IF identifier ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    RETURN QUERY
    SELECT
      r.id,
      r.name,
      r.event_id,
      r.slug,
      r.distance,
      r.price,
      r.registration_opens_at,
      r.registration_closes_at,
      r.quota,
      r.registered_count,
      r.created_at
    FROM races r
    WHERE r.id = identifier::uuid;
  ELSE
    -- Sinon c'est un slug
    RETURN QUERY
    SELECT
      r.id,
      r.name,
      r.event_id,
      r.slug,
      r.distance,
      r.price,
      r.registration_opens_at,
      r.registration_closes_at,
      r.quota,
      r.registered_count,
      r.created_at
    FROM races r
    WHERE r.slug = identifier;
  END IF;
END;
$$;

COMMENT ON FUNCTION get_race_by_slug_or_id IS 'Récupère une course par son slug SEO ou son UUID, pour la rétrocompatibilité';
COMMENT ON COLUMN races.slug IS 'Slug SEO-friendly pour les URLs (ex: 10km-de-paris-2025)';
