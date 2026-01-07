/*
  # Système de modèles de décharge de responsabilité

  1. Nouvelles tables
    - `waiver_templates` - Modèles de décharge configurables par les organisateurs
    - `waiver_checkboxes` - Cases à cocher pour chaque modèle de décharge
    - `waiver_signatures` - Signatures et acceptations des athlètes

  2. Fonctionnalités
    - Variables dynamiques: {ORGANIZER_NAME}, {ORGANIZER_ADDRESS}, {EVENT_NAME}, {RACE_NAME}, {DISTANCE}, {DATE}
    - Cases à cocher configurables
    - Signature électronique
    - Traçabilité complète (IP, user agent, timestamp)

  3. Sécurité
    - RLS activé sur toutes les tables
    - Les organisateurs peuvent créer et modifier leurs modèles
    - Les athlètes peuvent signer lors de l'inscription
*/

-- =====================================================================
-- TABLE: waiver_templates
-- =====================================================================

CREATE TABLE IF NOT EXISTS waiver_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id uuid REFERENCES organizers(id) ON DELETE CASCADE NOT NULL,
  event_id uuid REFERENCES events(id) ON DELETE CASCADE,
  race_id uuid REFERENCES races(id) ON DELETE CASCADE,

  -- Contenu
  title text NOT NULL DEFAULT 'Décharge de responsabilité',
  content text NOT NULL,
  footer_text text,

  -- Options d'affichage
  show_organizer_logo boolean DEFAULT true,
  show_organizer_info boolean DEFAULT true,
  show_event_info boolean DEFAULT true,
  show_date_location boolean DEFAULT true,

  -- Paramètres de signature
  require_manual_signature boolean DEFAULT true,
  require_checkboxes boolean DEFAULT true,
  minimum_age_to_sign integer DEFAULT 18,
  allow_parent_signature boolean DEFAULT true,

  -- Métadonnées
  is_active boolean DEFAULT true,
  version integer DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE waiver_templates ENABLE ROW LEVEL SECURITY;

-- Index unique partiel: un seul modèle actif par course
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_waiver_per_race 
  ON waiver_templates(race_id) 
  WHERE is_active = true;

CREATE POLICY "organizers_manage_own_waiver_templates"
  ON waiver_templates FOR ALL
  TO authenticated
  USING (
    organizer_id IN (
      SELECT o.id FROM organizers o WHERE o.user_id = auth.uid()
    )
  )
  WITH CHECK (
    organizer_id IN (
      SELECT o.id FROM organizers o WHERE o.user_id = auth.uid()
    )
  );

CREATE POLICY "public_read_active_waiver_templates"
  ON waiver_templates FOR SELECT
  TO public
  USING (is_active = true);

CREATE POLICY "admins_manage_all_waiver_templates"
  ON waiver_templates FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE INDEX IF NOT EXISTS idx_waiver_templates_organizer ON waiver_templates(organizer_id);
CREATE INDEX IF NOT EXISTS idx_waiver_templates_event ON waiver_templates(event_id);
CREATE INDEX IF NOT EXISTS idx_waiver_templates_race ON waiver_templates(race_id);
CREATE INDEX IF NOT EXISTS idx_waiver_templates_active ON waiver_templates(is_active) WHERE is_active = true;

COMMENT ON TABLE waiver_templates IS 'Modèles de décharge de responsabilité configurables avec variables dynamiques';

-- =====================================================================
-- TABLE: waiver_checkboxes
-- =====================================================================

CREATE TABLE IF NOT EXISTS waiver_checkboxes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  waiver_template_id uuid REFERENCES waiver_templates(id) ON DELETE CASCADE NOT NULL,

  -- Contenu
  label text NOT NULL,
  description text,

  -- Paramètres
  is_required boolean DEFAULT true,
  display_order integer DEFAULT 0,

  -- Métadonnées
  created_at timestamptz DEFAULT now()
);

ALTER TABLE waiver_checkboxes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "organizers_manage_own_checkboxes"
  ON waiver_checkboxes FOR ALL
  TO authenticated
  USING (
    waiver_template_id IN (
      SELECT wt.id FROM waiver_templates wt
      JOIN organizers o ON o.id = wt.organizer_id
      WHERE o.user_id = auth.uid()
    )
  )
  WITH CHECK (
    waiver_template_id IN (
      SELECT wt.id FROM waiver_templates wt
      JOIN organizers o ON o.id = wt.organizer_id
      WHERE o.user_id = auth.uid()
    )
  );

CREATE POLICY "public_read_checkboxes"
  ON waiver_checkboxes FOR SELECT
  TO public
  USING (
    waiver_template_id IN (
      SELECT wt.id FROM waiver_templates wt WHERE wt.is_active = true
    )
  );

CREATE POLICY "admins_manage_all_checkboxes"
  ON waiver_checkboxes FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE INDEX IF NOT EXISTS idx_waiver_checkboxes_template ON waiver_checkboxes(waiver_template_id);
CREATE INDEX IF NOT EXISTS idx_waiver_checkboxes_order ON waiver_checkboxes(display_order);

COMMENT ON TABLE waiver_checkboxes IS 'Cases à cocher pour les modèles de décharge';

-- =====================================================================
-- TABLE: waiver_signatures
-- =====================================================================

CREATE TABLE IF NOT EXISTS waiver_signatures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  waiver_template_id uuid REFERENCES waiver_templates(id) ON DELETE CASCADE NOT NULL,
  entry_id uuid REFERENCES entries(id) ON DELETE CASCADE NOT NULL,
  athlete_id uuid REFERENCES athletes(id) ON DELETE CASCADE NOT NULL,

  -- Données de signature
  signature_data text NOT NULL,
  signature_type text DEFAULT 'manual' CHECK (signature_type IN ('manual', 'electronic', 'parent')),

  -- Cases cochées (JSON array des IDs)
  checkboxes_accepted jsonb DEFAULT '[]'::jsonb,

  -- Informations de traçabilité
  ip_address text,
  user_agent text,
  signed_at timestamptz DEFAULT now(),

  -- Pour les mineurs
  parent_name text,
  parent_relation text,
  parent_signature_data text,

  -- Métadonnées
  created_at timestamptz DEFAULT now(),

  -- Un athlète ne peut signer qu'une fois par inscription
  CONSTRAINT unique_signature_per_entry UNIQUE (entry_id, athlete_id)
);

ALTER TABLE waiver_signatures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "athletes_create_own_signatures"
  ON waiver_signatures FOR INSERT
  TO authenticated
  WITH CHECK (
    athlete_id IN (
      SELECT a.id FROM athletes a WHERE a.user_id = auth.uid()
    )
  );

CREATE POLICY "athletes_view_own_signatures"
  ON waiver_signatures FOR SELECT
  TO authenticated
  USING (
    athlete_id IN (
      SELECT a.id FROM athletes a WHERE a.user_id = auth.uid()
    )
  );

CREATE POLICY "organizers_view_event_signatures"
  ON waiver_signatures FOR SELECT
  TO authenticated
  USING (
    entry_id IN (
      SELECT e.id FROM entries e
      JOIN races r ON r.id = e.race_id
      JOIN events ev ON ev.id = r.event_id
      JOIN organizers o ON o.id = ev.organizer_id
      WHERE o.user_id = auth.uid()
    )
  );

CREATE POLICY "admins_manage_all_signatures"
  ON waiver_signatures FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE INDEX IF NOT EXISTS idx_waiver_signatures_template ON waiver_signatures(waiver_template_id);
CREATE INDEX IF NOT EXISTS idx_waiver_signatures_entry ON waiver_signatures(entry_id);
CREATE INDEX IF NOT EXISTS idx_waiver_signatures_athlete ON waiver_signatures(athlete_id);
CREATE INDEX IF NOT EXISTS idx_waiver_signatures_signed_at ON waiver_signatures(signed_at);

COMMENT ON TABLE waiver_signatures IS 'Signatures et acceptations des athlètes pour les décharges de responsabilité';

-- =====================================================================
-- MODIFICATIONS: races table (ajout colonne waiver_template_id)
-- =====================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'races' AND column_name = 'waiver_template_id'
  ) THEN
    ALTER TABLE races ADD COLUMN waiver_template_id uuid REFERENCES waiver_templates(id) ON DELETE SET NULL;
    CREATE INDEX idx_races_waiver_template ON races(waiver_template_id);
    COMMENT ON COLUMN races.waiver_template_id IS 'Modèle de décharge à utiliser pour cette course';
  END IF;
END $$;

-- =====================================================================
-- FUNCTION: get_waiver_with_dynamic_values
-- =====================================================================

CREATE OR REPLACE FUNCTION get_waiver_with_dynamic_values(
  p_race_id uuid,
  p_athlete_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result jsonb;
  v_template_content text;
  v_organizer_name text;
  v_organizer_address text;
  v_organizer_logo text;
  v_event_name text;
  v_race_name text;
  v_distance numeric;
  v_event_date date;
  v_location text;
BEGIN
  SELECT
    wt.content,
    o.name,
    o.address || ', ' || COALESCE(o.city, '') || ' ' || COALESCE(o.postal_code, ''),
    o.logo_url,
    ev.name,
    r.name,
    r.distance,
    ev.date,
    ev.location
  INTO
    v_template_content,
    v_organizer_name,
    v_organizer_address,
    v_organizer_logo,
    v_event_name,
    v_race_name,
    v_distance,
    v_event_date,
    v_location
  FROM races r
  JOIN events ev ON ev.id = r.event_id
  JOIN organizers o ON o.id = ev.organizer_id
  LEFT JOIN waiver_templates wt ON wt.id = r.waiver_template_id
  WHERE r.id = p_race_id;

  IF v_template_content IS NULL THEN
    RETURN NULL;
  END IF;

  v_template_content := REPLACE(v_template_content, '{ORGANIZER_NAME}', COALESCE(v_organizer_name, ''));
  v_template_content := REPLACE(v_template_content, '{ORGANIZER_ADDRESS}', COALESCE(v_organizer_address, ''));
  v_template_content := REPLACE(v_template_content, '{EVENT_NAME}', COALESCE(v_event_name, ''));
  v_template_content := REPLACE(v_template_content, '{RACE_NAME}', COALESCE(v_race_name, ''));
  v_template_content := REPLACE(v_template_content, '{DISTANCE}', COALESCE(v_distance::text || ' km', ''));
  v_template_content := REPLACE(v_template_content, '{DATE}', COALESCE(TO_CHAR(v_event_date, 'DD/MM/YYYY'), ''));
  v_template_content := REPLACE(v_template_content, '{LOCATION}', COALESCE(v_location, ''));

  v_result := jsonb_build_object(
    'content', v_template_content,
    'organizer_logo', v_organizer_logo,
    'organizer_name', v_organizer_name,
    'organizer_address', v_organizer_address,
    'event_name', v_event_name,
    'race_name', v_race_name,
    'distance', v_distance,
    'event_date', v_event_date,
    'location', v_location
  );

  RETURN v_result;
END;
$$;

COMMENT ON FUNCTION get_waiver_with_dynamic_values IS 'Génère la décharge avec les valeurs dynamiques remplacées';

-- =====================================================================
-- FUNCTION: update_waiver_template_timestamp
-- =====================================================================

CREATE OR REPLACE FUNCTION update_waiver_template_timestamp()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_update_waiver_template_timestamp ON waiver_templates;

CREATE TRIGGER trigger_update_waiver_template_timestamp
  BEFORE UPDATE ON waiver_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_waiver_template_timestamp();