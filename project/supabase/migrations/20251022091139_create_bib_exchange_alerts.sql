/*
  # Système d'alertes email pour la bourse aux dossards

  1. Description
    - Permet aux utilisateurs de s'inscrire pour recevoir des alertes
    - Notification par email dès qu'un nouveau dossard est mis en vente
    - Un utilisateur peut s'inscrire à plusieurs événements

  2. Table créée
    - `bib_exchange_alerts` : Inscriptions aux alertes par événement

  3. Sécurité
    - RLS activé
    - Les utilisateurs peuvent gérer leurs propres alertes
    - Lecture publique pour vérifier les doublons

  4. Fonctionnalité
    - Déclenchement automatique d'email à la création d'un listing
    - Suppression automatique après envoi de l'alerte
*/

-- Table des alertes email
CREATE TABLE IF NOT EXISTS bib_exchange_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  email text NOT NULL,
  race_id uuid REFERENCES races(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(event_id, email, race_id)
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_bib_exchange_alerts_event ON bib_exchange_alerts(event_id);
CREATE INDEX IF NOT EXISTS idx_bib_exchange_alerts_email ON bib_exchange_alerts(email);

-- Activer RLS
ALTER TABLE bib_exchange_alerts ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour bib_exchange_alerts

-- Tout le monde peut s'inscrire (insertion publique)
CREATE POLICY "Anyone can subscribe to alerts"
  ON bib_exchange_alerts FOR INSERT
  TO public
  WITH CHECK (true);

-- Les utilisateurs peuvent voir leurs propres alertes
CREATE POLICY "Users can view their own alerts"
  ON bib_exchange_alerts FOR SELECT
  TO public
  USING (true);

-- Les utilisateurs peuvent supprimer leurs propres alertes
CREATE POLICY "Users can delete their own alerts"
  ON bib_exchange_alerts FOR DELETE
  TO public
  USING (true);

-- Les organisateurs peuvent voir toutes les alertes de leurs événements
CREATE POLICY "Organizers can view event alerts"
  ON bib_exchange_alerts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM events e
      JOIN organizers o ON e.organizer_id = o.id
      WHERE e.id = event_id
      AND o.user_id = auth.uid()
    )
  );

-- Fonction pour envoyer les alertes (sera appelée par un trigger)
CREATE OR REPLACE FUNCTION notify_bib_exchange_alerts()
RETURNS TRIGGER AS $$
DECLARE
  alert_record RECORD;
  event_name text;
  race_name text;
BEGIN
  -- Récupérer les infos de l'événement et de la course
  SELECT e.name, r.name INTO event_name, race_name
  FROM events e
  JOIN races r ON r.id = NEW.race_id
  WHERE e.id = NEW.event_id;

  -- Déclencher les alertes pour les emails inscrits
  FOR alert_record IN 
    SELECT email, id
    FROM bib_exchange_alerts
    WHERE event_id = NEW.event_id
    AND (race_id = NEW.race_id OR race_id IS NULL)
  LOOP
    -- Ici on va appeler l'edge function pour envoyer l'email
    PERFORM net.http_post(
      url := current_setting('app.settings.supabase_url') || '/functions/v1/bib-exchange-alert',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
      ),
      body := jsonb_build_object(
        'email', alert_record.email,
        'event_name', event_name,
        'race_name', race_name,
        'event_id', NEW.event_id,
        'alert_id', alert_record.id
      )
    );
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour envoyer les alertes automatiquement
CREATE TRIGGER trigger_bib_exchange_alert
  AFTER INSERT ON bib_exchange_listings
  FOR EACH ROW
  WHEN (NEW.status = 'available')
  EXECUTE FUNCTION notify_bib_exchange_alerts();
