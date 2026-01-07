/*
  # Système de gestion des fédérations non-FFA

  1. Modifications des tables existantes
    - Ajout de colonnes à `federations` pour les décharges
    - Ajout de colonnes à `events` pour federation_id et discipline_id
    - Ajout de colonnes à `races` pour requires_liability_waiver
    - Ajout de colonnes à `entries` pour décharges et signatures

  2. Nouvelles tables
    - `sport_icons` - Pictogrammes pour identifier les sports
    - `disciplines` - Disciplines sportives avec leur sport parent
    - `liability_waivers` - Décharges de responsabilité uploadées par les athlètes
    - `registration_rejections` - Historique des rejets d'inscription avec raisons

  3. Sécurité
    - RLS activé sur toutes les tables
    - Les athlètes peuvent uploader leurs propres décharges
    - Les organisateurs peuvent valider/rejeter les documents
    - Les admins ont un accès complet
*/

-- =====================================================================
-- MODIFICATIONS: federations table (ajout de colonnes)
-- =====================================================================

ALTER TABLE federations
ADD COLUMN IF NOT EXISTS requires_license boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS requires_liability_waiver boolean DEFAULT true;

COMMENT ON COLUMN federations.requires_license IS 'Si true, une licence est requise pour cette fédération';
COMMENT ON COLUMN federations.requires_liability_waiver IS 'Si true, une décharge de responsabilité est requise';

-- Mettre à jour les fédérations existantes
UPDATE federations SET requires_license = true, requires_liability_waiver = false WHERE code = 'FFA';
UPDATE federations SET requires_license = false, requires_liability_waiver = true WHERE code IN ('UFOLEP', 'UGSEL', 'UNSS', 'FFSPT', 'FSCF', 'FFH', 'AUTRE');

-- =====================================================================
-- TABLE: sport_icons
-- =====================================================================

CREATE TABLE IF NOT EXISTS sport_icons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  icon_url text NOT NULL,
  category text NOT NULL,
  display_order integer DEFAULT 0,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE sport_icons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sport_icons_public_read"
  ON sport_icons FOR SELECT
  TO public
  USING (active = true);

CREATE POLICY "sport_icons_admin_all"
  ON sport_icons FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE INDEX IF NOT EXISTS idx_sport_icons_category ON sport_icons(category);
CREATE INDEX IF NOT EXISTS idx_sport_icons_slug ON sport_icons(slug);

COMMENT ON TABLE sport_icons IS 'Pictogrammes pour identifier visuellement les sports';

-- =====================================================================
-- TABLE: disciplines
-- =====================================================================

CREATE TABLE IF NOT EXISTS disciplines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  sport_icon_id uuid REFERENCES sport_icons(id) ON DELETE SET NULL,
  description text,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE disciplines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "disciplines_public_read"
  ON disciplines FOR SELECT
  TO public
  USING (active = true);

CREATE POLICY "disciplines_admin_all"
  ON disciplines FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE INDEX IF NOT EXISTS idx_disciplines_sport_icon ON disciplines(sport_icon_id);
CREATE INDEX IF NOT EXISTS idx_disciplines_slug ON disciplines(slug);

COMMENT ON TABLE disciplines IS 'Disciplines sportives avec leur sport parent';

-- =====================================================================
-- TABLE: liability_waivers
-- =====================================================================

CREATE TABLE IF NOT EXISTS liability_waivers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id uuid REFERENCES athletes(id) ON DELETE CASCADE NOT NULL,
  entry_id uuid REFERENCES entries(id) ON DELETE CASCADE,
  file_url text NOT NULL,
  file_name text NOT NULL,
  file_size integer,
  mime_type text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_reason text,
  validated_by uuid REFERENCES auth.users(id),
  validated_at timestamptz,
  uploaded_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE liability_waivers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "athletes_view_own_waivers"
  ON liability_waivers FOR SELECT
  TO authenticated
  USING (
    athlete_id IN (
      SELECT id FROM athletes WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "athletes_upload_own_waivers"
  ON liability_waivers FOR INSERT
  TO authenticated
  WITH CHECK (
    athlete_id IN (
      SELECT id FROM athletes WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "organizers_view_event_waivers"
  ON liability_waivers FOR SELECT
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

CREATE POLICY "organizers_validate_event_waivers"
  ON liability_waivers FOR UPDATE
  TO authenticated
  USING (
    entry_id IN (
      SELECT e.id FROM entries e
      JOIN races r ON r.id = e.race_id
      JOIN events ev ON ev.id = r.event_id
      JOIN organizers o ON o.id = ev.organizer_id
      WHERE o.user_id = auth.uid()
    )
  )
  WITH CHECK (
    entry_id IN (
      SELECT e.id FROM entries e
      JOIN races r ON r.id = e.race_id
      JOIN events ev ON ev.id = r.event_id
      JOIN organizers o ON o.id = ev.organizer_id
      WHERE o.user_id = auth.uid()
    )
  );

CREATE POLICY "admins_view_all_waivers"
  ON liability_waivers FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "admins_manage_all_waivers"
  ON liability_waivers FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE INDEX IF NOT EXISTS idx_liability_waivers_athlete ON liability_waivers(athlete_id);
CREATE INDEX IF NOT EXISTS idx_liability_waivers_entry ON liability_waivers(entry_id);
CREATE INDEX IF NOT EXISTS idx_liability_waivers_status ON liability_waivers(status);

COMMENT ON TABLE liability_waivers IS 'Décharges de responsabilité uploadées par les athlètes';

-- =====================================================================
-- TABLE: registration_rejections
-- =====================================================================

CREATE TABLE IF NOT EXISTS registration_rejections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id uuid REFERENCES entries(id) ON DELETE CASCADE NOT NULL,
  rejected_by uuid REFERENCES auth.users(id) NOT NULL,
  reason text NOT NULL,
  requires_new_waiver boolean DEFAULT true,
  notification_sent boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE registration_rejections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "athletes_view_own_rejections"
  ON registration_rejections FOR SELECT
  TO authenticated
  USING (
    entry_id IN (
      SELECT e.id FROM entries e
      JOIN athletes a ON a.id = e.athlete_id
      WHERE a.user_id = auth.uid()
    )
  );

CREATE POLICY "organizers_create_rejections"
  ON registration_rejections FOR INSERT
  TO authenticated
  WITH CHECK (
    entry_id IN (
      SELECT e.id FROM entries e
      JOIN races r ON r.id = e.race_id
      JOIN events ev ON ev.id = r.event_id
      JOIN organizers o ON o.id = ev.organizer_id
      WHERE o.user_id = auth.uid()
    )
  );

CREATE POLICY "organizers_view_rejections"
  ON registration_rejections FOR SELECT
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

CREATE POLICY "admins_manage_all_rejections"
  ON registration_rejections FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE INDEX IF NOT EXISTS idx_registration_rejections_entry ON registration_rejections(entry_id);
CREATE INDEX IF NOT EXISTS idx_registration_rejections_rejected_by ON registration_rejections(rejected_by);

COMMENT ON TABLE registration_rejections IS 'Historique des rejets d''inscription avec raisons';

-- =====================================================================
-- MODIFICATIONS: events table
-- =====================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'federation_id'
  ) THEN
    ALTER TABLE events ADD COLUMN federation_id uuid REFERENCES federations(id) ON DELETE SET NULL;
    CREATE INDEX idx_events_federation ON events(federation_id);
    COMMENT ON COLUMN events.federation_id IS 'Fédération de rattachement de l''événement (FFA, UFOLEP, etc.)';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'discipline_id'
  ) THEN
    ALTER TABLE events ADD COLUMN discipline_id uuid REFERENCES disciplines(id) ON DELETE SET NULL;
    CREATE INDEX idx_events_discipline ON events(discipline_id);
    COMMENT ON COLUMN events.discipline_id IS 'Discipline sportive principale de l''événement';
  END IF;
END $$;

-- =====================================================================
-- MODIFICATIONS: races table
-- =====================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'races' AND column_name = 'requires_liability_waiver'
  ) THEN
    ALTER TABLE races ADD COLUMN requires_liability_waiver boolean DEFAULT false;
    COMMENT ON COLUMN races.requires_liability_waiver IS 'Si true, les participants doivent uploader une décharge de responsabilité';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'races' AND column_name = 'waiver_template_url'
  ) THEN
    ALTER TABLE races ADD COLUMN waiver_template_url text;
    COMMENT ON COLUMN races.waiver_template_url IS 'URL du modèle de décharge à télécharger (optionnel)';
  END IF;
END $$;

-- =====================================================================
-- MODIFICATIONS: entries table
-- =====================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'entries' AND column_name = 'liability_waiver_id'
  ) THEN
    ALTER TABLE entries ADD COLUMN liability_waiver_id uuid REFERENCES liability_waivers(id) ON DELETE SET NULL;
    CREATE INDEX idx_entries_liability_waiver ON entries(liability_waiver_id);
    COMMENT ON COLUMN entries.liability_waiver_id IS 'Référence vers la décharge de responsabilité uploadée';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'entries' AND column_name = 'waiver_accepted'
  ) THEN
    ALTER TABLE entries ADD COLUMN waiver_accepted boolean DEFAULT false;
    COMMENT ON COLUMN entries.waiver_accepted IS 'L''athlète a coché la case d''acceptation de la décharge';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'entries' AND column_name = 'waiver_accepted_at'
  ) THEN
    ALTER TABLE entries ADD COLUMN waiver_accepted_at timestamptz;
    COMMENT ON COLUMN entries.waiver_accepted_at IS 'Date et heure d''acceptation de la décharge';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'entries' AND column_name = 'signature_data'
  ) THEN
    ALTER TABLE entries ADD COLUMN signature_data text;
    COMMENT ON COLUMN entries.signature_data IS 'Données de la signature manuelle (base64 ou JSON)';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'entries' AND column_name = 'signature_ip'
  ) THEN
    ALTER TABLE entries ADD COLUMN signature_ip text;
    COMMENT ON COLUMN entries.signature_ip IS 'Adresse IP lors de la signature';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'entries' AND column_name = 'signature_user_agent'
  ) THEN
    ALTER TABLE entries ADD COLUMN signature_user_agent text;
    COMMENT ON COLUMN entries.signature_user_agent IS 'User agent lors de la signature';
  END IF;
END $$;

-- =====================================================================
-- SEED DATA: sport_icons
-- =====================================================================

INSERT INTO sport_icons (name, slug, icon_url, category, display_order)
VALUES
  ('Course à pied', 'running', '/icons/sports/running.svg', 'running', 1),
  ('Trail', 'trail', '/icons/sports/trail.svg', 'running', 2),
  ('Marathon', 'marathon', '/icons/sports/marathon.svg', 'running', 3),
  ('Course d''obstacles', 'obstacle-race', '/icons/sports/obstacle.svg', 'running', 4),
  ('Cyclisme', 'cycling', '/icons/sports/cycling.svg', 'cycling', 5),
  ('VTT', 'mtb', '/icons/sports/mtb.svg', 'cycling', 6),
  ('Cyclisme sur route', 'road-cycling', '/icons/sports/road-cycling.svg', 'cycling', 7),
  ('Natation', 'swimming', '/icons/sports/swimming.svg', 'swimming', 8),
  ('Natation en eau libre', 'open-water', '/icons/sports/open-water.svg', 'swimming', 9),
  ('Triathlon', 'triathlon', '/icons/sports/triathlon.svg', 'triathlon', 10),
  ('Duathlon', 'duathlon', '/icons/sports/duathlon.svg', 'triathlon', 11),
  ('Aquathlon', 'aquathlon', '/icons/sports/aquathlon.svg', 'triathlon', 12),
  ('Swimrun', 'swimrun', '/icons/sports/swimrun.svg', 'triathlon', 13),
  ('Football', 'football', '/icons/sports/football.svg', 'team_sports', 14),
  ('Basketball', 'basketball', '/icons/sports/basketball.svg', 'team_sports', 15),
  ('Volleyball', 'volleyball', '/icons/sports/volleyball.svg', 'team_sports', 16),
  ('Handball', 'handball', '/icons/sports/handball.svg', 'team_sports', 17),
  ('Rugby', 'rugby', '/icons/sports/rugby.svg', 'team_sports', 18),
  ('Randonnée', 'hiking', '/icons/sports/hiking.svg', 'other', 19),
  ('Marche nordique', 'nordic-walking', '/icons/sports/nordic-walking.svg', 'other', 20),
  ('Relais/Ekiden', 'relay', '/icons/sports/relay.svg', 'running', 21),
  ('Autre', 'other', '/icons/sports/other.svg', 'other', 99)
ON CONFLICT (slug) DO NOTHING;

-- =====================================================================
-- SEED DATA: disciplines
-- =====================================================================

INSERT INTO disciplines (name, slug, sport_icon_id)
SELECT 'Course sur route', 'route-running', id FROM sport_icons WHERE slug = 'running'
UNION ALL
SELECT 'Trail', 'trail', id FROM sport_icons WHERE slug = 'trail'
UNION ALL
SELECT 'Marathon', 'marathon', id FROM sport_icons WHERE slug = 'marathon'
UNION ALL
SELECT 'Semi-marathon', 'half-marathon', id FROM sport_icons WHERE slug = 'marathon'
UNION ALL
SELECT '10 km', '10k', id FROM sport_icons WHERE slug = 'running'
UNION ALL
SELECT '5 km', '5k', id FROM sport_icons WHERE slug = 'running'
UNION ALL
SELECT 'Course d''obstacles', 'obstacle-race', id FROM sport_icons WHERE slug = 'obstacle-race'
UNION ALL
SELECT 'Cyclisme sur route', 'road-cycling', id FROM sport_icons WHERE slug = 'road-cycling'
UNION ALL
SELECT 'VTT', 'mtb', id FROM sport_icons WHERE slug = 'mtb'
UNION ALL
SELECT 'Cyclosportive', 'cyclosportive', id FROM sport_icons WHERE slug = 'cycling'
UNION ALL
SELECT 'Natation en piscine', 'pool-swimming', id FROM sport_icons WHERE slug = 'swimming'
UNION ALL
SELECT 'Natation en eau libre', 'open-water-swimming', id FROM sport_icons WHERE slug = 'open-water'
UNION ALL
SELECT 'Triathlon Sprint', 'triathlon-sprint', id FROM sport_icons WHERE slug = 'triathlon'
UNION ALL
SELECT 'Triathlon Olympique', 'triathlon-olympic', id FROM sport_icons WHERE slug = 'triathlon'
UNION ALL
SELECT 'Triathlon Longue Distance', 'triathlon-long', id FROM sport_icons WHERE slug = 'triathlon'
UNION ALL
SELECT 'Duathlon', 'duathlon', id FROM sport_icons WHERE slug = 'duathlon'
UNION ALL
SELECT 'Aquathlon', 'aquathlon', id FROM sport_icons WHERE slug = 'aquathlon'
UNION ALL
SELECT 'Swimrun', 'swimrun', id FROM sport_icons WHERE slug = 'swimrun'
UNION ALL
SELECT 'Randonnée pédestre', 'hiking', id FROM sport_icons WHERE slug = 'hiking'
UNION ALL
SELECT 'Marche nordique', 'nordic-walking', id FROM sport_icons WHERE slug = 'nordic-walking'
UNION ALL
SELECT 'Relais', 'relay', id FROM sport_icons WHERE slug = 'relay'
UNION ALL
SELECT 'Ekiden', 'ekiden', id FROM sport_icons WHERE slug = 'relay'
ON CONFLICT (slug) DO NOTHING;

-- =====================================================================
-- FUNCTION: notify_athlete_of_rejection
-- =====================================================================

CREATE OR REPLACE FUNCTION notify_athlete_of_rejection()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_athlete_email text;
  v_athlete_name text;
  v_event_name text;
  v_race_name text;
BEGIN
  SELECT
    a.email,
    a.first_name || ' ' || a.last_name,
    ev.name,
    r.name
  INTO v_athlete_email, v_athlete_name, v_event_name, v_race_name
  FROM entries e
  JOIN athletes a ON a.id = e.athlete_id
  JOIN races r ON r.id = e.race_id
  JOIN events ev ON ev.id = r.event_id
  WHERE e.id = NEW.entry_id;

  NEW.notification_sent := false;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_notify_rejection ON registration_rejections;

CREATE TRIGGER trigger_notify_rejection
  BEFORE INSERT ON registration_rejections
  FOR EACH ROW
  EXECUTE FUNCTION notify_athlete_of_rejection();

COMMENT ON FUNCTION notify_athlete_of_rejection IS 'Prépare la notification de rejet à envoyer à l''athlète';
