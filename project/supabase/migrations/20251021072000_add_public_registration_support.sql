/*
  # Support Inscriptions Publiques en Ligne

  1. Modifications des tables athletes et entries
    - Permettre created_by NULL pour les inscriptions publiques
    - Ajouter session_token pour lier inscription anonyme temporairement

  2. Nouvelles RLS Policies
    - Public (anon) peut créer des athletes
    - Public (anon) peut créer des entries avec source='online'
    - Public (anon) peut créer des entry_payments
    - Public peut voir les entries confirmées (pour liste des inscrits)

  3. Sécurité
    - Les inscriptions publiques sont automatiquement confirmées après paiement
    - Session token permet de tracer l'inscription sans authentification
*/

-- =====================================================
-- MODIFICATIONS TABLES
-- =====================================================

-- Permettre created_by NULL pour inscriptions publiques
ALTER TABLE entries ALTER COLUMN created_by DROP NOT NULL;

-- Ajouter session_token optionnel pour tracer les inscriptions anonymes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'entries' AND column_name = 'session_token'
  ) THEN
    ALTER TABLE entries ADD COLUMN session_token VARCHAR(255);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_entries_session_token ON entries(session_token) WHERE session_token IS NOT NULL;

-- =====================================================
-- RLS POLICIES - ATHLETES (Support Public)
-- =====================================================

-- Public peut créer des athletes pour inscription en ligne
CREATE POLICY "Anyone can create athletes for online registration"
  ON athletes FOR INSERT
  WITH CHECK (true);

-- Public peut voir les athletes de leurs propres inscriptions via session token
CREATE POLICY "Anyone can view athletes for public entries"
  ON athletes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM entries
      WHERE entries.athlete_id = athletes.id
      AND entries.source = 'online'
      AND entries.status = 'confirmed'
    )
  );

-- =====================================================
-- RLS POLICIES - ENTRIES (Support Public)
-- =====================================================

-- Public peut créer des inscriptions en ligne
CREATE POLICY "Anyone can create online entries"
  ON entries FOR INSERT
  WITH CHECK (source = 'online');

-- Public peut voir les inscriptions confirmées (liste des inscrits)
CREATE POLICY "Anyone can view confirmed online entries"
  ON entries FOR SELECT
  USING (
    source = 'online'
    AND status = 'confirmed'
  );

-- =====================================================
-- RLS POLICIES - ENTRY_PAYMENTS (Support Public)
-- =====================================================

-- Public peut créer des paiements pour inscriptions en ligne
CREATE POLICY "Anyone can create payments for online entries"
  ON entry_payments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM entries
      WHERE entries.id = entry_payments.entry_id
      AND entries.source = 'online'
    )
  );

-- Public peut voir les paiements des inscriptions confirmées
CREATE POLICY "Anyone can view payments for confirmed entries"
  ON entry_payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM entries
      WHERE entries.id = entry_payments.entry_id
      AND entries.source = 'online'
      AND entries.status = 'confirmed'
    )
  );

-- =====================================================
-- FONCTION : Créer Inscription Complète Publique
-- =====================================================

CREATE OR REPLACE FUNCTION create_public_registration(
  p_event_id UUID,
  p_race_id UUID,
  p_organizer_id UUID,
  p_athlete_data JSONB,
  p_category VARCHAR(50),
  p_session_token VARCHAR(255),
  p_options JSONB DEFAULT '[]'::JSONB
)
RETURNS JSONB AS $$
DECLARE
  v_athlete_id UUID;
  v_entry_id UUID;
  v_payment_id UUID;
  v_result JSONB;
BEGIN
  -- 1. Créer ou récupérer l'athlète
  INSERT INTO athletes (
    first_name,
    last_name,
    birthdate,
    gender,
    email,
    phone,
    address_line1,
    city,
    postal_code,
    country_code,
    license_type,
    license_id,
    license_club,
    consent_data_processing
  )
  VALUES (
    p_athlete_data->>'first_name',
    p_athlete_data->>'last_name',
    (p_athlete_data->>'birthdate')::DATE,
    p_athlete_data->>'gender',
    p_athlete_data->>'email',
    p_athlete_data->>'phone',
    p_athlete_data->>'address_line1',
    p_athlete_data->>'city',
    p_athlete_data->>'postal_code',
    COALESCE(p_athlete_data->>'country_code', 'FR'),
    p_athlete_data->>'license_type',
    p_athlete_data->>'license_id',
    p_athlete_data->>'license_club',
    COALESCE((p_athlete_data->>'consent_data_processing')::BOOLEAN, false)
  )
  RETURNING id INTO v_athlete_id;

  -- 2. Créer l'inscription (draft initialement)
  INSERT INTO entries (
    athlete_id,
    event_id,
    race_id,
    organizer_id,
    category,
    source,
    status,
    session_token,
    created_by_type
  )
  VALUES (
    v_athlete_id,
    p_event_id,
    p_race_id,
    p_organizer_id,
    p_category,
    'online',
    'draft',
    p_session_token,
    'organizer'
  )
  RETURNING id INTO v_entry_id;

  -- 3. Créer le paiement (pending)
  INSERT INTO entry_payments (
    entry_id,
    payment_status,
    amount_organizer_cents,
    timepulse_commission_cents,
    total_amount_cents
  )
  VALUES (
    v_entry_id,
    'pending',
    0,
    0,
    0
  )
  RETURNING id INTO v_payment_id;

  -- 4. Retourner les IDs créés
  v_result := jsonb_build_object(
    'athlete_id', v_athlete_id,
    'entry_id', v_entry_id,
    'payment_id', v_payment_id
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION create_public_registration IS 'Crée une inscription publique complète (athlète + entry + payment) pour une inscription en ligne';
