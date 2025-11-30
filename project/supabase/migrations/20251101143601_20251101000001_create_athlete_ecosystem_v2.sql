/*
  # Écosystème Athlète Timepulse - Base de données unifiée

  ## 1. Modifications de la table athletes
    - Ajout de `user_id` (lien avec auth.users pour authentification)
    - Ajout de `slug` (URL personnalisée : timepulse.fr/athlete/jean-dupont-1985)
    - Ajout de `is_public` (profil public ou privé)
    - Ajout de `timepulse_index` (indice de performance calculé)
    - Index composite UNIQUE sur (last_name, first_name, birthdate) pour matching

  ## 2. Liaison results → athletes
    - Ajout de `athlete_id` dans results
    - Fonction de matching automatique `match_athlete_by_identity()`
    - Index pour performance sur 270k+ athlètes

  ## 3. Nouvelles tables
    - `athlete_profiles` : Informations publiques (bio, photo, réseaux sociaux)
    - `athlete_records` : Records personnels par distance/discipline
    - `training_logs` : Carnet d'entraînement
    - `athlete_photos` : Galerie photos par course
    - `timepulse_index_history` : Historique de l'indice de performance
    - `race_types` : Typologie des courses (5km, 10km, marathon, triathlon...)

  ## 4. Sécurité
    - RLS sur toutes les tables
    - Admins ont accès complet à tous les comptes athlètes
    - Athlètes contrôlent leurs propres données
    - Public voit uniquement les profils publics

  ## 5. Performance
    - Index optimisés pour 270 000+ athlètes
    - Recherche full-text sur nom/prénom
    - Partitionnement prévu pour scale future
*/

-- ============================================
-- 1. MODIFICATION TABLE ATHLETES
-- ============================================

-- Ajout des colonnes pour l'écosystème
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'athletes' AND column_name = 'user_id') THEN
    ALTER TABLE athletes ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'athletes' AND column_name = 'slug') THEN
    ALTER TABLE athletes ADD COLUMN slug text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'athletes' AND column_name = 'is_public') THEN
    ALTER TABLE athletes ADD COLUMN is_public boolean DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'athletes' AND column_name = 'timepulse_index') THEN
    ALTER TABLE athletes ADD COLUMN timepulse_index integer DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'athletes' AND column_name = 'bio') THEN
    ALTER TABLE athletes ADD COLUMN bio text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'athletes' AND column_name = 'profile_photo_url') THEN
    ALTER TABLE athletes ADD COLUMN profile_photo_url text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'athletes' AND column_name = 'city_display') THEN
    ALTER TABLE athletes ADD COLUMN city_display text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'athletes' AND column_name = 'country_display') THEN
    ALTER TABLE athletes ADD COLUMN country_display text;
  END IF;
END $$;

-- Index UNIQUE composite pour matching (nom, prénom, date naissance)
CREATE UNIQUE INDEX IF NOT EXISTS idx_athletes_identity 
  ON athletes(LOWER(last_name), LOWER(first_name), birthdate);

-- Index pour recherche par user_id
CREATE INDEX IF NOT EXISTS idx_athletes_user_id ON athletes(user_id) WHERE user_id IS NOT NULL;

-- Index pour recherche par slug
CREATE UNIQUE INDEX IF NOT EXISTS idx_athletes_slug ON athletes(slug) WHERE slug IS NOT NULL;

-- Index pour recherche full-text (performance sur 270k entrées)
CREATE INDEX IF NOT EXISTS idx_athletes_search 
  ON athletes USING gin(
    to_tsvector('french', 
      COALESCE(first_name, '') || ' ' || 
      COALESCE(last_name, '') || ' ' || 
      COALESCE(license_club, '')
    )
  );

-- Index pour tri par indice Timepulse
CREATE INDEX IF NOT EXISTS idx_athletes_timepulse_index 
  ON athletes(timepulse_index DESC NULLS LAST);

-- ============================================
-- 2. LIAISON RESULTS → ATHLETES
-- ============================================

-- Ajout de athlete_id dans results
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'results' AND column_name = 'athlete_id') THEN
    ALTER TABLE results ADD COLUMN athlete_id uuid REFERENCES athletes(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Index pour jointure results ↔ athletes
CREATE INDEX IF NOT EXISTS idx_results_athlete_id ON results(athlete_id) WHERE athlete_id IS NOT NULL;

-- Index composite pour recherche par athlète + course
CREATE INDEX IF NOT EXISTS idx_results_athlete_race 
  ON results(athlete_id, race_id) WHERE athlete_id IS NOT NULL;

-- ============================================
-- 3. TABLE RACE_TYPES (typologie des courses)
-- ============================================

CREATE TABLE IF NOT EXISTS race_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  sport text NOT NULL CHECK (sport IN ('running', 'trail', 'triathlon', 'swimrun', 'duathlon', 'aquathlon', 'other')),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  
  -- Distances pour calcul de records
  distance_km decimal(6,2),
  
  -- Pour triathlon, swimrun, duathlon
  swim_distance_m integer,
  bike_distance_km decimal(6,2),
  run_distance_km decimal(6,2),
  
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  
  created_at timestamptz DEFAULT now()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_race_types_sport ON race_types(sport);
CREATE INDEX IF NOT EXISTS idx_race_types_slug ON race_types(slug);
CREATE INDEX IF NOT EXISTS idx_race_types_active ON race_types(is_active) WHERE is_active = true;

-- ============================================
-- 4. TABLE ATHLETE_PROFILES (infos publiques)
-- ============================================

CREATE TABLE IF NOT EXISTS athlete_profiles (
  athlete_id uuid PRIMARY KEY REFERENCES athletes(id) ON DELETE CASCADE,
  
  -- Réseaux sociaux
  instagram_handle text,
  facebook_url text,
  strava_profile text,
  twitter_handle text,
  
  -- Préférences d'affichage
  show_age boolean DEFAULT true,
  show_city boolean DEFAULT true,
  show_records boolean DEFAULT true,
  show_training_logs boolean DEFAULT false,
  
  -- Statistiques publiques
  total_races integer DEFAULT 0,
  total_km_completed decimal(10,2) DEFAULT 0,
  favorite_distance text,
  
  -- SEO
  meta_description text,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================
-- 5. TABLE ATHLETE_RECORDS (records perso)
-- ============================================

CREATE TABLE IF NOT EXISTS athlete_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id uuid REFERENCES athletes(id) ON DELETE CASCADE NOT NULL,
  race_type_id uuid REFERENCES race_types(id) ON DELETE CASCADE NOT NULL,
  
  -- Record
  best_time interval NOT NULL,
  result_id uuid REFERENCES results(id) ON DELETE SET NULL,
  race_id uuid REFERENCES races(id) ON DELETE SET NULL,
  
  achieved_at timestamptz NOT NULL,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(athlete_id, race_type_id)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_athlete_records_athlete ON athlete_records(athlete_id);
CREATE INDEX IF NOT EXISTS idx_athlete_records_type ON athlete_records(race_type_id);

-- ============================================
-- 6. TABLE TRAINING_LOGS (carnet d'entraînement)
-- ============================================

CREATE TABLE IF NOT EXISTS training_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id uuid REFERENCES athletes(id) ON DELETE CASCADE NOT NULL,
  
  training_date date NOT NULL,
  activity_type text NOT NULL CHECK (activity_type IN ('run', 'bike', 'swim', 'strength', 'rest', 'other')),
  
  -- Données d'entraînement
  distance_km decimal(6,2),
  duration interval,
  average_pace interval,
  average_heart_rate integer,
  
  -- Notes
  title text,
  notes text,
  feeling text CHECK (feeling IN ('great', 'good', 'ok', 'tired', 'injured')),
  
  -- Données GPS (optionnel)
  gpx_url text,
  elevation_gain_m integer,
  
  is_public boolean DEFAULT false,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_training_logs_athlete ON training_logs(athlete_id);
CREATE INDEX IF NOT EXISTS idx_training_logs_date ON training_logs(athlete_id, training_date DESC);
CREATE INDEX IF NOT EXISTS idx_training_logs_public ON training_logs(is_public) WHERE is_public = true;

-- ============================================
-- 7. TABLE ATHLETE_PHOTOS (galerie)
-- ============================================

CREATE TABLE IF NOT EXISTS athlete_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id uuid REFERENCES athletes(id) ON DELETE CASCADE NOT NULL,
  race_id uuid REFERENCES races(id) ON DELETE SET NULL,
  
  photo_url text NOT NULL,
  caption text,
  
  -- Métadonnées
  taken_at timestamptz,
  uploaded_at timestamptz DEFAULT now(),
  
  is_public boolean DEFAULT true,
  is_profile_photo boolean DEFAULT false,
  
  -- Engagement
  likes_count integer DEFAULT 0,
  
  created_at timestamptz DEFAULT now()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_athlete_photos_athlete ON athlete_photos(athlete_id);
CREATE INDEX IF NOT EXISTS idx_athlete_photos_race ON athlete_photos(race_id) WHERE race_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_athlete_photos_public ON athlete_photos(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_athlete_photos_profile ON athlete_photos(athlete_id, is_profile_photo) 
  WHERE is_profile_photo = true;

-- ============================================
-- 8. TABLE TIMEPULSE_INDEX_HISTORY
-- ============================================

CREATE TABLE IF NOT EXISTS timepulse_index_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id uuid REFERENCES athletes(id) ON DELETE CASCADE NOT NULL,
  
  index_value integer NOT NULL,
  calculated_at timestamptz DEFAULT now(),
  
  -- Détails du calcul
  performance_score decimal(5,2),
  progression_score decimal(5,2),
  regularity_score decimal(5,2),
  versatility_score decimal(5,2),
  podium_score decimal(5,2)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_timepulse_history_athlete ON timepulse_index_history(athlete_id, calculated_at DESC);

-- ============================================
-- FONCTIONS UTILITAIRES
-- ============================================

-- Extension unaccent pour slugs
CREATE EXTENSION IF NOT EXISTS unaccent;

-- Générer un slug unique pour un athlète
CREATE OR REPLACE FUNCTION generate_athlete_slug(
  p_first_name text,
  p_last_name text,
  p_birthdate date
)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  base_slug text;
  final_slug text;
  counter integer := 0;
BEGIN
  -- Créer le slug de base : jean-dupont-1985
  base_slug := LOWER(
    regexp_replace(
      unaccent(p_first_name || '-' || p_last_name || '-' || EXTRACT(YEAR FROM p_birthdate)::text),
      '[^a-z0-9-]', '', 'g'
    )
  );
  
  final_slug := base_slug;
  
  -- Vérifier l'unicité
  WHILE EXISTS (SELECT 1 FROM athletes WHERE slug = final_slug) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter::text;
  END LOOP;
  
  RETURN final_slug;
END;
$$;

-- Fonction de matching automatique d'un athlète
CREATE OR REPLACE FUNCTION match_athlete_by_identity(
  p_first_name text,
  p_last_name text,
  p_birthdate date
)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  v_athlete_id uuid;
BEGIN
  -- Chercher l'athlète existant (insensible à la casse)
  SELECT id INTO v_athlete_id
  FROM athletes
  WHERE LOWER(first_name) = LOWER(p_first_name)
    AND LOWER(last_name) = LOWER(p_last_name)
    AND birthdate = p_birthdate;
  
  RETURN v_athlete_id;
END;
$$;

-- Fonction pour créer ou retrouver un athlète
CREATE OR REPLACE FUNCTION upsert_athlete(
  p_first_name text,
  p_last_name text,
  p_birthdate date,
  p_gender text,
  p_email text DEFAULT NULL,
  p_nationality text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  v_athlete_id uuid;
  v_slug text;
BEGIN
  -- Chercher l'athlète existant
  v_athlete_id := match_athlete_by_identity(p_first_name, p_last_name, p_birthdate);
  
  -- Si trouvé, le retourner
  IF v_athlete_id IS NOT NULL THEN
    RETURN v_athlete_id;
  END IF;
  
  -- Sinon, créer un nouveau
  v_slug := generate_athlete_slug(p_first_name, p_last_name, p_birthdate);
  
  INSERT INTO athletes (
    first_name,
    last_name,
    birthdate,
    gender,
    email,
    nationality,
    slug,
    is_public
  ) VALUES (
    p_first_name,
    p_last_name,
    p_birthdate,
    p_gender,
    p_email,
    p_nationality,
    v_slug,
    false -- Par défaut privé
  )
  RETURNING id INTO v_athlete_id;
  
  -- Créer le profil associé
  INSERT INTO athlete_profiles (athlete_id)
  VALUES (v_athlete_id)
  ON CONFLICT (athlete_id) DO NOTHING;
  
  RETURN v_athlete_id;
END;
$$;

-- Trigger pour créer automatiquement athlete_profiles
CREATE OR REPLACE FUNCTION create_athlete_profile_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO athlete_profiles (athlete_id)
  VALUES (NEW.id)
  ON CONFLICT (athlete_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS create_athlete_profile_on_insert ON athletes;
CREATE TRIGGER create_athlete_profile_on_insert
  AFTER INSERT ON athletes
  FOR EACH ROW
  EXECUTE FUNCTION create_athlete_profile_trigger();

-- Trigger pour updated_at
DROP TRIGGER IF EXISTS update_athlete_profiles_updated_at ON athlete_profiles;
CREATE TRIGGER update_athlete_profiles_updated_at
  BEFORE UPDATE ON athlete_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_athlete_records_updated_at ON athlete_records;
CREATE TRIGGER update_athlete_records_updated_at
  BEFORE UPDATE ON athlete_records
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_training_logs_updated_at ON training_logs;
CREATE TRIGGER update_training_logs_updated_at
  BEFORE UPDATE ON training_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE athlete_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE athlete_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE athlete_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE timepulse_index_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE race_types ENABLE ROW LEVEL SECURITY;

-- RACE_TYPES: Public peut voir les types actifs
DROP POLICY IF EXISTS "Public can view active race types" ON race_types;
CREATE POLICY "Public can view active race types"
  ON race_types FOR SELECT
  USING (is_active = true);

-- RACE_TYPES: Admins peuvent tout gérer
DROP POLICY IF EXISTS "Admins can manage race types" ON race_types;
CREATE POLICY "Admins can manage race types"
  ON race_types FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid())
  );

-- ATHLETE_PROFILES: Public peut voir les profils publics
DROP POLICY IF EXISTS "Public can view public athlete profiles" ON athlete_profiles;
CREATE POLICY "Public can view public athlete profiles"
  ON athlete_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM athletes 
      WHERE athletes.id = athlete_profiles.athlete_id 
        AND athletes.is_public = true
    )
  );

-- ATHLETE_PROFILES: Athlètes gèrent leur propre profil
DROP POLICY IF EXISTS "Athletes can manage their own profile" ON athlete_profiles;
CREATE POLICY "Athletes can manage their own profile"
  ON athlete_profiles FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM athletes 
      WHERE athletes.id = athlete_profiles.athlete_id 
        AND athletes.user_id = auth.uid()
    )
  );

-- ATHLETE_PROFILES: Admins ont accès complet
DROP POLICY IF EXISTS "Admins have full access to athlete profiles" ON athlete_profiles;
CREATE POLICY "Admins have full access to athlete profiles"
  ON athlete_profiles FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid())
  );

-- ATHLETE_RECORDS: Public peut voir les records des profils publics
DROP POLICY IF EXISTS "Public can view public athlete records" ON athlete_records;
CREATE POLICY "Public can view public athlete records"
  ON athlete_records FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM athletes a
      JOIN athlete_profiles ap ON a.id = ap.athlete_id
      WHERE a.id = athlete_records.athlete_id 
        AND a.is_public = true
        AND ap.show_records = true
    )
  );

-- ATHLETE_RECORDS: Athlètes gèrent leurs propres records
DROP POLICY IF EXISTS "Athletes can manage their own records" ON athlete_records;
CREATE POLICY "Athletes can manage their own records"
  ON athlete_records FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM athletes 
      WHERE athletes.id = athlete_records.athlete_id 
        AND athletes.user_id = auth.uid()
    )
  );

-- ATHLETE_RECORDS: Admins ont accès complet
DROP POLICY IF EXISTS "Admins have full access to athlete records" ON athlete_records;
CREATE POLICY "Admins have full access to athlete records"
  ON athlete_records FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid())
  );

-- TRAINING_LOGS: Public peut voir les logs publics
DROP POLICY IF EXISTS "Public can view public training logs" ON training_logs;
CREATE POLICY "Public can view public training logs"
  ON training_logs FOR SELECT
  USING (is_public = true);

-- TRAINING_LOGS: Athlètes gèrent leurs propres logs
DROP POLICY IF EXISTS "Athletes can manage their own training logs" ON training_logs;
CREATE POLICY "Athletes can manage their own training logs"
  ON training_logs FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM athletes 
      WHERE athletes.id = training_logs.athlete_id 
        AND athletes.user_id = auth.uid()
    )
  );

-- TRAINING_LOGS: Admins ont accès complet
DROP POLICY IF EXISTS "Admins have full access to training logs" ON training_logs;
CREATE POLICY "Admins have full access to training logs"
  ON training_logs FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid())
  );

-- ATHLETE_PHOTOS: Public peut voir les photos publiques
DROP POLICY IF EXISTS "Public can view public athlete photos" ON athlete_photos;
CREATE POLICY "Public can view public athlete photos"
  ON athlete_photos FOR SELECT
  USING (is_public = true);

-- ATHLETE_PHOTOS: Athlètes gèrent leurs propres photos
DROP POLICY IF EXISTS "Athletes can manage their own photos" ON athlete_photos;
CREATE POLICY "Athletes can manage their own photos"
  ON athlete_photos FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM athletes 
      WHERE athletes.id = athlete_photos.athlete_id 
        AND athletes.user_id = auth.uid()
    )
  );

-- ATHLETE_PHOTOS: Admins ont accès complet
DROP POLICY IF EXISTS "Admins have full access to athlete photos" ON athlete_photos;
CREATE POLICY "Admins have full access to athlete photos"
  ON athlete_photos FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid())
  );

-- TIMEPULSE_INDEX_HISTORY: Public peut voir l'historique des profils publics
DROP POLICY IF EXISTS "Public can view public index history" ON timepulse_index_history;
CREATE POLICY "Public can view public index history"
  ON timepulse_index_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM athletes 
      WHERE athletes.id = timepulse_index_history.athlete_id 
        AND athletes.is_public = true
    )
  );

-- TIMEPULSE_INDEX_HISTORY: Athlètes voient leur propre historique
DROP POLICY IF EXISTS "Athletes can view their own index history" ON timepulse_index_history;
CREATE POLICY "Athletes can view their own index history"
  ON timepulse_index_history FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM athletes 
      WHERE athletes.id = timepulse_index_history.athlete_id 
        AND athletes.user_id = auth.uid()
    )
  );

-- TIMEPULSE_INDEX_HISTORY: Admins ont accès complet
DROP POLICY IF EXISTS "Admins have full access to index history" ON timepulse_index_history;
CREATE POLICY "Admins have full access to index history"
  ON timepulse_index_history FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid())
  );

-- ATHLETES: Mise à jour des policies pour l'admin
DROP POLICY IF EXISTS "Admins can manage all athletes" ON athletes;
CREATE POLICY "Admins can manage all athletes"
  ON athletes FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid())
  );

-- ATHLETES: Public peut voir les profils publics
DROP POLICY IF EXISTS "Public can view public athletes" ON athletes;
CREATE POLICY "Public can view public athletes"
  ON athletes FOR SELECT
  USING (is_public = true);

-- ATHLETES: Athlètes peuvent voir et modifier leur propre profil
DROP POLICY IF EXISTS "Athletes can manage their own profile" ON athletes;
CREATE POLICY "Athletes can manage their own profile"
  ON athletes FOR ALL
  TO authenticated
  USING (user_id = auth.uid());
