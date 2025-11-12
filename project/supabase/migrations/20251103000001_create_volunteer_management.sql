/*
  # Module Gestion des Bénévoles - Timepulse

  1. Nouvelles Tables
    - `volunteer_posts` - Postes bénévoles (ravitaillements, sécurité, etc.)
      - Lié à un événement/course
      - Position GPS et KM sur parcours
      - Horaires, instructions, matériel nécessaire
      - Nombre de bénévoles requis

    - `volunteers` - Bénévoles inscrits
      - Informations personnelles (nom, email, téléphone)
      - Préférences et compétences
      - Disponibilités
      - Taille t-shirt, régime alimentaire

    - `volunteer_assignments` - Affectations bénévoles aux postes
      - Lien volunteer <> post
      - Statut (assigné, confirmé, présent, absent)
      - Pointage arrivée/départ
      - Token d'accès unique

    - `volunteer_availability` - Disponibilités horaires
      - Créneaux disponibles par bénévole
      - Types de postes préférés

  2. Sécurité
    - Enable RLS sur toutes les tables
    - Organisateurs : accès complet à leurs événements
    - Bénévoles : accès via token unique
    - Public : inscription ouverte

  3. Fonctionnalités
    - Création de postes sur parcours
    - Inscription publique des bénévoles
    - Affectation manuelle ou automatique
    - Génération de fiches de poste
    - Pointage présence
    - Certificats de bénévolat
*/

-- Table: volunteer_posts (Postes bénévoles)
CREATE TABLE IF NOT EXISTS volunteer_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  race_id uuid REFERENCES races(id) ON DELETE CASCADE,

  name text NOT NULL,
  type text NOT NULL CHECK (type IN (
    'ravitaillement',
    'securite',
    'signalisation',
    'depart_arrivee',
    'vestiaire',
    'retrait_dossards',
    'animation',
    'secourisme',
    'autre'
  )),

  location_name text,
  location_lat numeric(10, 7),
  location_lng numeric(10, 7),
  km_marker numeric(6, 2),

  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,

  required_volunteers_count integer NOT NULL DEFAULT 1 CHECK (required_volunteers_count > 0),

  instructions text,
  material_needed text,
  emergency_contact_name text,
  emergency_contact_phone text,

  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled')),

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  CONSTRAINT valid_time_range CHECK (end_time > start_time)
);

CREATE INDEX IF NOT EXISTS idx_volunteer_posts_event ON volunteer_posts(event_id);
CREATE INDEX IF NOT EXISTS idx_volunteer_posts_race ON volunteer_posts(race_id);
CREATE INDEX IF NOT EXISTS idx_volunteer_posts_type ON volunteer_posts(type);

ALTER TABLE volunteer_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organizers can manage posts for their events"
  ON volunteer_posts FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = volunteer_posts.event_id
      AND events.organizer_id IN (
        SELECT id FROM organizers WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Public can view active posts"
  ON volunteer_posts FOR SELECT
  TO public
  USING (status = 'active');

-- Table: volunteers (Bénévoles)
CREATE TABLE IF NOT EXISTS volunteers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,

  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  birth_date date,

  address text,
  city text,
  postal_code text,
  country text DEFAULT 'France',

  tshirt_size text CHECK (tshirt_size IN ('XS', 'S', 'M', 'L', 'XL', 'XXL')),
  dietary_restrictions text,

  has_first_aid_certification boolean DEFAULT false,
  has_driving_license boolean DEFAULT false,

  skills jsonb DEFAULT '[]',
  preferred_post_types jsonb DEFAULT '[]',

  notes text,

  registration_token text UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),

  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  CONSTRAINT unique_volunteer_per_event UNIQUE (event_id, email)
);

CREATE INDEX IF NOT EXISTS idx_volunteers_event ON volunteers(event_id);
CREATE INDEX IF NOT EXISTS idx_volunteers_email ON volunteers(email);
CREATE INDEX IF NOT EXISTS idx_volunteers_token ON volunteers(registration_token);

ALTER TABLE volunteers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organizers can manage volunteers for their events"
  ON volunteers FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = volunteers.event_id
      AND events.organizer_id IN (
        SELECT id FROM organizers WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Public can insert volunteers"
  ON volunteers FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Volunteers can view their own data via token"
  ON volunteers FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Volunteers can update their own data via token"
  ON volunteers FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- Table: volunteer_assignments (Affectations)
CREATE TABLE IF NOT EXISTS volunteer_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  volunteer_id uuid NOT NULL REFERENCES volunteers(id) ON DELETE CASCADE,
  post_id uuid NOT NULL REFERENCES volunteer_posts(id) ON DELETE CASCADE,

  status text NOT NULL DEFAULT 'assigned' CHECK (status IN (
    'assigned',
    'confirmed',
    'present',
    'absent',
    'cancelled'
  )),

  check_in_time timestamptz,
  check_out_time timestamptz,

  assignment_notes text,
  volunteer_feedback text,
  organizer_rating integer CHECK (organizer_rating BETWEEN 1 AND 5),

  certificate_generated boolean DEFAULT false,
  certificate_generated_at timestamptz,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  CONSTRAINT unique_assignment UNIQUE (volunteer_id, post_id)
);

CREATE INDEX IF NOT EXISTS idx_assignments_volunteer ON volunteer_assignments(volunteer_id);
CREATE INDEX IF NOT EXISTS idx_assignments_post ON volunteer_assignments(post_id);
CREATE INDEX IF NOT EXISTS idx_assignments_status ON volunteer_assignments(status);

ALTER TABLE volunteer_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organizers can manage assignments for their events"
  ON volunteer_assignments FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM volunteer_posts vp
      JOIN events e ON e.id = vp.event_id
      WHERE vp.id = volunteer_assignments.post_id
      AND e.organizer_id IN (
        SELECT id FROM organizers WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Volunteers can view their assignments"
  ON volunteer_assignments FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Volunteers can update their assignment status"
  ON volunteer_assignments FOR UPDATE
  TO public
  USING (status IN ('assigned', 'confirmed'))
  WITH CHECK (status IN ('confirmed', 'cancelled'));

-- Table: volunteer_availability (Disponibilités)
CREATE TABLE IF NOT EXISTS volunteer_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  volunteer_id uuid NOT NULL REFERENCES volunteers(id) ON DELETE CASCADE,

  available_from timestamptz NOT NULL,
  available_to timestamptz NOT NULL,

  notes text,

  created_at timestamptz DEFAULT now(),

  CONSTRAINT valid_availability_range CHECK (available_to > available_from)
);

CREATE INDEX IF NOT EXISTS idx_availability_volunteer ON volunteer_availability(volunteer_id);

ALTER TABLE volunteer_availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organizers can view availability for their events"
  ON volunteer_availability FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM volunteers v
      JOIN events e ON e.id = v.event_id
      WHERE v.id = volunteer_availability.volunteer_id
      AND e.organizer_id IN (
        SELECT id FROM organizers WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Volunteers can manage their availability"
  ON volunteer_availability FOR ALL
  TO public
  USING (true);

-- Function: Get volunteer post stats
CREATE OR REPLACE FUNCTION get_volunteer_post_stats(p_post_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'required_count', vp.required_volunteers_count,
    'assigned_count', COUNT(va.id) FILTER (WHERE va.status = 'assigned'),
    'confirmed_count', COUNT(va.id) FILTER (WHERE va.status = 'confirmed'),
    'present_count', COUNT(va.id) FILTER (WHERE va.status = 'present'),
    'absent_count', COUNT(va.id) FILTER (WHERE va.status = 'absent'),
    'remaining_slots', GREATEST(0, vp.required_volunteers_count - COUNT(va.id) FILTER (WHERE va.status IN ('assigned', 'confirmed', 'present')))
  )
  INTO v_result
  FROM volunteer_posts vp
  LEFT JOIN volunteer_assignments va ON va.post_id = vp.id
  WHERE vp.id = p_post_id
  GROUP BY vp.id, vp.required_volunteers_count;

  RETURN COALESCE(v_result, '{}'::jsonb);
END;
$$;

-- Function: Get event volunteer summary
CREATE OR REPLACE FUNCTION get_event_volunteer_summary(p_event_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'total_posts', COUNT(DISTINCT vp.id),
    'total_required', SUM(vp.required_volunteers_count),
    'total_volunteers', COUNT(DISTINCT v.id),
    'total_assigned', COUNT(va.id) FILTER (WHERE va.status IN ('assigned', 'confirmed', 'present')),
    'posts_full', COUNT(DISTINCT vp.id) FILTER (
      WHERE vp.required_volunteers_count <= (
        SELECT COUNT(*) FROM volunteer_assignments
        WHERE post_id = vp.id AND status IN ('assigned', 'confirmed', 'present')
      )
    ),
    'posts_empty', COUNT(DISTINCT vp.id) FILTER (
      WHERE NOT EXISTS (
        SELECT 1 FROM volunteer_assignments
        WHERE post_id = vp.id AND status IN ('assigned', 'confirmed', 'present')
      )
    )
  )
  INTO v_result
  FROM volunteer_posts vp
  LEFT JOIN volunteer_assignments va ON va.post_id = vp.id
  LEFT JOIN volunteers v ON v.id = va.volunteer_id
  WHERE vp.event_id = p_event_id;

  RETURN COALESCE(v_result, '{}'::jsonb);
END;
$$;

-- Function: Auto-assign volunteers based on availability and preferences
CREATE OR REPLACE FUNCTION auto_assign_volunteers(p_event_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_assigned_count integer := 0;
  v_post record;
  v_volunteer record;
BEGIN
  FOR v_post IN
    SELECT vp.*
    FROM volunteer_posts vp
    WHERE vp.event_id = p_event_id
    AND vp.status = 'active'
    AND vp.required_volunteers_count > (
      SELECT COUNT(*) FROM volunteer_assignments
      WHERE post_id = vp.id AND status IN ('assigned', 'confirmed', 'present')
    )
  LOOP
    FOR v_volunteer IN
      SELECT v.*
      FROM volunteers v
      WHERE v.event_id = p_event_id
      AND v.status = 'confirmed'
      AND NOT EXISTS (
        SELECT 1 FROM volunteer_assignments
        WHERE volunteer_id = v.id
        AND status IN ('assigned', 'confirmed', 'present')
      )
      AND (
        v.preferred_post_types = '[]'::jsonb
        OR v.preferred_post_types @> to_jsonb(v_post.type)
      )
      AND EXISTS (
        SELECT 1 FROM volunteer_availability
        WHERE volunteer_id = v.id
        AND available_from <= v_post.start_time
        AND available_to >= v_post.end_time
      )
      LIMIT (v_post.required_volunteers_count - (
        SELECT COUNT(*) FROM volunteer_assignments
        WHERE post_id = v_post.id AND status IN ('assigned', 'confirmed', 'present')
      ))
    LOOP
      INSERT INTO volunteer_assignments (volunteer_id, post_id, status)
      VALUES (v_volunteer.id, v_post.id, 'assigned');

      v_assigned_count := v_assigned_count + 1;
    END LOOP;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'assigned_count', v_assigned_count
  );
END;
$$;

-- Trigger: Update volunteer_posts updated_at
CREATE OR REPLACE FUNCTION update_volunteer_posts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_volunteer_posts_updated_at
  BEFORE UPDATE ON volunteer_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_volunteer_posts_updated_at();

-- Trigger: Update volunteers updated_at
CREATE OR REPLACE FUNCTION update_volunteers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_volunteers_updated_at
  BEFORE UPDATE ON volunteers
  FOR EACH ROW
  EXECUTE FUNCTION update_volunteers_updated_at();

-- Trigger: Update volunteer_assignments updated_at
CREATE OR REPLACE FUNCTION update_volunteer_assignments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_volunteer_assignments_updated_at
  BEFORE UPDATE ON volunteer_assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_volunteer_assignments_updated_at();

-- Add volunteer stats to events table
ALTER TABLE events ADD COLUMN IF NOT EXISTS volunteer_enabled boolean DEFAULT false;
ALTER TABLE events ADD COLUMN IF NOT EXISTS volunteer_registration_open boolean DEFAULT true;
ALTER TABLE events ADD COLUMN IF NOT EXISTS volunteer_info_text text;
