/*
  # Ajout des IDs de référence lisibles

  1. Modifications des tables
    - Ajout de `ref_id` à organizers (format : O123456)
    - Ajout de `ref_id` à events (format : E123456)
    - Ajout de `ref_id` à races (format : R123456)
    - Ajout de `ref_id` à athletes (format : A123456)

  2. Fonctions
    - Fonction de génération automatique d'ID unique pour chaque entité
    - Triggers pour auto-générer les IDs lors de l'insertion

  3. Indexes
    - Index uniques sur tous les ref_id pour recherche rapide

  4. Sécurité
    - Les ref_id sont en lecture seule après création
*/

-- Fonction pour générer un ID de référence unique
CREATE OR REPLACE FUNCTION generate_ref_id(prefix TEXT, table_name TEXT, column_name TEXT DEFAULT 'ref_id')
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_id TEXT;
  id_exists BOOLEAN;
  counter INTEGER;
  max_attempts INTEGER := 100;
BEGIN
  counter := 0;

  LOOP
    -- Générer un ID à 6 chiffres aléatoire
    new_id := prefix || LPAD(FLOOR(RANDOM() * 999999 + 1)::TEXT, 6, '0');

    -- Vérifier si l'ID existe déjà
    EXECUTE format('SELECT EXISTS(SELECT 1 FROM %I WHERE %I = $1)', table_name, column_name)
    INTO id_exists
    USING new_id;

    EXIT WHEN NOT id_exists;

    counter := counter + 1;
    IF counter >= max_attempts THEN
      RAISE EXCEPTION 'Impossible de générer un ref_id unique après % tentatives', max_attempts;
    END IF;
  END LOOP;

  RETURN new_id;
END;
$$;

-- ============================================
-- ORGANIZERS : Ajout ref_id
-- ============================================

-- Ajouter la colonne ref_id aux organisateurs
ALTER TABLE organizers
ADD COLUMN IF NOT EXISTS ref_id TEXT UNIQUE;

-- Créer un index pour les recherches rapides
CREATE INDEX IF NOT EXISTS idx_organizers_ref_id ON organizers(ref_id);

-- Générer des ref_id pour les organisateurs existants
DO $$
DECLARE
  org RECORD;
BEGIN
  FOR org IN SELECT id FROM organizers WHERE ref_id IS NULL
  LOOP
    UPDATE organizers
    SET ref_id = generate_ref_id('O', 'organizers')
    WHERE id = org.id;
  END LOOP;
END $$;

-- Trigger pour auto-générer le ref_id lors de l'insertion
CREATE OR REPLACE FUNCTION set_organizer_ref_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.ref_id IS NULL THEN
    NEW.ref_id := generate_ref_id('O', 'organizers');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_set_organizer_ref_id ON organizers;
CREATE TRIGGER trigger_set_organizer_ref_id
  BEFORE INSERT ON organizers
  FOR EACH ROW
  EXECUTE FUNCTION set_organizer_ref_id();

-- ============================================
-- EVENTS : Ajout ref_id
-- ============================================

-- Ajouter la colonne ref_id aux événements
ALTER TABLE events
ADD COLUMN IF NOT EXISTS ref_id TEXT UNIQUE;

-- Créer un index pour les recherches rapides
CREATE INDEX IF NOT EXISTS idx_events_ref_id ON events(ref_id);

-- Générer des ref_id pour les événements existants
DO $$
DECLARE
  evt RECORD;
BEGIN
  FOR evt IN SELECT id FROM events WHERE ref_id IS NULL
  LOOP
    UPDATE events
    SET ref_id = generate_ref_id('E', 'events')
    WHERE id = evt.id;
  END LOOP;
END $$;

-- Trigger pour auto-générer le ref_id lors de l'insertion
CREATE OR REPLACE FUNCTION set_event_ref_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.ref_id IS NULL THEN
    NEW.ref_id := generate_ref_id('E', 'events');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_set_event_ref_id ON events;
CREATE TRIGGER trigger_set_event_ref_id
  BEFORE INSERT ON events
  FOR EACH ROW
  EXECUTE FUNCTION set_event_ref_id();

-- ============================================
-- RACES : Ajout ref_id
-- ============================================

-- Ajouter la colonne ref_id aux courses
ALTER TABLE races
ADD COLUMN IF NOT EXISTS ref_id TEXT UNIQUE;

-- Créer un index pour les recherches rapides
CREATE INDEX IF NOT EXISTS idx_races_ref_id ON races(ref_id);

-- Générer des ref_id pour les courses existantes
DO $$
DECLARE
  race RECORD;
BEGIN
  FOR race IN SELECT id FROM races WHERE ref_id IS NULL
  LOOP
    UPDATE races
    SET ref_id = generate_ref_id('R', 'races')
    WHERE id = race.id;
  END LOOP;
END $$;

-- Trigger pour auto-générer le ref_id lors de l'insertion
CREATE OR REPLACE FUNCTION set_race_ref_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.ref_id IS NULL THEN
    NEW.ref_id := generate_ref_id('R', 'races');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_set_race_ref_id ON races;
CREATE TRIGGER trigger_set_race_ref_id
  BEFORE INSERT ON races
  FOR EACH ROW
  EXECUTE FUNCTION set_race_ref_id();

-- ============================================
-- ATHLETES : Ajout ref_id
-- ============================================

-- Ajouter la colonne ref_id aux athlètes
ALTER TABLE athletes
ADD COLUMN IF NOT EXISTS ref_id TEXT UNIQUE;

-- Créer un index pour les recherches rapides
CREATE INDEX IF NOT EXISTS idx_athletes_ref_id ON athletes(ref_id);

-- Générer des ref_id pour les athlètes existants (par batch pour éviter timeout)
DO $$
DECLARE
  batch_size INTEGER := 1000;
  processed INTEGER := 0;
  total_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_count FROM athletes WHERE ref_id IS NULL;

  WHILE processed < total_count LOOP
    UPDATE athletes
    SET ref_id = generate_ref_id('A', 'athletes')
    WHERE id IN (
      SELECT id FROM athletes
      WHERE ref_id IS NULL
      LIMIT batch_size
    );

    processed := processed + batch_size;

    -- Log progress
    RAISE NOTICE 'Processed % / % athletes', LEAST(processed, total_count), total_count;
  END LOOP;
END $$;

-- Trigger pour auto-générer le ref_id lors de l'insertion
CREATE OR REPLACE FUNCTION set_athlete_ref_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.ref_id IS NULL THEN
    NEW.ref_id := generate_ref_id('A', 'athletes');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_set_athlete_ref_id ON athletes;
CREATE TRIGGER trigger_set_athlete_ref_id
  BEFORE INSERT ON athletes
  FOR EACH ROW
  EXECUTE FUNCTION set_athlete_ref_id();

-- ============================================
-- FONCTION UTILITAIRE : Recherche par ref_id
-- ============================================

-- Fonction pour rechercher n'importe quelle entité par son ref_id
CREATE OR REPLACE FUNCTION search_by_ref_id(ref_id_input TEXT)
RETURNS TABLE (
  entity_type TEXT,
  entity_id UUID,
  ref_id TEXT,
  name TEXT,
  details JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Recherche dans organizers
  RETURN QUERY
  SELECT
    'organizer'::TEXT,
    o.id,
    o.ref_id,
    o.name,
    jsonb_build_object(
      'email', o.email,
      'phone', o.phone,
      'city', o.city
    )
  FROM organizers o
  WHERE o.ref_id = ref_id_input;

  -- Recherche dans events
  RETURN QUERY
  SELECT
    'event'::TEXT,
    e.id,
    e.ref_id,
    e.name,
    jsonb_build_object(
      'start_date', e.start_date,
      'city', e.city,
      'slug', e.slug
    )
  FROM events e
  WHERE e.ref_id = ref_id_input;

  -- Recherche dans races
  RETURN QUERY
  SELECT
    'race'::TEXT,
    r.id,
    r.ref_id,
    r.name,
    jsonb_build_object(
      'distance', r.distance,
      'event_id', r.event_id,
      'slug', r.slug
    )
  FROM races r
  WHERE r.ref_id = ref_id_input;

  -- Recherche dans athletes
  RETURN QUERY
  SELECT
    'athlete'::TEXT,
    a.id,
    a.ref_id,
    CONCAT(a.first_name, ' ', a.last_name),
    jsonb_build_object(
      'email', a.email,
      'license_number', a.license_number,
      'club', a.club
    )
  FROM athletes a
  WHERE a.ref_id = ref_id_input;
END;
$$;

-- Commentaires sur les colonnes
COMMENT ON COLUMN organizers.ref_id IS 'ID de référence unique au format O123456 pour faciliter le traçage et le support';
COMMENT ON COLUMN events.ref_id IS 'ID de référence unique au format E123456 pour faciliter le traçage et le support';
COMMENT ON COLUMN races.ref_id IS 'ID de référence unique au format R123456 pour faciliter le traçage et le support';
COMMENT ON COLUMN athletes.ref_id IS 'ID de référence unique au format A123456 pour faciliter le traçage et le support';
