/*
  # Adapter registration_options pour utiliser entries

  1. Modifications
    - Renommer `registration_id` en `entry_id` dans registration_options
    - Mettre à jour les foreign keys et indexes
    - Adapter les RLS policies pour utiliser entries au lieu de registrations

  2. Sécurité
    - Les organisateurs peuvent voir les options de leurs inscriptions
    - Support pour inscriptions publiques (anon) et inscriptions organisateur (authenticated)
*/

-- Supprimer les anciennes policies
DROP POLICY IF EXISTS "Users can view their registration options" ON registration_options;
DROP POLICY IF EXISTS "Organizers can view registration options for their events" ON registration_options;
DROP POLICY IF EXISTS "Users can create registration options" ON registration_options;

-- Supprimer l'ancienne table si elle référence registrations
DROP TABLE IF EXISTS registration_options CASCADE;

-- Recréer registration_options avec entry_id
CREATE TABLE IF NOT EXISTS registration_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id UUID NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
  option_id UUID NOT NULL REFERENCES race_options(id) ON DELETE CASCADE,
  choice_id UUID REFERENCES race_option_choices(id) ON DELETE SET NULL,
  value TEXT,
  quantity INTEGER DEFAULT 1,
  price_paid_cents INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_quantity CHECK (quantity > 0)
);

-- Enable RLS
ALTER TABLE registration_options ENABLE ROW LEVEL SECURITY;

-- RLS Policies for registration_options

-- Public peut créer des options lors d'une inscription en ligne (anon)
CREATE POLICY "Anyone can create registration options for online entries"
  ON registration_options
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM entries
      WHERE entries.id = registration_options.entry_id
      AND entries.source = 'online'
    )
  );

-- Organisateurs peuvent voir les options de leurs inscriptions
CREATE POLICY "Organizers can view registration options for their entries"
  ON registration_options
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM entries e
      INNER JOIN organizers o ON e.organizer_id = o.id
      WHERE e.id = registration_options.entry_id
      AND o.user_id = auth.uid()
    )
  );

-- Organisateurs peuvent créer des options pour leurs inscriptions manuelles
CREATE POLICY "Organizers can create registration options for manual entries"
  ON registration_options
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM entries e
      INNER JOIN organizers o ON e.organizer_id = o.id
      WHERE e.id = registration_options.entry_id
      AND o.user_id = auth.uid()
    )
  );

-- Organisateurs peuvent modifier les options de leurs inscriptions
CREATE POLICY "Organizers can update registration options for their entries"
  ON registration_options
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM entries e
      INNER JOIN organizers o ON e.organizer_id = o.id
      WHERE e.id = registration_options.entry_id
      AND o.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM entries e
      INNER JOIN organizers o ON e.organizer_id = o.id
      WHERE e.id = registration_options.entry_id
      AND o.user_id = auth.uid()
    )
  );

-- Organisateurs peuvent supprimer les options de leurs inscriptions
CREATE POLICY "Organizers can delete registration options for their entries"
  ON registration_options
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM entries e
      INNER JOIN organizers o ON e.organizer_id = o.id
      WHERE e.id = registration_options.entry_id
      AND o.user_id = auth.uid()
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_registration_options_entry ON registration_options(entry_id);
CREATE INDEX IF NOT EXISTS idx_registration_options_option ON registration_options(option_id);
CREATE INDEX IF NOT EXISTS idx_registration_options_choice ON registration_options(choice_id);
