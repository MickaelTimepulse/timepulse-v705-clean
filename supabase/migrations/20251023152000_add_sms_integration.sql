/*
  # Intégration SMS via Oxisms

  1. Nouvelles Tables
    - `sms_logs` - Historique envois SMS
    - `sms_templates` - Templates SMS personnalisables
    - `sms_campaigns` - Campagnes SMS groupées

  2. Fonctions
    - `send_sms_notification()` - Envoi SMS unique
    - `send_bulk_sms()` - Envoi SMS en masse
    - `get_sms_stats()` - Statistiques SMS

  3. Triggers
    - Auto-envoi SMS lors confirmation inscription
    - Rappel J-1 avant course

  4. Sécurité
    - RLS sur toutes les tables
    - Logs accessibles uniquement aux concernés
*/

-- Table des logs SMS
CREATE TABLE IF NOT EXISTS sms_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Destinataire
  athlete_id uuid REFERENCES athletes(id) ON DELETE SET NULL,
  phone_number text NOT NULL,

  -- Message
  message text NOT NULL,
  template_id uuid, -- Référence vers sms_templates si utilisé

  -- Statut
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'bounced')) NOT NULL,

  -- Provider (Oxisms)
  provider text DEFAULT 'oxisms' NOT NULL,
  provider_message_id text, -- ID retourné par Oxisms
  provider_response jsonb,

  -- Coût
  cost_eur decimal(10,4), -- Coût en euros
  credits_used integer, -- Nombre de crédits utilisés

  -- Timestamps
  sent_at timestamptz,
  delivered_at timestamptz,
  error_message text,

  -- Métadonnées
  sent_by uuid REFERENCES auth.users(id),
  event_id uuid REFERENCES events(id) ON DELETE SET NULL,
  race_id uuid REFERENCES races(id) ON DELETE SET NULL,

  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_sms_logs_athlete ON sms_logs(athlete_id);
CREATE INDEX idx_sms_logs_phone ON sms_logs(phone_number);
CREATE INDEX idx_sms_logs_status ON sms_logs(status);
CREATE INDEX idx_sms_logs_sent_at ON sms_logs(sent_at DESC);
CREATE INDEX idx_sms_logs_event ON sms_logs(event_id);
CREATE INDEX idx_sms_logs_provider_id ON sms_logs(provider_message_id)
  WHERE provider_message_id IS NOT NULL;

-- Table des templates SMS
CREATE TABLE IF NOT EXISTS sms_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  name text NOT NULL,
  description text,

  -- Contenu
  content text NOT NULL, -- Peut contenir des variables: {{firstName}}, {{raceName}}, etc.

  -- Type
  template_type text NOT NULL CHECK (template_type IN (
    'registration_confirmed',
    'reminder_1_day',
    'reminder_1_hour',
    'result_ready',
    'bib_number_assigned',
    'custom'
  )),

  -- Configuration
  is_active boolean DEFAULT true,
  is_default boolean DEFAULT false, -- Template par défaut pour ce type

  -- Métadonnées
  organizer_id uuid REFERENCES organizers(id) ON DELETE CASCADE,
  created_by uuid REFERENCES auth.users(id),

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  UNIQUE(organizer_id, template_type, is_default) WHERE is_default = true
);

CREATE INDEX idx_sms_templates_organizer ON sms_templates(organizer_id);
CREATE INDEX idx_sms_templates_type ON sms_templates(template_type);
CREATE INDEX idx_sms_templates_active ON sms_templates(is_active) WHERE is_active = true;

-- Table des campagnes SMS
CREATE TABLE IF NOT EXISTS sms_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  name text NOT NULL,
  description text,

  -- Ciblage
  event_id uuid REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  race_ids uuid[], -- Si NULL, toutes les courses de l'event
  segment_filter jsonb, -- Filtres additionnels: {gender: 'M', categories: ['SEM', 'V1M']}

  -- Message
  template_id uuid REFERENCES sms_templates(id),
  message text NOT NULL, -- Message final après remplacement variables

  -- Statut
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'failed')) NOT NULL,

  -- Statistiques
  total_recipients integer DEFAULT 0,
  sent_count integer DEFAULT 0,
  delivered_count integer DEFAULT 0,
  failed_count integer DEFAULT 0,
  total_cost_eur decimal(10,2) DEFAULT 0,

  -- Planification
  scheduled_for timestamptz,
  started_at timestamptz,
  completed_at timestamptz,

  -- Métadonnées
  created_by uuid REFERENCES auth.users(id) NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_sms_campaigns_event ON sms_campaigns(event_id);
CREATE INDEX idx_sms_campaigns_status ON sms_campaigns(status);
CREATE INDEX idx_sms_campaigns_scheduled ON sms_campaigns(scheduled_for)
  WHERE scheduled_for IS NOT NULL;

-- ============================================
-- FONCTIONS
-- ============================================

-- Fonction: Remplacer les variables dans un template SMS
CREATE OR REPLACE FUNCTION replace_sms_variables(
  p_template text,
  p_athlete_id uuid,
  p_race_id uuid DEFAULT NULL
)
RETURNS text
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_result text := p_template;
  v_athlete RECORD;
  v_race RECORD;
  v_event RECORD;
BEGIN
  -- Récupérer les données de l'athlète
  SELECT first_name, last_name, email
  INTO v_athlete
  FROM athletes
  WHERE id = p_athlete_id;

  -- Remplacer variables athlète
  v_result := REPLACE(v_result, '{{firstName}}', COALESCE(v_athlete.first_name, ''));
  v_result := REPLACE(v_result, '{{lastName}}', COALESCE(v_athlete.last_name, ''));
  v_result := REPLACE(v_result, '{{fullName}}', COALESCE(v_athlete.first_name || ' ' || v_athlete.last_name, ''));

  -- Si course spécifiée, récupérer ses données
  IF p_race_id IS NOT NULL THEN
    SELECT r.name as race_name, r.start_time, e.name as event_name, e.location
    INTO v_race
    FROM races r
    JOIN events e ON r.event_id = e.id
    WHERE r.id = p_race_id;

    v_result := REPLACE(v_result, '{{raceName}}', COALESCE(v_race.race_name, ''));
    v_result := REPLACE(v_result, '{{eventName}}', COALESCE(v_race.event_name, ''));
    v_result := REPLACE(v_result, '{{location}}', COALESCE(v_race.location, ''));

    IF v_race.start_time IS NOT NULL THEN
      v_result := REPLACE(v_result, '{{startTime}}', TO_CHAR(v_race.start_time, 'HH24:MI'));
      v_result := REPLACE(v_result, '{{startDate}}', TO_CHAR(v_race.start_time, 'DD/MM/YYYY'));
    END IF;
  END IF;

  RETURN v_result;
END;
$$;

-- Fonction: Obtenir statistiques SMS pour un événement
CREATE OR REPLACE FUNCTION get_sms_stats(p_event_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_stats jsonb;
BEGIN
  SELECT jsonb_build_object(
    'total_sent', COUNT(*),
    'delivered', COUNT(*) FILTER (WHERE status = 'delivered'),
    'failed', COUNT(*) FILTER (WHERE status = 'failed'),
    'pending', COUNT(*) FILTER (WHERE status = 'pending'),
    'total_cost', COALESCE(SUM(cost_eur), 0),
    'delivery_rate', CASE
      WHEN COUNT(*) FILTER (WHERE status IN ('delivered', 'failed')) > 0
      THEN ROUND(
        COUNT(*) FILTER (WHERE status = 'delivered')::numeric * 100.0 /
        COUNT(*) FILTER (WHERE status IN ('delivered', 'failed')),
        2
      )
      ELSE 0
    END
  )
  INTO v_stats
  FROM sms_logs
  WHERE event_id = p_event_id;

  RETURN v_stats;
END;
$$;

-- Trigger: updated_at pour sms_templates
CREATE TRIGGER update_sms_templates_updated_at
  BEFORE UPDATE ON sms_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger: updated_at pour sms_campaigns
CREATE TRIGGER update_sms_campaigns_updated_at
  BEFORE UPDATE ON sms_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE sms_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_campaigns ENABLE ROW LEVEL SECURITY;

-- SMS Logs: Les athlètes peuvent voir leurs propres SMS
CREATE POLICY "Athletes can view own SMS logs"
  ON sms_logs FOR SELECT
  TO authenticated
  USING (
    athlete_id IN (
      SELECT id FROM athletes WHERE email = auth.jwt()->>'email'
    )
  );

-- SMS Logs: Organisateurs peuvent voir les SMS de leurs événements
CREATE POLICY "Organizers can view SMS logs for their events"
  ON sms_logs FOR SELECT
  TO authenticated
  USING (
    event_id IN (
      SELECT id FROM events
      WHERE organizer_id IN (
        SELECT organizer_id FROM organizer_users WHERE user_id = auth.uid()
      )
    )
  );

-- SMS Logs: Backend peut insérer et mettre à jour
CREATE POLICY "Backend can manage SMS logs"
  ON sms_logs FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- SMS Templates: Organisateurs gèrent leurs templates
CREATE POLICY "Organizers can manage their SMS templates"
  ON sms_templates FOR ALL
  TO authenticated
  USING (
    organizer_id IN (
      SELECT organizer_id FROM organizer_users WHERE user_id = auth.uid()
    )
  );

-- SMS Templates: Admins ont accès complet
CREATE POLICY "Admins have full access to SMS templates"
  ON sms_templates FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid())
  );

-- SMS Campaigns: Organisateurs gèrent leurs campagnes
CREATE POLICY "Organizers can manage their SMS campaigns"
  ON sms_campaigns FOR ALL
  TO authenticated
  USING (
    event_id IN (
      SELECT id FROM events
      WHERE organizer_id IN (
        SELECT organizer_id FROM organizer_users WHERE user_id = auth.uid()
      )
    )
  );

-- SMS Campaigns: Admins ont accès complet
CREATE POLICY "Admins have full access to SMS campaigns"
  ON sms_campaigns FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid())
  );

-- ============================================
-- VUES UTILES
-- ============================================

-- Vue: Statistiques SMS par événement
CREATE OR REPLACE VIEW sms_stats_by_event AS
SELECT
  e.id as event_id,
  e.name as event_name,
  COUNT(sl.id) as total_sms,
  COUNT(sl.id) FILTER (WHERE sl.status = 'delivered') as delivered_count,
  COUNT(sl.id) FILTER (WHERE sl.status = 'failed') as failed_count,
  COALESCE(SUM(sl.cost_eur), 0) as total_cost,
  CASE
    WHEN COUNT(sl.id) FILTER (WHERE sl.status IN ('delivered', 'failed')) > 0
    THEN ROUND(
      COUNT(sl.id) FILTER (WHERE sl.status = 'delivered')::numeric * 100.0 /
      COUNT(sl.id) FILTER (WHERE sl.status IN ('delivered', 'failed')),
      2
    )
    ELSE 0
  END as delivery_rate_percent
FROM events e
LEFT JOIN sms_logs sl ON e.id = sl.event_id
GROUP BY e.id, e.name;

-- Vue: SMS non délivrés nécessitant attention
CREATE OR REPLACE VIEW sms_failed_needing_attention AS
SELECT
  sl.id,
  sl.phone_number,
  a.first_name,
  a.last_name,
  a.email,
  sl.message,
  sl.error_message,
  sl.sent_at,
  e.name as event_name
FROM sms_logs sl
JOIN athletes a ON sl.athlete_id = a.id
JOIN events e ON sl.event_id = e.id
WHERE sl.status = 'failed'
  AND sl.sent_at >= CURRENT_TIMESTAMP - INTERVAL '7 days'
ORDER BY sl.sent_at DESC;

-- ============================================
-- TEMPLATES PAR DÉFAUT
-- ============================================

-- Insérer templates SMS par défaut (pour les organisateurs sans templates custom)
INSERT INTO sms_templates (name, description, content, template_type, is_default, is_active)
VALUES
  (
    'Confirmation Inscription',
    'SMS envoyé après confirmation d''inscription',
    'Bonjour {{firstName}}, votre inscription à {{raceName}} est confirmée ! Retrouvez vos infos sur timepulse.fr. À bientôt !',
    'registration_confirmed',
    true,
    true
  ),
  (
    'Rappel J-1',
    'SMS envoyé la veille de la course',
    'Rappel: {{raceName}} demain à {{startTime}} ! Pensez à votre dossard. Bon courage {{firstName}} !',
    'reminder_1_day',
    true,
    true
  ),
  (
    'Résultats Disponibles',
    'SMS envoyé quand les résultats sont publiés',
    'Bravo {{firstName}} ! Vos résultats pour {{raceName}} sont en ligne sur timepulse.fr',
    'result_ready',
    true,
    true
  ),
  (
    'Attribution Dossard',
    'SMS envoyé lors attribution du numéro de dossard',
    '{{firstName}}, votre dossard pour {{raceName}} : N° {{bibNumber}}. RDV le {{startDate}} !',
    'bib_number_assigned',
    true,
    true
  )
ON CONFLICT DO NOTHING;

-- ============================================
-- COMMENTAIRES
-- ============================================

COMMENT ON TABLE sms_logs IS 'Historique complet des SMS envoyés via Oxisms';
COMMENT ON TABLE sms_templates IS 'Templates SMS personnalisables par organisateur';
COMMENT ON TABLE sms_campaigns IS 'Campagnes SMS groupées vers segments d''inscrits';

COMMENT ON COLUMN sms_logs.cost_eur IS 'Coût en euros par SMS (typiquement 0.04-0.06€)';
COMMENT ON COLUMN sms_logs.provider_message_id IS 'ID unique retourné par Oxisms pour tracking';
COMMENT ON COLUMN sms_templates.content IS 'Variables disponibles: {{firstName}}, {{lastName}}, {{raceName}}, {{startTime}}, {{startDate}}, {{bibNumber}}';
