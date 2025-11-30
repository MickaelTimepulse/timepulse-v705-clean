# Module Organisateur - Schéma de Données Complet

## 1. SCHÉMA DE DONNÉES

### 1.1 Table: organizers
Compte organisateur avec accès au back-office.

```sql
CREATE TABLE organizers (
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
```

**Relations:**
- Un organisateur peut avoir plusieurs événements
- Lié à auth.users pour l'authentification

---

### 1.2 Table: events
Événement principal (course, trail, festival).

```sql
CREATE TABLE events (
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
```

**Exemples:**
```json
{
  "name": "Trail des Écrins 2025",
  "slug": "trail-ecrins-2025",
  "location_name": "Briançon",
  "start_date": "2025-06-15",
  "end_date": "2025-06-15",
  "max_participants": 2000,
  "status": "open"
}
```

---

### 1.3 Table: races
Épreuves au sein d'un événement (distances, catégories).

```sql
CREATE TABLE races (
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
```

**Exemples:**
```json
[
  {
    "name": "10 km",
    "slug": "10km",
    "distance_km": 10.0,
    "race_date": "2025-06-15",
    "race_time": "09:00:00",
    "max_participants": 500
  },
  {
    "name": "Trail 25 km",
    "slug": "trail-25km",
    "distance_km": 25.0,
    "elevation_gain_m": 1200,
    "race_date": "2025-06-15",
    "race_time": "10:00:00",
    "max_participants": 800
  }
]
```

---

### 1.4 Table: license_types
Types de licences sportives acceptées.

```sql
CREATE TABLE license_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  federation text NOT NULL,
  description text,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Données par défaut
INSERT INTO license_types (code, name, federation) VALUES
  ('FFA', 'Licence FFA', 'Fédération Française d''Athlétisme'),
  ('FFTRI', 'Licence Triathlon', 'Fédération Française de Triathlon'),
  ('FFME', 'Licence Montagne', 'Fédération Française de Montagne et Escalade'),
  ('UFOLEP', 'Licence UFOLEP', 'UFOLEP'),
  ('NON_LIC', 'Non licencié', 'Aucune');
```

---

### 1.5 Table: pricing_periods
Périodes tarifaires (early bird, normal, last minute).

```sql
CREATE TABLE pricing_periods (
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
```

**Exemples:**
```json
[
  {
    "name": "Early Bird",
    "start_date": "2025-01-01T00:00:00Z",
    "end_date": "2025-03-31T23:59:59Z"
  },
  {
    "name": "Tarif Normal",
    "start_date": "2025-04-01T00:00:00Z",
    "end_date": "2025-05-31T23:59:59Z"
  },
  {
    "name": "Last Minute",
    "start_date": "2025-06-01T00:00:00Z",
    "end_date": "2025-06-14T23:59:59Z"
  }
]
```

---

### 1.6 Table: race_pricing
Tarifs par épreuve, période et type de licence.

```sql
CREATE TABLE race_pricing (
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
```

**Exemples:**
```json
[
  {
    "race_id": "uuid-10km",
    "pricing_period_id": "uuid-early-bird",
    "license_type_id": "uuid-ffa",
    "price_cents": 1500,
    "max_registrations": 200
  },
  {
    "race_id": "uuid-10km",
    "pricing_period_id": "uuid-early-bird",
    "license_type_id": "uuid-non-lic",
    "price_cents": 2000,
    "max_registrations": 100,
    "license_valid_until": "2025-05-01"
  }
]
```

---

### 1.7 Table: invitations
Invitations gratuites pour partenaires.

```sql
CREATE TABLE invitations (
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

CREATE INDEX idx_invitations_code ON invitations(invitation_code);
CREATE INDEX idx_invitations_email ON invitations(invited_email);
```

**Exemples:**
```json
{
  "invited_email": "partenaire@example.com",
  "invited_name": "Jean Dupont",
  "invitation_code": "INV-TRAIL2025-A7B9C3",
  "invitation_type": "partner",
  "valid_until": "2025-06-14T23:59:59Z",
  "status": "sent"
}
```

---

### 1.8 Table: promo_codes
Codes promotionnels pour réductions.

```sql
CREATE TABLE promo_codes (
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

CREATE INDEX idx_promo_codes_code ON promo_codes(code) WHERE active = true;
```

**Exemples:**
```json
[
  {
    "code": "EARLY2025",
    "discount_type": "percentage",
    "discount_value": 15,
    "usage_type": "unlimited",
    "valid_from": "2025-01-01T00:00:00Z",
    "valid_until": "2025-03-31T23:59:59Z"
  },
  {
    "code": "PARTNER50",
    "discount_type": "fixed_amount",
    "discount_value": 500,
    "usage_type": "single",
    "max_uses": 1
  }
]
```

---

### 1.9 Table: bib_number_config
Configuration de numérotation des dossards.

```sql
CREATE TABLE bib_number_config (
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
```

**Exemples:**
```json
[
  {
    "auto_assign": true,
    "range_start": 1,
    "range_end": 5000,
    "assignment_strategy": "sequential"
  },
  {
    "auto_assign": true,
    "assignment_strategy": "by_gender",
    "male_range_start": 1,
    "male_range_end": 3000,
    "female_range_start": 3001,
    "female_range_end": 5000,
    "lock_date": "2025-06-10T00:00:00Z"
  }
]
```

---

### 1.10 Table: registrations
Inscriptions des participants.

```sql
CREATE TABLE registrations (
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

CREATE INDEX idx_registrations_event ON registrations(event_id);
CREATE INDEX idx_registrations_race ON registrations(race_id);
CREATE INDEX idx_registrations_email ON registrations(participant_email);
CREATE INDEX idx_registrations_bib ON registrations(bib_number) WHERE bib_number IS NOT NULL;
CREATE INDEX idx_registrations_status ON registrations(registration_status);
```

---

### 1.11 Table: audit_logs
Historique de toutes les actions.

```sql
CREATE TABLE audit_logs (
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

CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_actor ON audit_logs(actor_type, actor_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);
```

**Exemples:**
```json
[
  {
    "entity_type": "event",
    "entity_id": "uuid-event",
    "action": "created",
    "actor_type": "organizer",
    "actor_id": "uuid-organizer",
    "actor_email": "org@example.com",
    "changes": {
      "name": "Trail des Écrins 2025",
      "status": "draft"
    }
  },
  {
    "entity_type": "bib_number_config",
    "entity_id": "uuid-bib-config",
    "action": "locked",
    "actor_type": "admin",
    "actor_id": "uuid-admin",
    "changes": {
      "locked_at": "2025-06-10T14:30:00Z",
      "lock_date": "2025-06-10T00:00:00Z"
    }
  }
]
```

---

## 2. RELATIONS ET CONTRAINTES

### Hiérarchie principale:
```
organizers (1) ──→ (N) events
events (1) ──→ (N) races
races (1) ──→ (N) pricing_periods
pricing_periods + license_types ──→ race_pricing
races (1) ──→ (N) registrations
```

### Contraintes métier:
1. Un organisateur ne peut modifier QUE ses événements
2. Les dates de périodes tarifaires ne peuvent pas se chevaucher pour une même épreuve
3. Le nombre de participants confirmés ne peut excéder max_participants
4. Un code promo ne peut être utilisé plus de max_uses fois
5. Les dossards doivent être uniques par événement
6. Après lock_date, seul un super admin peut modifier les dossards

---

## 3. INDEXES DE PERFORMANCE

```sql
-- Performance des recherches d'événements
CREATE INDEX idx_events_organizer ON events(organizer_id);
CREATE INDEX idx_events_status ON events(status) WHERE status IN ('open', 'published');
CREATE INDEX idx_events_dates ON events(start_date, end_date);

-- Performance des inscriptions
CREATE INDEX idx_registrations_composite ON registrations(event_id, race_id, registration_status);

-- Performance des codes promo
CREATE INDEX idx_promo_codes_active ON promo_codes(event_id, active) WHERE active = true;
```
