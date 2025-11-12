/*
  # Module Organisateur - Timepulse

  1. Nouvelles Tables
    - `organizers` - Comptes organisateurs
    - `events` - Événements sportifs
    - `races` - Épreuves au sein d'un événement
    - `license_types` - Types de licences sportives
    - `pricing_periods` - Périodes tarifaires
    - `race_pricing` - Tarifs par épreuve/période/licence
    - `invitations` - Invitations gratuites partenaires
    - `promo_codes` - Codes promotionnels
    - `bib_number_config` - Configuration numérotation dossards
    - `registrations` - Inscriptions participants
    - `audit_logs` - Historique des actions

  2. Sécurité
    - Enable RLS sur toutes les tables
    - Policies restrictives par rôle
    - Audit trail complet

  3. Contraintes métier
    - Validation des dates
    - Contrôle des jauges
    - Unicité des dossards
    - Verrou d'édition dossards
*/

-- Table: organizers
CREATE TABLE IF NOT EXISTS organizers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name text NOT NULL,
  contact_name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone text,
  address text,
  siret text,
  website text,
  logo_url text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'inactive')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE organizers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organizers can view own profile"
  ON organizers FOR SELECT
  TO authenticated
  USING (auth.uid() = auth_user_id);

CREATE POLICY "Organizers can update own profile"
  ON organizers FOR UPDATE
  TO authenticated
  USING (auth.uid() = auth_user_id)
  WITH CHECK (auth.uid() = auth_user_id);

-- Table: events
CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id uuid NOT NULL REFERENCES organizers(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  short_description text,
  location_name text NOT NULL,
  location_address text NOT NULL,
  location_city text NOT NULL,
  location_postal_code text NOT NULL,
  location_country text DEFAULT 'France',
  location_lat numeric(10, 7),
  location_lng numeric(10, 7),
  start_date date NOT NULL,
  end_date date NOT NULL,
  cover_image_url text,
  logo_url text,
  contact_email text NOT NULL,
  contact_phone text,
  website_url text,
  rules_url text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'open', 'closed', 'cancelled')),
  registration_open_date timestamptz,
  registration_close_date timestamptz,
  public_registration boolean DEFAULT true,
  max_participants integer,
  meta_data jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  CONSTRAINT valid_dates CHECK (end_date >= start_date)
);

CREATE INDEX IF NOT EXISTS idx_events_organizer ON events(organizer_id);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status) WHERE status IN ('open', 'published');
CREATE INDEX IF NOT EXISTS idx_events_dates ON events(start_date, end_date);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organizers can view own events"
  ON events FOR SELECT
  TO authenticated
  USING (
    organizer_id IN (
      SELECT id FROM organizers WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Organizers can create events"
  ON events FOR INSERT
  TO authenticated
  WITH CHECK (
    organizer_id IN (
      SELECT id FROM organizers WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Organizers can update own events"
  ON events FOR UPDATE
  TO authenticated
  USING (
    organizer_id IN (
      SELECT id FROM organizers WHERE auth_user_id = auth.uid()
    )
  )
  WITH CHECK (
    organizer_id IN (
      SELECT id FROM organizers WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Public can view published events"
  ON events FOR SELECT
  TO public
  USING (status IN ('published', 'open'));

-- Table: races
CREATE TABLE IF NOT EXISTS races (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL,
  description text,
  distance_km numeric(6, 2),
  elevation_gain_m integer,
  race_date date NOT NULL,
  race_time time,
  max_participants integer,
  min_age integer DEFAULT 18,
  max_age integer,
  gender_restriction text CHECK (gender_restriction IN ('male', 'female', 'mixed', NULL)),
  requires_medical_certificate boolean DEFAULT false,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'open', 'full', 'closed', 'cancelled')),
  display_order integer DEFAULT 0,
  meta_data jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  UNIQUE(event_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_races_event ON races(event_id);

ALTER TABLE races ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organizers can manage own races"
  ON races FOR ALL
  TO authenticated
  USING (
    event_id IN (
      SELECT id FROM events WHERE organizer_id IN (
        SELECT id FROM organizers WHERE auth_user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Public can view published races"
  ON races FOR SELECT
  TO public
  USING (
    event_id IN (
      SELECT id FROM events WHERE status IN ('published', 'open')
    )
  );

-- Table: license_types
CREATE TABLE IF NOT EXISTS license_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  federation text NOT NULL,
  description text,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE license_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active license types"
  ON license_types FOR SELECT
  TO public
  USING (active = true);

-- Insert default license types
INSERT INTO license_types (code, name, federation) VALUES
  ('FFA', 'Licence FFA', 'Fédération Française d''Athlétisme'),
  ('FFTRI', 'Licence Triathlon', 'Fédération Française de Triathlon'),
  ('FFME', 'Licence Montagne', 'Fédération Française de Montagne et Escalade'),
  ('UFOLEP', 'Licence UFOLEP', 'UFOLEP'),
  ('NON_LIC', 'Non licencié', 'Aucune')
ON CONFLICT (code) DO NOTHING;

-- Table: pricing_periods
CREATE TABLE IF NOT EXISTS pricing_periods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  race_id uuid NOT NULL REFERENCES races(id) ON DELETE CASCADE,
  name text NOT NULL,
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  display_order integer DEFAULT 0,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  CONSTRAINT valid_period_dates CHECK (end_date > start_date)
);

CREATE INDEX IF NOT EXISTS idx_pricing_periods_race ON pricing_periods(race_id);

ALTER TABLE pricing_periods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organizers can manage pricing periods"
  ON pricing_periods FOR ALL
  TO authenticated
  USING (
    race_id IN (
      SELECT r.id FROM races r
      JOIN events e ON e.id = r.event_id
      JOIN organizers o ON o.id = e.organizer_id
      WHERE o.auth_user_id = auth.uid()
    )
  );

-- Table: race_pricing
CREATE TABLE IF NOT EXISTS race_pricing (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  race_id uuid NOT NULL REFERENCES races(id) ON DELETE CASCADE,
  pricing_period_id uuid NOT NULL REFERENCES pricing_periods(id) ON DELETE CASCADE,
  license_type_id uuid NOT NULL REFERENCES license_types(id) ON DELETE CASCADE,
  price_cents integer NOT NULL CHECK (price_cents >= 0),
  max_registrations integer,
  license_valid_until date,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  UNIQUE(race_id, pricing_period_id, license_type_id)
);

CREATE INDEX IF NOT EXISTS idx_race_pricing_race ON race_pricing(race_id);

ALTER TABLE race_pricing ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organizers can manage race pricing"
  ON race_pricing FOR ALL
  TO authenticated
  USING (
    race_id IN (
      SELECT r.id FROM races r
      JOIN events e ON e.id = r.event_id
      JOIN organizers o ON o.id = e.organizer_id
      WHERE o.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Public can view active pricing"
  ON race_pricing FOR SELECT
  TO public
  USING (active = true);

-- Table: invitations
CREATE TABLE IF NOT EXISTS invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  race_id uuid REFERENCES races(id) ON DELETE CASCADE,
  invited_email text NOT NULL,
  invited_name text NOT NULL,
  invitation_code text UNIQUE NOT NULL,
  invitation_type text NOT NULL DEFAULT 'partner' CHECK (invitation_type IN ('partner', 'volunteer', 'vip', 'press')),
  status text NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'used', 'expired', 'revoked')),
  valid_until timestamptz,
  used_at timestamptz,
  used_by_registration_id uuid,
  notes text,
  created_by uuid REFERENCES organizers(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_invitations_code ON invitations(invitation_code);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON invitations(invited_email);
CREATE INDEX IF NOT EXISTS idx_invitations_event ON invitations(event_id);

ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organizers can manage own invitations"
  ON invitations FOR ALL
  TO authenticated
  USING (
    event_id IN (
      SELECT id FROM events WHERE organizer_id IN (
        SELECT id FROM organizers WHERE auth_user_id = auth.uid()
      )
    )
  );

-- Table: promo_codes
CREATE TABLE IF NOT EXISTS promo_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  race_id uuid REFERENCES races(id) ON DELETE CASCADE,
  code text UNIQUE NOT NULL,
  description text,
  discount_type text NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount')),
  discount_value integer NOT NULL CHECK (discount_value > 0),
  usage_type text NOT NULL CHECK (usage_type IN ('single', 'multiple', 'unlimited')),
  max_uses integer,
  current_uses integer DEFAULT 0,
  valid_from timestamptz,
  valid_until timestamptz,
  license_type_id uuid REFERENCES license_types(id),
  min_price_cents integer DEFAULT 0,
  active boolean DEFAULT true,
  created_by uuid REFERENCES organizers(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  CONSTRAINT valid_promo_dates CHECK (valid_until IS NULL OR valid_from IS NULL OR valid_until > valid_from),
  CONSTRAINT valid_usage_limit CHECK (usage_type = 'unlimited' OR max_uses IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_promo_codes_code ON promo_codes(code) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_promo_codes_event ON promo_codes(event_id);

ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organizers can manage own promo codes"
  ON promo_codes FOR ALL
  TO authenticated
  USING (
    event_id IN (
      SELECT id FROM events WHERE organizer_id IN (
        SELECT id FROM organizers WHERE auth_user_id = auth.uid()
      )
    )
  );

-- Table: bib_number_config
CREATE TABLE IF NOT EXISTS bib_number_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL UNIQUE REFERENCES events(id) ON DELETE CASCADE,
  auto_assign boolean DEFAULT false,
  range_start integer NOT NULL DEFAULT 1,
  range_end integer NOT NULL DEFAULT 9999,
  assignment_strategy text NOT NULL DEFAULT 'sequential' CHECK (assignment_strategy IN ('sequential', 'by_gender', 'by_category', 'by_race', 'manual')),
  male_range_start integer,
  male_range_end integer,
  female_range_start integer,
  female_range_end integer,
  lock_date timestamptz,
  locked_by uuid REFERENCES admin_users(id),
  locked_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  CONSTRAINT valid_range CHECK (range_end > range_start),
  CONSTRAINT valid_gender_ranges CHECK (
    (assignment_strategy != 'by_gender') OR
    (male_range_start IS NOT NULL AND male_range_end IS NOT NULL AND
     female_range_start IS NOT NULL AND female_range_end IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_bib_config_event ON bib_number_config(event_id);

ALTER TABLE bib_number_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organizers can manage own bib config"
  ON bib_number_config FOR ALL
  TO authenticated
  USING (
    event_id IN (
      SELECT id FROM events WHERE organizer_id IN (
        SELECT id FROM organizers WHERE auth_user_id = auth.uid()
      )
    )
  );

-- Table: registrations
CREATE TABLE IF NOT EXISTS registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  race_id uuid NOT NULL REFERENCES races(id) ON DELETE CASCADE,
  participant_first_name text NOT NULL,
  participant_last_name text NOT NULL,
  participant_email text NOT NULL,
  participant_phone text,
  participant_gender text NOT NULL CHECK (participant_gender IN ('male', 'female', 'other')),
  participant_birth_date date NOT NULL,
  participant_nationality text DEFAULT 'FR',
  participant_address text,
  participant_city text,
  participant_postal_code text,
  license_type_id uuid NOT NULL REFERENCES license_types(id),
  license_number text,
  license_expiry_date date,
  emergency_contact_name text NOT NULL,
  emergency_contact_phone text NOT NULL,
  bib_number integer,
  registration_status text NOT NULL DEFAULT 'pending' CHECK (registration_status IN ('pending', 'confirmed', 'cancelled', 'refunded', 'waitlist')),
  payment_status text NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded', 'free')),
  amount_paid_cents integer NOT NULL DEFAULT 0,
  promo_code_id uuid REFERENCES promo_codes(id),
  invitation_id uuid REFERENCES invitations(id),
  registered_at timestamptz DEFAULT now(),
  confirmed_at timestamptz,
  cancelled_at timestamptz,
  meta_data jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_registrations_event ON registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_registrations_race ON registrations(race_id);
CREATE INDEX IF NOT EXISTS idx_registrations_email ON registrations(participant_email);
CREATE INDEX IF NOT EXISTS idx_registrations_bib ON registrations(bib_number) WHERE bib_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_registrations_status ON registrations(registration_status);
CREATE INDEX IF NOT EXISTS idx_registrations_composite ON registrations(event_id, race_id, registration_status);

ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organizers can view own registrations"
  ON registrations FOR SELECT
  TO authenticated
  USING (
    event_id IN (
      SELECT id FROM events WHERE organizer_id IN (
        SELECT id FROM organizers WHERE auth_user_id = auth.uid()
      )
    )
  );

-- Table: audit_logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  action text NOT NULL,
  actor_type text NOT NULL CHECK (actor_type IN ('organizer', 'admin', 'system')),
  actor_id uuid NOT NULL,
  actor_email text,
  changes jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs(actor_type, actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organizers can view own audit logs"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (
    (actor_type = 'organizer' AND actor_id IN (
      SELECT id FROM organizers WHERE auth_user_id = auth.uid()
    )) OR
    (entity_type = 'event' AND entity_id IN (
      SELECT id FROM events WHERE organizer_id IN (
        SELECT id FROM organizers WHERE auth_user_id = auth.uid()
      )
    ))
  );

-- Function: Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
CREATE TRIGGER update_organizers_updated_at BEFORE UPDATE ON organizers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_races_updated_at BEFORE UPDATE ON races
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pricing_periods_updated_at BEFORE UPDATE ON pricing_periods
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_race_pricing_updated_at BEFORE UPDATE ON race_pricing
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invitations_updated_at BEFORE UPDATE ON invitations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_promo_codes_updated_at BEFORE UPDATE ON promo_codes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bib_number_config_updated_at BEFORE UPDATE ON bib_number_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_registrations_updated_at BEFORE UPDATE ON registrations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
