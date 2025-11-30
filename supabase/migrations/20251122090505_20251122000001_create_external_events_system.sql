/*
  # Système d'événements externes et résultats standalone

  1. Nouvelles tables
    - `external_events` : Événements non gérés sur Timepulse (inscriptions externes)
    - `external_results` : Résultats importés d'événements externes

  2. Sécurité
    - RLS activé sur toutes les tables
    - Admins : accès complet
    - Public : lecture seule des événements/résultats publiés
*/

-- Table des événements externes
CREATE TABLE IF NOT EXISTS external_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  event_date date NOT NULL,
  registration_deadline date,
  city text NOT NULL,
  country_code text DEFAULT 'FRA',
  postal_code text,
  sport_type text NOT NULL DEFAULT 'running',
  distance_km numeric(6,2),
  elevation_gain_m integer,
  organizer_name text NOT NULL,
  organizer_email text,
  organizer_phone text,
  organizer_website text,
  organizer_id uuid REFERENCES organizers(id) ON DELETE SET NULL,
  logo_url text,
  banner_url text,
  banner_position jsonb DEFAULT '{"x": 50, "y": 50}'::jsonb,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  is_public boolean DEFAULT true,
  total_participants integer DEFAULT 0,
  total_finishers integer DEFAULT 0,
  results_imported_at timestamptz,
  results_source text,
  results_url text,
  timing_provider text,
  custom_fields jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Table des résultats externes
CREATE TABLE IF NOT EXISTS external_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  external_event_id uuid NOT NULL REFERENCES external_events(id) ON DELETE CASCADE,
  athlete_id uuid REFERENCES athletes(id) ON DELETE SET NULL,
  matching_confidence numeric(3,2),
  is_matched boolean DEFAULT false,
  bib_number text,
  first_name text NOT NULL,
  last_name text NOT NULL,
  gender text CHECK (gender IN ('M', 'F', 'X')),
  birth_year integer,
  birth_date date,
  city text,
  country_code text,
  club text,
  team_name text,
  license_number text,
  category text,
  category_gender text,
  finish_time interval,
  finish_time_display text,
  gun_time interval,
  net_time interval,
  overall_rank integer,
  gender_rank integer,
  category_rank integer,
  pace_per_km interval,
  average_speed_kmh numeric(5,2),
  splits jsonb DEFAULT '[]'::jsonb,
  performance_points integer,
  timepulse_index numeric(6,2),
  status text DEFAULT 'finished' CHECK (status IN ('finished', 'dnf', 'dns', 'dsq')),
  custom_fields jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  imported_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_external_events_slug ON external_events(slug);
CREATE INDEX IF NOT EXISTS idx_external_events_date ON external_events(event_date DESC);
CREATE INDEX IF NOT EXISTS idx_external_events_city ON external_events(city);
CREATE INDEX IF NOT EXISTS idx_external_events_status ON external_events(status);
CREATE INDEX IF NOT EXISTS idx_external_events_organizer ON external_events(organizer_id);
CREATE INDEX IF NOT EXISTS idx_external_results_event ON external_results(external_event_id);
CREATE INDEX IF NOT EXISTS idx_external_results_athlete ON external_results(athlete_id);
CREATE INDEX IF NOT EXISTS idx_external_results_name ON external_results(last_name, first_name);
CREATE INDEX IF NOT EXISTS idx_external_results_bib ON external_results(bib_number);
CREATE INDEX IF NOT EXISTS idx_external_results_rank ON external_results(overall_rank);
CREATE INDEX IF NOT EXISTS idx_external_results_time ON external_results(finish_time);

CREATE OR REPLACE FUNCTION update_external_events_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE external_events
  SET
    total_participants = (
      SELECT COUNT(*) FROM external_results
      WHERE external_event_id = NEW.external_event_id
    ),
    total_finishers = (
      SELECT COUNT(*) FROM external_results
      WHERE external_event_id = NEW.external_event_id
      AND status = 'finished'
    ),
    results_imported_at = now(),
    updated_at = now()
  WHERE id = NEW.external_event_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_update_external_events_stats
AFTER INSERT OR UPDATE ON external_results
FOR EACH ROW
EXECUTE FUNCTION update_external_events_stats();

ALTER TABLE external_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view published external events"
  ON external_events FOR SELECT TO public
  USING (status = 'published' AND is_public = true);

CREATE POLICY "Admins have full access to external events"
  ON external_events FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM admin_users WHERE admin_users.id = auth.uid()::uuid)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM admin_users WHERE admin_users.id = auth.uid()::uuid)
  );

CREATE POLICY "Organizers can manage their external events"
  ON external_events FOR ALL TO authenticated
  USING (organizer_id IN (SELECT id FROM organizers WHERE user_id = auth.uid()))
  WITH CHECK (organizer_id IN (SELECT id FROM organizers WHERE user_id = auth.uid()));

ALTER TABLE external_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view external results of published events"
  ON external_results FOR SELECT TO public
  USING (
    EXISTS (
      SELECT 1 FROM external_events
      WHERE external_events.id = external_results.external_event_id
      AND external_events.status = 'published'
      AND external_events.is_public = true
    )
  );

CREATE POLICY "Admins have full access to external results"
  ON external_results FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.id = auth.uid()::uuid))
  WITH CHECK (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.id = auth.uid()::uuid));

CREATE POLICY "Organizers can manage results of their external events"
  ON external_results FOR ALL TO authenticated
  USING (
    external_event_id IN (
      SELECT id FROM external_events
      WHERE organizer_id IN (SELECT id FROM organizers WHERE user_id = auth.uid())
    )
  )
  WITH CHECK (
    external_event_id IN (
      SELECT id FROM external_events
      WHERE organizer_id IN (SELECT id FROM organizers WHERE user_id = auth.uid())
    )
  );

CREATE OR REPLACE FUNCTION match_external_result_to_athlete(p_result_id uuid)
RETURNS jsonb AS $$
DECLARE
  v_result external_results;
  v_matched_athlete_id uuid;
  v_confidence numeric(3,2);
BEGIN
  SELECT * INTO v_result FROM external_results WHERE id = p_result_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Result not found');
  END IF;

  IF v_result.birth_date IS NOT NULL THEN
    SELECT id INTO v_matched_athlete_id FROM athletes
    WHERE LOWER(TRIM(first_name)) = LOWER(TRIM(v_result.first_name))
      AND LOWER(TRIM(last_name)) = LOWER(TRIM(v_result.last_name))
      AND birth_date = v_result.birth_date
    LIMIT 1;
    IF FOUND THEN
      v_confidence := 1.0;
    END IF;
  END IF;

  IF v_matched_athlete_id IS NULL AND v_result.birth_year IS NOT NULL THEN
    SELECT id INTO v_matched_athlete_id FROM athletes
    WHERE LOWER(TRIM(first_name)) = LOWER(TRIM(v_result.first_name))
      AND LOWER(TRIM(last_name)) = LOWER(TRIM(v_result.last_name))
      AND EXTRACT(YEAR FROM birth_date) = v_result.birth_year
    LIMIT 1;
    IF FOUND THEN
      v_confidence := 0.9;
    END IF;
  END IF;

  IF v_matched_athlete_id IS NULL AND v_result.gender IS NOT NULL THEN
    SELECT id INTO v_matched_athlete_id FROM athletes
    WHERE LOWER(TRIM(first_name)) = LOWER(TRIM(v_result.first_name))
      AND LOWER(TRIM(last_name)) = LOWER(TRIM(v_result.last_name))
      AND gender = v_result.gender
    LIMIT 1;
    IF FOUND THEN
      v_confidence := 0.7;
    END IF;
  END IF;

  IF v_matched_athlete_id IS NULL THEN
    SELECT id INTO v_matched_athlete_id FROM athletes
    WHERE LOWER(TRIM(first_name)) = LOWER(TRIM(v_result.first_name))
      AND LOWER(TRIM(last_name)) = LOWER(TRIM(v_result.last_name))
    LIMIT 1;
    IF FOUND THEN
      v_confidence := 0.5;
    END IF;
  END IF;

  IF v_matched_athlete_id IS NOT NULL THEN
    UPDATE external_results
    SET athlete_id = v_matched_athlete_id, matching_confidence = v_confidence,
        is_matched = true, updated_at = now()
    WHERE id = p_result_id;
    RETURN jsonb_build_object('success', true, 'athlete_id', v_matched_athlete_id, 'confidence', v_confidence);
  ELSE
    RETURN jsonb_build_object('success', false, 'message', 'No matching athlete found');
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION batch_match_external_results(p_event_id uuid)
RETURNS jsonb AS $$
DECLARE
  v_result_record RECORD;
  v_matched_count integer := 0;
  v_total_count integer := 0;
BEGIN
  FOR v_result_record IN
    SELECT id FROM external_results
    WHERE external_event_id = p_event_id AND athlete_id IS NULL
  LOOP
    v_total_count := v_total_count + 1;
    IF (match_external_result_to_athlete(v_result_record.id)->>'success')::boolean THEN
      v_matched_count := v_matched_count + 1;
    END IF;
  END LOOP;
  RETURN jsonb_build_object(
    'total', v_total_count, 'matched', v_matched_count,
    'unmatched', v_total_count - v_matched_count,
    'match_rate', ROUND((v_matched_count::numeric / NULLIF(v_total_count, 0) * 100), 2)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;