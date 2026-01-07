/*
  # Système de validation conditionnelle pour les décharges

  1. Modifications de waiver_checkboxes
    - Ajouter `field_type` : type de champ (checkbox, radio, yes_no)
    - Ajouter `expected_value` : valeur attendue pour valider
    - Ajouter `is_blocking` : bloque l'inscription si réponse incorrecte
    - Ajouter `blocking_message` : message affiché si bloqué
    - Ajouter `allow_drag_drop` : permettre le réordonnancement
    
  2. Nouveaux types
    - Type ENUM pour field_type
    
  3. Exemples d'utilisation
    - Question : "Avez-vous subi une opération dans les 3 derniers mois ?"
    - Type : yes_no
    - Valeur attendue : "non"
    - Bloquant : true
    - Message : "Une autorisation médicale est requise pour participer"
*/

-- Créer le type ENUM pour les types de champs
DO $$ BEGIN
  CREATE TYPE waiver_field_type AS ENUM ('checkbox', 'radio', 'yes_no', 'text');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Ajouter les nouvelles colonnes à waiver_checkboxes
ALTER TABLE waiver_checkboxes 
  ADD COLUMN IF NOT EXISTS field_type waiver_field_type DEFAULT 'checkbox',
  ADD COLUMN IF NOT EXISTS expected_value text,
  ADD COLUMN IF NOT EXISTS is_blocking boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS blocking_message text,
  ADD COLUMN IF NOT EXISTS help_text text;

-- Ajouter un commentaire pour documenter les colonnes
COMMENT ON COLUMN waiver_checkboxes.field_type IS 'Type de champ : checkbox (case à cocher), yes_no (Oui/Non), radio (choix unique), text (texte libre)';
COMMENT ON COLUMN waiver_checkboxes.expected_value IS 'Valeur attendue pour valider (ex: "non", "oui", "accepte"). Si null, toute réponse est acceptée.';
COMMENT ON COLUMN waiver_checkboxes.is_blocking IS 'Si true, bloque l''inscription si la réponse ne correspond pas à expected_value';
COMMENT ON COLUMN waiver_checkboxes.blocking_message IS 'Message affiché à l''utilisateur si la réponse bloque l''inscription';
COMMENT ON COLUMN waiver_checkboxes.help_text IS 'Texte d''aide affiché sous le champ';

-- Créer une table pour stocker les réponses aux décharges
CREATE TABLE IF NOT EXISTS waiver_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id uuid REFERENCES entries(id) ON DELETE CASCADE,
  waiver_checkbox_id uuid REFERENCES waiver_checkboxes(id) ON DELETE CASCADE,
  response_value text NOT NULL,
  is_valid boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(entry_id, waiver_checkbox_id)
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_waiver_responses_entry_id ON waiver_responses(entry_id);
CREATE INDEX IF NOT EXISTS idx_waiver_responses_checkbox_id ON waiver_responses(waiver_checkbox_id);

-- RLS pour waiver_responses
ALTER TABLE waiver_responses ENABLE ROW LEVEL SECURITY;

-- Les organisateurs peuvent voir les réponses de leurs événements
CREATE POLICY "Organizers can view responses for their events"
  ON waiver_responses FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM entries e
      JOIN races r ON e.race_id = r.id
      JOIN events ev ON r.event_id = ev.id
      WHERE e.id = entry_id
      AND (
        ev.organizer_id IN (
          SELECT id FROM organizers WHERE user_id = auth.uid()
        )
        OR EXISTS (
          SELECT 1 FROM admin_users WHERE user_id = auth.uid()
        )
      )
    )
  );

-- Les participants peuvent créer leurs réponses lors de l'inscription
CREATE POLICY "Anyone can insert responses during registration"
  ON waiver_responses FOR INSERT
  TO public
  WITH CHECK (true);

-- Les participants peuvent voir leurs propres réponses
CREATE POLICY "Athletes can view their own responses"
  ON waiver_responses FOR SELECT
  TO public
  USING (true);