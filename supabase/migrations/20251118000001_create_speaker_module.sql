/*
  # Module Speaker - Timepulse

  ## Description
  Module permettant aux speakers/commentateurs d'événements sportifs d'accéder
  aux données des participants pour préparer leurs commentaires en direct.

  ## 1. Nouvelles Tables

  ### `speaker_access`
  Configuration d'accès speaker pour un événement
  - `id` (uuid, PK)
  - `event_id` (uuid, FK -> events)
  - `organizer_id` (uuid, FK -> organizers)
  - `is_enabled` (boolean) - Module activé ou non
  - `access_code` (text) - Code de connexion unique (8 caractères alphanumériques)
  - `speaker_name` (text) - Nom du speaker
  - `speaker_email` (text) - Email du speaker (optionnel)
  - `start_date` (timestamptz) - Date d'ouverture d'accès
  - `end_date` (timestamptz) - Date de fermeture d'accès
  - `show_reference_times` (boolean) - Afficher les temps de référence
  - `show_timepulse_index` (boolean) - Afficher l'indice Timepulse
  - `show_betrail_index` (boolean) - Afficher l'indice BetRAIL
  - `show_utmb_index` (boolean) - Afficher l'indice UTMB
  - `show_history` (boolean) - Afficher l'historique des classements
  - `show_statistics` (boolean) - Afficher les statistiques
  - `custom_notes` (text) - Notes personnalisées de l'organisateur pour le speaker
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### `speaker_favorites`
  Athlètes marqués en favoris par le speaker
  - `id` (uuid, PK)
  - `speaker_access_id` (uuid, FK -> speaker_access)
  - `entry_id` (uuid, FK -> entries)
  - `race_id` (uuid, FK -> races)
  - `athlete_id` (uuid, FK -> athletes, nullable)
  - `notes` (text) - Notes personnelles du speaker sur l'athlète
  - `priority` (integer) - Ordre de priorité (1 = haute, 2 = moyenne, 3 = basse)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### `speaker_lists`
  Listes personnalisées créées par le speaker
  - `id` (uuid, PK)
  - `speaker_access_id` (uuid, FK -> speaker_access)
  - `race_id` (uuid, FK -> races, nullable) - Si null, liste multi-courses
  - `name` (text) - Nom de la liste
  - `description` (text) - Description de la liste
  - `color` (text) - Couleur d'identification
  - `order_index` (integer) - Ordre d'affichage
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### `speaker_list_entries`
  Athlètes dans les listes du speaker
  - `id` (uuid, PK)
  - `list_id` (uuid, FK -> speaker_lists)
  - `entry_id` (uuid, FK -> entries)
  - `order_index` (integer) - Ordre dans la liste
  - `created_at` (timestamptz)

  ### `speaker_sponsors`
  Sponsors de l'événement à mentionner
  - `id` (uuid, PK)
  - `event_id` (uuid, FK -> events)
  - `organizer_id` (uuid, FK -> organizers)
  - `name` (text) - Nom du sponsor
  - `category` (text) - Catégorie (Titre, Or, Argent, Bronze, Partenaire)
  - `logo_url` (text) - URL du logo
  - `description` (text) - Description/message à mentionner
  - `mention_frequency` (text) - Fréquence de mention (Haute, Moyenne, Basse)
  - `keywords` (text[]) - Mots-clés pour rappel automatique
  - `website` (text)
  - `order_index` (integer)
  - `is_active` (boolean)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### `speaker_activity_log`
  Journal d'activité du speaker
  - `id` (uuid, PK)
  - `speaker_access_id` (uuid, FK -> speaker_access)
  - `action` (text) - Type d'action effectuée
  - `details` (jsonb) - Détails de l'action
  - `created_at` (timestamptz)

  ## 2. Sécurité
  - RLS activé sur toutes les tables
  - Accès speaker via code uniquement
  - Organisateur a accès complet à ses données speaker
  - Logs d'activité pour traçabilité

  ## 3. Fonctionnalités
  - Authentification par code unique
  - Gestion des favoris avec notes
  - Création de listes personnalisées
  - Export PDF des listes
  - Filtres avancés (sexe, catégorie, club, nationalité, indice)
  - Statistiques en temps réel
  - Gestion des sponsors à mentionner
*/

-- =====================================================
-- 1. TABLE: speaker_access
-- =====================================================
CREATE TABLE IF NOT EXISTS speaker_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  organizer_id uuid NOT NULL REFERENCES organizers(id) ON DELETE CASCADE,
  is_enabled boolean DEFAULT false,
  access_code text UNIQUE NOT NULL,
  speaker_name text NOT NULL,
  speaker_email text,
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  show_reference_times boolean DEFAULT true,
  show_timepulse_index boolean DEFAULT true,
  show_betrail_index boolean DEFAULT false,
  show_utmb_index boolean DEFAULT false,
  show_history boolean DEFAULT false,
  show_statistics boolean DEFAULT true,
  custom_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_dates CHECK (end_date > start_date),
  CONSTRAINT access_code_format CHECK (access_code ~ '^[A-Z0-9]{8}$')
);

-- Index pour recherche rapide par code
CREATE INDEX idx_speaker_access_code ON speaker_access(access_code);
CREATE INDEX idx_speaker_access_event ON speaker_access(event_id);
CREATE INDEX idx_speaker_access_organizer ON speaker_access(organizer_id);

-- RLS
ALTER TABLE speaker_access ENABLE ROW LEVEL SECURITY;

-- Organisateurs peuvent gérer leurs propres accès speaker
CREATE POLICY "Organizers can manage their speaker access"
  ON speaker_access FOR ALL
  TO authenticated
  USING (organizer_id IN (
    SELECT id FROM organizers WHERE user_id = auth.uid()
  ))
  WITH CHECK (organizer_id IN (
    SELECT id FROM organizers WHERE user_id = auth.uid()
  ));

-- Accès public pour authentification speaker (lecture seule du code)
CREATE POLICY "Public can verify speaker access code"
  ON speaker_access FOR SELECT
  TO public
  USING (is_enabled = true AND now() BETWEEN start_date AND end_date);

-- =====================================================
-- 2. TABLE: speaker_favorites
-- =====================================================
CREATE TABLE IF NOT EXISTS speaker_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  speaker_access_id uuid NOT NULL REFERENCES speaker_access(id) ON DELETE CASCADE,
  entry_id uuid NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
  race_id uuid NOT NULL REFERENCES races(id) ON DELETE CASCADE,
  athlete_id uuid REFERENCES athletes(id) ON DELETE SET NULL,
  notes text,
  priority integer DEFAULT 2 CHECK (priority BETWEEN 1 AND 3),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(speaker_access_id, entry_id)
);

CREATE INDEX idx_speaker_favorites_access ON speaker_favorites(speaker_access_id);
CREATE INDEX idx_speaker_favorites_entry ON speaker_favorites(entry_id);
CREATE INDEX idx_speaker_favorites_race ON speaker_favorites(race_id);
CREATE INDEX idx_speaker_favorites_priority ON speaker_favorites(priority);

ALTER TABLE speaker_favorites ENABLE ROW LEVEL SECURITY;

-- Speaker peut gérer ses favoris via l'access_code
CREATE POLICY "Speaker can manage own favorites"
  ON speaker_favorites FOR ALL
  TO public
  USING (
    speaker_access_id IN (
      SELECT id FROM speaker_access
      WHERE is_enabled = true
      AND now() BETWEEN start_date AND end_date
    )
  )
  WITH CHECK (
    speaker_access_id IN (
      SELECT id FROM speaker_access
      WHERE is_enabled = true
      AND now() BETWEEN start_date AND end_date
    )
  );

-- Organisateurs peuvent voir les favoris de leurs speakers
CREATE POLICY "Organizers can view speaker favorites"
  ON speaker_favorites FOR SELECT
  TO authenticated
  USING (
    speaker_access_id IN (
      SELECT id FROM speaker_access
      WHERE organizer_id IN (
        SELECT id FROM organizers WHERE user_id = auth.uid()
      )
    )
  );

-- =====================================================
-- 3. TABLE: speaker_lists
-- =====================================================
CREATE TABLE IF NOT EXISTS speaker_lists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  speaker_access_id uuid NOT NULL REFERENCES speaker_access(id) ON DELETE CASCADE,
  race_id uuid REFERENCES races(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  color text DEFAULT 'blue' CHECK (color IN ('blue', 'green', 'yellow', 'red', 'purple', 'pink', 'orange', 'teal')),
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_speaker_lists_access ON speaker_lists(speaker_access_id);
CREATE INDEX idx_speaker_lists_race ON speaker_lists(race_id);
CREATE INDEX idx_speaker_lists_order ON speaker_lists(order_index);

ALTER TABLE speaker_lists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Speaker can manage own lists"
  ON speaker_lists FOR ALL
  TO public
  USING (
    speaker_access_id IN (
      SELECT id FROM speaker_access
      WHERE is_enabled = true
      AND now() BETWEEN start_date AND end_date
    )
  )
  WITH CHECK (
    speaker_access_id IN (
      SELECT id FROM speaker_access
      WHERE is_enabled = true
      AND now() BETWEEN start_date AND end_date
    )
  );

CREATE POLICY "Organizers can view speaker lists"
  ON speaker_lists FOR SELECT
  TO authenticated
  USING (
    speaker_access_id IN (
      SELECT id FROM speaker_access
      WHERE organizer_id IN (
        SELECT id FROM organizers WHERE user_id = auth.uid()
      )
    )
  );

-- =====================================================
-- 4. TABLE: speaker_list_entries
-- =====================================================
CREATE TABLE IF NOT EXISTS speaker_list_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id uuid NOT NULL REFERENCES speaker_lists(id) ON DELETE CASCADE,
  entry_id uuid NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(list_id, entry_id)
);

CREATE INDEX idx_speaker_list_entries_list ON speaker_list_entries(list_id);
CREATE INDEX idx_speaker_list_entries_entry ON speaker_list_entries(entry_id);
CREATE INDEX idx_speaker_list_entries_order ON speaker_list_entries(order_index);

ALTER TABLE speaker_list_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Speaker can manage list entries"
  ON speaker_list_entries FOR ALL
  TO public
  USING (
    list_id IN (
      SELECT id FROM speaker_lists
      WHERE speaker_access_id IN (
        SELECT id FROM speaker_access
        WHERE is_enabled = true
        AND now() BETWEEN start_date AND end_date
      )
    )
  )
  WITH CHECK (
    list_id IN (
      SELECT id FROM speaker_lists
      WHERE speaker_access_id IN (
        SELECT id FROM speaker_access
        WHERE is_enabled = true
        AND now() BETWEEN start_date AND end_date
      )
    )
  );

-- =====================================================
-- 5. TABLE: speaker_sponsors
-- =====================================================
CREATE TABLE IF NOT EXISTS speaker_sponsors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  organizer_id uuid NOT NULL REFERENCES organizers(id) ON DELETE CASCADE,
  name text NOT NULL,
  category text DEFAULT 'Partenaire' CHECK (category IN ('Titre', 'Or', 'Argent', 'Bronze', 'Partenaire', 'Média', 'Institutionnel')),
  logo_url text,
  description text,
  mention_frequency text DEFAULT 'Moyenne' CHECK (mention_frequency IN ('Haute', 'Moyenne', 'Basse')),
  keywords text[] DEFAULT '{}',
  website text,
  order_index integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_speaker_sponsors_event ON speaker_sponsors(event_id);
CREATE INDEX idx_speaker_sponsors_organizer ON speaker_sponsors(organizer_id);
CREATE INDEX idx_speaker_sponsors_category ON speaker_sponsors(category);
CREATE INDEX idx_speaker_sponsors_order ON speaker_sponsors(order_index);

ALTER TABLE speaker_sponsors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organizers can manage their sponsors"
  ON speaker_sponsors FOR ALL
  TO authenticated
  USING (organizer_id IN (
    SELECT id FROM organizers WHERE user_id = auth.uid()
  ))
  WITH CHECK (organizer_id IN (
    SELECT id FROM organizers WHERE user_id = auth.uid()
  ));

CREATE POLICY "Public can view active sponsors for speaker access"
  ON speaker_sponsors FOR SELECT
  TO public
  USING (
    is_active = true
    AND event_id IN (
      SELECT event_id FROM speaker_access
      WHERE is_enabled = true
      AND now() BETWEEN start_date AND end_date
    )
  );

-- =====================================================
-- 6. TABLE: speaker_activity_log
-- =====================================================
CREATE TABLE IF NOT EXISTS speaker_activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  speaker_access_id uuid NOT NULL REFERENCES speaker_access(id) ON DELETE CASCADE,
  action text NOT NULL,
  details jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_speaker_activity_log_access ON speaker_activity_log(speaker_access_id);
CREATE INDEX idx_speaker_activity_log_created ON speaker_activity_log(created_at);

ALTER TABLE speaker_activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Speaker can create activity logs"
  ON speaker_activity_log FOR INSERT
  TO public
  WITH CHECK (
    speaker_access_id IN (
      SELECT id FROM speaker_access
      WHERE is_enabled = true
      AND now() BETWEEN start_date AND end_date
    )
  );

CREATE POLICY "Organizers can view speaker activity logs"
  ON speaker_activity_log FOR SELECT
  TO authenticated
  USING (
    speaker_access_id IN (
      SELECT id FROM speaker_access
      WHERE organizer_id IN (
        SELECT id FROM organizers WHERE user_id = auth.uid()
      )
    )
  );

-- =====================================================
-- 7. FONCTION: Générer un code d'accès unique
-- =====================================================
CREATE OR REPLACE FUNCTION generate_speaker_access_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_code text;
  code_exists boolean;
BEGIN
  LOOP
    -- Générer un code de 8 caractères alphanumériques majuscules
    new_code := upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 8));

    -- Vérifier si le code existe déjà
    SELECT EXISTS(SELECT 1 FROM speaker_access WHERE access_code = new_code) INTO code_exists;

    -- Si le code n'existe pas, le retourner
    IF NOT code_exists THEN
      RETURN new_code;
    END IF;
  END LOOP;
END;
$$;

-- =====================================================
-- 8. FONCTION: Logger l'activité du speaker
-- =====================================================
CREATE OR REPLACE FUNCTION log_speaker_activity(
  p_speaker_access_id uuid,
  p_action text,
  p_details jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO speaker_activity_log (speaker_access_id, action, details)
  VALUES (p_speaker_access_id, p_action, p_details);
END;
$$;

-- =====================================================
-- 9. FONCTION: Vérifier un code d'accès speaker
-- =====================================================
CREATE OR REPLACE FUNCTION verify_speaker_access_code(p_access_code text)
RETURNS TABLE (
  access_id uuid,
  event_id uuid,
  event_name text,
  speaker_name text,
  is_valid boolean,
  show_reference_times boolean,
  show_timepulse_index boolean,
  show_betrail_index boolean,
  show_utmb_index boolean,
  show_history boolean,
  show_statistics boolean,
  custom_notes text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    sa.id,
    sa.event_id,
    e.name,
    sa.speaker_name,
    (sa.is_enabled AND now() BETWEEN sa.start_date AND sa.end_date) as is_valid,
    sa.show_reference_times,
    sa.show_timepulse_index,
    sa.show_betrail_index,
    sa.show_utmb_index,
    sa.show_history,
    sa.show_statistics,
    sa.custom_notes
  FROM speaker_access sa
  JOIN events e ON e.id = sa.event_id
  WHERE sa.access_code = p_access_code;
END;
$$;

-- =====================================================
-- 10. TRIGGER: Update updated_at
-- =====================================================
CREATE OR REPLACE FUNCTION update_speaker_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_speaker_access_updated_at
  BEFORE UPDATE ON speaker_access
  FOR EACH ROW
  EXECUTE FUNCTION update_speaker_updated_at();

CREATE TRIGGER update_speaker_favorites_updated_at
  BEFORE UPDATE ON speaker_favorites
  FOR EACH ROW
  EXECUTE FUNCTION update_speaker_updated_at();

CREATE TRIGGER update_speaker_lists_updated_at
  BEFORE UPDATE ON speaker_lists
  FOR EACH ROW
  EXECUTE FUNCTION update_speaker_updated_at();

CREATE TRIGGER update_speaker_sponsors_updated_at
  BEFORE UPDATE ON speaker_sponsors
  FOR EACH ROW
  EXECUTE FUNCTION update_speaker_updated_at();

-- =====================================================
-- 11. COMMENTAIRES
-- =====================================================
COMMENT ON TABLE speaker_access IS 'Configuration d''accès speaker pour un événement';
COMMENT ON TABLE speaker_favorites IS 'Athlètes marqués en favoris par le speaker';
COMMENT ON TABLE speaker_lists IS 'Listes personnalisées créées par le speaker';
COMMENT ON TABLE speaker_list_entries IS 'Athlètes dans les listes du speaker';
COMMENT ON TABLE speaker_sponsors IS 'Sponsors de l''événement à mentionner';
COMMENT ON TABLE speaker_activity_log IS 'Journal d''activité du speaker';
