/*
  # Module de Gestion des Résultats

  1. Tables Créées
    - `results` - Résultats de course
      - `id` (uuid, PK)
      - `race_id` (uuid, FK vers races)
      - `entry_id` (uuid, FK vers entries)
      - `bib_number` (integer)
      - `athlete_name` (text) - Dénormalisé pour performance
      - `gender` (text)
      - `category` (text)
      - `finish_time` (interval) - Temps brut
      - `gun_time` (interval) - Temps pistolet
      - `net_time` (interval) - Temps net
      - `overall_rank` (integer) - Classement scratch
      - `gender_rank` (integer) - Classement par genre
      - `category_rank` (integer) - Classement catégorie
      - `split_times` (jsonb) - Temps intermédiaires
      - `status` (text) - finished, dnf, dns, dsq
      - `import_source` (text) - elogica, excel, csv, manual
      - `import_batch_id` (uuid) - Groupe d'import
      - `notes` (text)
      - `created_at`, `updated_at`

    - `result_imports` - Historique des imports
      - `id` (uuid, PK)
      - `race_id` (uuid, FK)
      - `file_name` (text)
      - `file_type` (text) - elogica, excel, csv
      - `imported_by` (uuid, FK vers auth.users)
      - `total_rows` (integer)
      - `successful_rows` (integer)
      - `failed_rows` (integer)
      - `errors` (jsonb)
      - `status` (text) - pending, processing, completed, failed
      - `created_at`, `completed_at`

    - `split_points` - Points de passage
      - `id` (uuid, PK)
      - `race_id` (uuid, FK)
      - `name` (text) - "Départ", "KM5", "Ravitaillement 1"
      - `distance_km` (decimal)
      - `order_index` (integer)
      - `created_at`

  2. Fonctions
    - `calculate_rankings()` - Calcul automatique des classements
    - `parse_time_string()` - Conversion string vers interval
    - `format_time_result()` - Format d'affichage HH:MM:SS

  3. Sécurité
    - RLS activé sur toutes les tables
    - Organisateurs peuvent gérer leurs résultats
    - Public peut voir les résultats publiés
*/

-- Table des résultats
CREATE TABLE IF NOT EXISTS results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  race_id uuid REFERENCES races(id) ON DELETE CASCADE NOT NULL,
  entry_id uuid REFERENCES entries(id) ON DELETE SET NULL,

  -- Données athlète (dénormalisées pour performance)
  bib_number integer NOT NULL,
  athlete_name text NOT NULL,
  gender text CHECK (gender IN ('M', 'F', 'X')),
  category text,

  -- Temps
  finish_time interval,
  gun_time interval,
  net_time interval,

  -- Classements
  overall_rank integer,
  gender_rank integer,
  category_rank integer,

  -- Données additionnelles
  split_times jsonb DEFAULT '[]'::jsonb,
  status text DEFAULT 'finished' CHECK (status IN ('finished', 'dnf', 'dns', 'dsq')),

  -- Traçabilité import
  import_source text CHECK (import_source IN ('elogica', 'excel', 'csv', 'manual')),
  import_batch_id uuid,
  notes text,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  UNIQUE(race_id, bib_number)
);

-- Index pour performance
CREATE INDEX idx_results_race ON results(race_id);
CREATE INDEX idx_results_entry ON results(entry_id);
CREATE INDEX idx_results_bib ON results(race_id, bib_number);
CREATE INDEX idx_results_status ON results(status) WHERE status = 'finished';
CREATE INDEX idx_results_overall_rank ON results(race_id, overall_rank) WHERE status = 'finished';
CREATE INDEX idx_results_import_batch ON results(import_batch_id);

-- Recherche full-text sur nom athlète
CREATE INDEX idx_results_athlete_search ON results
  USING gin(to_tsvector('french', athlete_name));

-- Table historique des imports
CREATE TABLE IF NOT EXISTS result_imports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  race_id uuid REFERENCES races(id) ON DELETE CASCADE NOT NULL,

  file_name text NOT NULL,
  file_type text NOT NULL CHECK (file_type IN ('elogica', 'excel', 'csv')),
  imported_by uuid REFERENCES auth.users(id) NOT NULL,

  total_rows integer DEFAULT 0,
  successful_rows integer DEFAULT 0,
  failed_rows integer DEFAULT 0,
  errors jsonb DEFAULT '[]'::jsonb,

  status text DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),

  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

CREATE INDEX idx_result_imports_race ON result_imports(race_id);
CREATE INDEX idx_result_imports_user ON result_imports(imported_by);
CREATE INDEX idx_result_imports_status ON result_imports(status);

-- Table des points de passage
CREATE TABLE IF NOT EXISTS split_points (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  race_id uuid REFERENCES races(id) ON DELETE CASCADE NOT NULL,

  name text NOT NULL,
  distance_km decimal(6,2),
  order_index integer NOT NULL,

  created_at timestamptz DEFAULT now(),

  UNIQUE(race_id, order_index)
);

CREATE INDEX idx_split_points_race ON split_points(race_id);

-- ============================================
-- FONCTIONS UTILITAIRES
-- ============================================

-- Parser une chaîne de temps (HH:MM:SS ou MM:SS) en interval
CREATE OR REPLACE FUNCTION parse_time_string(time_str text)
RETURNS interval
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  -- Format HH:MM:SS
  IF time_str ~ '^\d{1,2}:\d{2}:\d{2}$' THEN
    RETURN time_str::interval;
  END IF;

  -- Format MM:SS (ajouter 00: devant)
  IF time_str ~ '^\d{1,2}:\d{2}$' THEN
    RETURN ('00:' || time_str)::interval;
  END IF;

  -- Format en secondes
  IF time_str ~ '^\d+$' THEN
    RETURN (time_str::integer || ' seconds')::interval;
  END IF;

  RETURN NULL;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$;

-- Formater un interval en string HH:MM:SS
CREATE OR REPLACE FUNCTION format_time_result(time_interval interval)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  hours integer;
  minutes integer;
  seconds integer;
BEGIN
  IF time_interval IS NULL THEN
    RETURN NULL;
  END IF;

  hours := EXTRACT(HOUR FROM time_interval)::integer;
  minutes := EXTRACT(MINUTE FROM time_interval)::integer;
  seconds := EXTRACT(SECOND FROM time_interval)::integer;

  RETURN LPAD(hours::text, 2, '0') || ':' ||
         LPAD(minutes::text, 2, '0') || ':' ||
         LPAD(seconds::text, 2, '0');
END;
$$;

-- Calculer automatiquement les classements
CREATE OR REPLACE FUNCTION calculate_rankings(p_race_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Classement scratch
  WITH ranked AS (
    SELECT
      id,
      ROW_NUMBER() OVER (ORDER BY finish_time) as rank
    FROM results
    WHERE race_id = p_race_id
      AND status = 'finished'
      AND finish_time IS NOT NULL
  )
  UPDATE results r
  SET overall_rank = ranked.rank
  FROM ranked
  WHERE r.id = ranked.id;

  -- Classement par genre
  WITH ranked_gender AS (
    SELECT
      id,
      ROW_NUMBER() OVER (PARTITION BY gender ORDER BY finish_time) as rank
    FROM results
    WHERE race_id = p_race_id
      AND status = 'finished'
      AND finish_time IS NOT NULL
      AND gender IS NOT NULL
  )
  UPDATE results r
  SET gender_rank = ranked_gender.rank
  FROM ranked_gender
  WHERE r.id = ranked_gender.id;

  -- Classement par catégorie
  WITH ranked_category AS (
    SELECT
      id,
      ROW_NUMBER() OVER (PARTITION BY category ORDER BY finish_time) as rank
    FROM results
    WHERE race_id = p_race_id
      AND status = 'finished'
      AND finish_time IS NOT NULL
      AND category IS NOT NULL
  )
  UPDATE results r
  SET category_rank = ranked_category.rank
  FROM ranked_category
  WHERE r.id = ranked_category.id;

  -- Mettre à jour updated_at
  UPDATE results
  SET updated_at = now()
  WHERE race_id = p_race_id;
END;
$$;

-- Trigger pour recalculer les classements automatiquement
CREATE OR REPLACE FUNCTION trigger_recalculate_rankings()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM calculate_rankings(NEW.race_id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER recalculate_rankings_on_insert
  AFTER INSERT ON results
  FOR EACH ROW
  EXECUTE FUNCTION trigger_recalculate_rankings();

CREATE TRIGGER recalculate_rankings_on_update
  AFTER UPDATE ON results
  FOR EACH ROW
  WHEN (OLD.finish_time IS DISTINCT FROM NEW.finish_time OR OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION trigger_recalculate_rankings();

-- Trigger pour updated_at
CREATE TRIGGER update_results_updated_at
  BEFORE UPDATE ON results
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE results ENABLE ROW LEVEL SECURITY;
ALTER TABLE result_imports ENABLE ROW LEVEL SECURITY;
ALTER TABLE split_points ENABLE ROW LEVEL SECURITY;

-- Results: Public peut voir les résultats des courses publiées
CREATE POLICY "Public can view published race results"
  ON results FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM races r
      JOIN events e ON r.event_id = e.id
      WHERE r.id = results.race_id
        AND e.status = 'published'
    )
  );

-- Results: Organisateurs peuvent gérer leurs résultats
CREATE POLICY "Organizers can manage their race results"
  ON results FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM races r
      JOIN events e ON r.event_id = e.id
      WHERE r.id = results.race_id
        AND e.organizer_id IN (
          SELECT organizer_id FROM organizer_users WHERE user_id = auth.uid()
        )
    )
  );

-- Result imports: Organisateurs voient leurs imports
CREATE POLICY "Organizers can view their imports"
  ON result_imports FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM races r
      JOIN events e ON r.event_id = e.id
      WHERE r.id = result_imports.race_id
        AND e.organizer_id IN (
          SELECT organizer_id FROM organizer_users WHERE user_id = auth.uid()
        )
    )
  );

CREATE POLICY "Organizers can create imports"
  ON result_imports FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM races r
      JOIN events e ON r.event_id = e.id
      WHERE r.id = result_imports.race_id
        AND e.organizer_id IN (
          SELECT organizer_id FROM organizer_users WHERE user_id = auth.uid()
        )
    )
  );

-- Split points: Public peut voir
CREATE POLICY "Public can view split points"
  ON split_points FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM races r
      JOIN events e ON r.event_id = e.id
      WHERE r.id = split_points.race_id
        AND e.status = 'published'
    )
  );

-- Split points: Organisateurs peuvent gérer
CREATE POLICY "Organizers can manage split points"
  ON split_points FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM races r
      JOIN events e ON r.event_id = e.id
      WHERE r.id = split_points.race_id
        AND e.organizer_id IN (
          SELECT organizer_id FROM organizer_users WHERE user_id = auth.uid()
        )
    )
  );

-- Admins ont accès complet
CREATE POLICY "Admins have full access to results"
  ON results FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admins have full access to imports"
  ON result_imports FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users WHERE id = auth.uid()
    )
  );
