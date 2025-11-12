/*
  # Module Inscriptions Manuelles - Tables Principales

  1. Nouvelles Tables
    - `athletes` : Informations des athlètes (identité, contact, licence, documents)
    - `entries` : Inscriptions aux épreuves
    - `entry_payments` : Paiements et statuts (payé, gratuit, en attente)
  
  2. Sécurité
    - Enable RLS sur toutes les tables
    - Policies pour organisateurs : accès aux inscriptions de leurs événements
    - Policies pour admins : accès complet
  
  3. Indexes
    - Index sur athlete (nom, prénom, email, licence)
    - Index sur entries (event_id, race_id, athlete_id)
    - Index sur payment_status
*/

-- =====================================================
-- ATHLETES
-- =====================================================
CREATE TABLE IF NOT EXISTS athletes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identité
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  birthdate DATE NOT NULL,
  gender VARCHAR(10) NOT NULL CHECK (gender IN ('M', 'F', 'X', 'NB')),

  -- Contact
  email VARCHAR(255),
  phone VARCHAR(50),
  address_line1 VARCHAR(255),
  address_line2 VARCHAR(255),
  city VARCHAR(100),
  postal_code VARCHAR(20),
  country_code VARCHAR(2) DEFAULT 'FR',

  -- Licence
  license_type VARCHAR(50),
  license_id VARCHAR(100),
  license_issued_by VARCHAR(100),
  license_valid_until DATE,

  -- Documents (URLs vers Storage)
  medical_doc_url VARCHAR(500),
  medical_doc_uploaded_at TIMESTAMPTZ,
  license_doc_url VARCHAR(500),
  license_doc_uploaded_at TIMESTAMPTZ,

  -- RGPD
  consent_data_processing BOOLEAN DEFAULT false,
  consent_marketing BOOLEAN DEFAULT false,
  consent_photo BOOLEAN DEFAULT false,

  -- Meta
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_athletes_fullname ON athletes(last_name, first_name);
CREATE INDEX IF NOT EXISTS idx_athletes_birthdate ON athletes(birthdate);
CREATE INDEX IF NOT EXISTS idx_athletes_email ON athletes(email) WHERE email IS NOT NULL;

-- =====================================================
-- ENTRIES (Inscriptions)
-- =====================================================
CREATE TABLE IF NOT EXISTS entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relations
  athlete_id UUID NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  race_id UUID NOT NULL REFERENCES races(id) ON DELETE CASCADE,
  organizer_id UUID NOT NULL REFERENCES organizers(id),

  -- Classification
  category VARCHAR(50) NOT NULL,

  -- Source & Raison
  source VARCHAR(20) NOT NULL DEFAULT 'manual' CHECK (
    source IN ('online', 'manual', 'bulk_import', 'transfer')
  ),
  reason VARCHAR(500),
  notes TEXT,

  -- Statut
  status VARCHAR(20) NOT NULL DEFAULT 'confirmed' CHECK (
    status IN ('draft', 'confirmed', 'cancelled', 'transferred', 'needs_docs')
  ),
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,

  -- Création/Modification
  created_by UUID NOT NULL REFERENCES admin_users(id),
  created_by_type VARCHAR(20) NOT NULL DEFAULT 'organizer' CHECK (
    created_by_type IN ('organizer', 'timepulse_staff')
  ),
  updated_by UUID REFERENCES admin_users(id),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Dossard
  bib_number INTEGER,
  bib_assigned_at TIMESTAMPTZ,

  CONSTRAINT entries_unique_athlete_race UNIQUE (athlete_id, race_id)
);

CREATE INDEX IF NOT EXISTS idx_entries_event ON entries(event_id);
CREATE INDEX IF NOT EXISTS idx_entries_race ON entries(race_id);
CREATE INDEX IF NOT EXISTS idx_entries_athlete ON entries(athlete_id);
CREATE INDEX IF NOT EXISTS idx_entries_status ON entries(status);
CREATE INDEX IF NOT EXISTS idx_entries_source ON entries(source);
CREATE INDEX IF NOT EXISTS idx_entries_organizer ON entries(organizer_id);

-- =====================================================
-- PAYMENTS (Paiements des inscriptions)
-- =====================================================
CREATE TABLE IF NOT EXISTS entry_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id UUID NOT NULL REFERENCES entries(id) ON DELETE CASCADE,

  -- Montant
  amount_paid DECIMAL(10,2) NOT NULL DEFAULT 0,
  currency VARCHAR(3) NOT NULL DEFAULT 'EUR',

  -- Statut de paiement
  payment_status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (
    payment_status IN ('paid', 'pending', 'free', 'comped')
  ),

  -- Mode de paiement (si payé)
  payment_method VARCHAR(50) CHECK (
    payment_method IN ('cash', 'check', 'bank_transfer', 'stripe', 'manual')
  ),
  
  -- Référence de paiement
  payment_reference VARCHAR(100),
  paid_at TIMESTAMPTZ,

  -- Meta
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT entry_payments_unique UNIQUE (entry_id)
);

CREATE INDEX IF NOT EXISTS idx_entry_payments_status ON entry_payments(payment_status);

-- =====================================================
-- RLS POLICIES - ATHLETES
-- =====================================================
ALTER TABLE athletes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organizers can view athletes from their entries"
  ON athletes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM entries e
      INNER JOIN organizers o ON e.organizer_id = o.id
      WHERE e.athlete_id = athletes.id
      AND o.user_id = auth.uid()
    )
  );

CREATE POLICY "Organizers can create athletes"
  ON athletes FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organizers
      WHERE organizers.user_id = auth.uid()
    )
  );

CREATE POLICY "Organizers can update athletes from their entries"
  ON athletes FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM entries e
      INNER JOIN organizers o ON e.organizer_id = o.id
      WHERE e.athlete_id = athletes.id
      AND o.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM entries e
      INNER JOIN organizers o ON e.organizer_id = o.id
      WHERE e.athlete_id = athletes.id
      AND o.user_id = auth.uid()
    )
  );

-- =====================================================
-- RLS POLICIES - ENTRIES
-- =====================================================
ALTER TABLE entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organizers can view their entries"
  ON entries FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organizers
      WHERE organizers.id = entries.organizer_id
      AND organizers.user_id = auth.uid()
    )
  );

CREATE POLICY "Organizers can create entries for their events"
  ON entries FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM events e
      INNER JOIN organizers o ON e.organizer_id = o.id
      WHERE e.id = entries.event_id
      AND o.user_id = auth.uid()
    )
  );

CREATE POLICY "Organizers can update their entries"
  ON entries FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organizers
      WHERE organizers.id = entries.organizer_id
      AND organizers.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organizers
      WHERE organizers.id = entries.organizer_id
      AND organizers.user_id = auth.uid()
    )
  );

CREATE POLICY "Organizers can delete their entries"
  ON entries FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organizers
      WHERE organizers.id = entries.organizer_id
      AND organizers.user_id = auth.uid()
    )
  );

-- =====================================================
-- RLS POLICIES - ENTRY_PAYMENTS
-- =====================================================
ALTER TABLE entry_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organizers can view payments for their entries"
  ON entry_payments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM entries e
      INNER JOIN organizers o ON e.organizer_id = o.id
      WHERE e.id = entry_payments.entry_id
      AND o.user_id = auth.uid()
    )
  );

CREATE POLICY "Organizers can create payments for their entries"
  ON entry_payments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM entries e
      INNER JOIN organizers o ON e.organizer_id = o.id
      WHERE e.id = entry_payments.entry_id
      AND o.user_id = auth.uid()
    )
  );

CREATE POLICY "Organizers can update payments for their entries"
  ON entry_payments FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM entries e
      INNER JOIN organizers o ON e.organizer_id = o.id
      WHERE e.id = entry_payments.entry_id
      AND o.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM entries e
      INNER JOIN organizers o ON e.organizer_id = o.id
      WHERE e.id = entry_payments.entry_id
      AND o.user_id = auth.uid()
    )
  );

-- =====================================================
-- TRIGGER - Update updated_at
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'athletes_updated_at'
  ) THEN
    CREATE TRIGGER athletes_updated_at BEFORE UPDATE ON athletes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'entries_updated_at'
  ) THEN
    CREATE TRIGGER entries_updated_at BEFORE UPDATE ON entries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;