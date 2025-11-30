/*
  # Ajouter table external_races pour gérer plusieurs courses par événement

  1. Nouvelles tables
    - `external_races` : Courses d'un événement externe (10km, semi, marathon)
    
  2. Modifications
    - Ajoute colonne `external_race_id` à `external_results`
    - Permet de grouper les résultats par course
    - Un événement peut avoir plusieurs courses
    
  3. Sécurité
    - RLS activé
    - Policies héritées de external_events
*/

-- Table des courses externes
CREATE TABLE IF NOT EXISTS external_races (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  external_event_id uuid NOT NULL REFERENCES external_events(id) ON DELETE CASCADE,
  name text NOT NULL,
  distance_km numeric(6,2),
  elevation_gain_m integer,
  sport_type text DEFAULT 'running',
  is_qualifying boolean DEFAULT false,
  max_participants integer,
  total_participants integer DEFAULT 0,
  total_finishers integer DEFAULT 0,
  custom_fields jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_external_races_event_id 
  ON external_races(external_event_id);

-- Ajouter colonne race_id à external_results
ALTER TABLE external_results 
  ADD COLUMN IF NOT EXISTS external_race_id uuid REFERENCES external_races(id) ON DELETE CASCADE;

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_external_results_race_id 
  ON external_results(external_race_id);

-- RLS sur external_races
ALTER TABLE external_races ENABLE ROW LEVEL SECURITY;

-- Public peut lire les courses d'événements publiés
CREATE POLICY "enable_select_published_races"
  ON external_races
  FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM external_events
      WHERE external_events.id = external_races.external_event_id
      AND external_events.status = 'published'
      AND external_events.is_public = true
    )
    OR EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.is_active = true
    )
  );

-- Admins peuvent tout faire
CREATE POLICY "enable_all_for_admins_on_races"
  ON external_races
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.is_active = true
    )
  );

-- Organisateurs peuvent gérer leurs courses
CREATE POLICY "enable_all_for_organizers_on_races"
  ON external_races
  FOR ALL
  TO authenticated
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

-- Fonction pour créer automatiquement une race par défaut lors de la soumission
CREATE OR REPLACE FUNCTION create_default_external_race()
RETURNS TRIGGER AS $$
BEGIN
  -- Si c'est une soumission publique (sans race spécifiée), créer une race par défaut
  IF NEW.custom_fields ? 'race_name' AND NEW.custom_fields->>'race_name' IS NOT NULL THEN
    -- Créer la race avec le nom personnalisé
    INSERT INTO external_races (
      external_event_id,
      name,
      distance_km,
      is_qualifying,
      sport_type,
      custom_fields
    ) VALUES (
      NEW.id,
      NEW.custom_fields->>'race_name',
      NEW.distance_km,
      COALESCE((NEW.custom_fields->>'is_qualifying_event')::boolean, false),
      NEW.sport_type,
      NEW.custom_fields
    );
  ELSE
    -- Créer une race par défaut avec le nom de l'événement
    INSERT INTO external_races (
      external_event_id,
      name,
      distance_km,
      is_qualifying,
      sport_type,
      custom_fields
    ) VALUES (
      NEW.id,
      NEW.name,
      NEW.distance_km,
      COALESCE((NEW.custom_fields->>'is_qualifying_event')::boolean, false),
      NEW.sport_type,
      NEW.custom_fields
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour créer la race par défaut
DROP TRIGGER IF EXISTS create_default_race_on_external_event ON external_events;
CREATE TRIGGER create_default_race_on_external_event
  AFTER INSERT ON external_events
  FOR EACH ROW
  EXECUTE FUNCTION create_default_external_race();

-- Commentaires
COMMENT ON TABLE external_races IS 
  'Courses d''un événement externe. Permet de gérer plusieurs courses (10km, semi, marathon) pour un même événement.';

COMMENT ON COLUMN external_results.external_race_id IS 
  'Référence vers la course spécifique. NULL = course par défaut de l''événement.';
