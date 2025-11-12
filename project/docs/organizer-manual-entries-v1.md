# Module Organisateur - Inscriptions Manuelles v1

## 1. Modèle de Données

### Schema SQL (Supabase/PostgreSQL)

```sql
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
  country_code VARCHAR(2),

  -- Licence
  license_type VARCHAR(50),
  license_id VARCHAR(100),
  license_issued_by VARCHAR(100),
  license_valid_until DATE,

  -- Documents
  medical_doc_status VARCHAR(20) DEFAULT 'not_required' CHECK (
    medical_doc_status IN ('not_required', 'pending', 'uploaded', 'validated', 'rejected')
  ),
  medical_doc_url VARCHAR(500),
  medical_doc_uploaded_at TIMESTAMPTZ,

  -- RGPD
  consent_data_processing BOOLEAN DEFAULT false,
  consent_marketing BOOLEAN DEFAULT false,
  consent_photo BOOLEAN DEFAULT false,

  -- Meta
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Indexes
  CONSTRAINT athletes_email_unique UNIQUE NULLS NOT DISTINCT (email),
  CONSTRAINT athletes_license_unique UNIQUE NULLS NOT DISTINCT (license_type, license_id)
);

CREATE INDEX idx_athletes_fullname ON athletes(last_name, first_name);
CREATE INDEX idx_athletes_birthdate ON athletes(birthdate);
CREATE INDEX idx_athletes_license ON athletes(license_type, license_id) WHERE license_id IS NOT NULL;
CREATE INDEX idx_athletes_email ON athletes(email) WHERE email IS NOT NULL;

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
  wave_id UUID REFERENCES waves(id),
  corral VARCHAR(20),

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

  -- Options (JSONB)
  options JSONB DEFAULT '{}',

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
  bib_locked BOOLEAN DEFAULT false,
  bib_assigned_at TIMESTAMPTZ,

  -- Email confirmation
  confirmation_sent_at TIMESTAMPTZ,
  confirmation_resend_count INTEGER DEFAULT 0,
  last_confirmation_sent_at TIMESTAMPTZ,

  CONSTRAINT entries_unique_athlete_race UNIQUE (athlete_id, race_id),
  CONSTRAINT entries_bib_unique UNIQUE NULLS NOT DISTINCT (race_id, bib_number)
);

CREATE INDEX idx_entries_event ON entries(event_id);
CREATE INDEX idx_entries_race ON entries(race_id);
CREATE INDEX idx_entries_athlete ON entries(athlete_id);
CREATE INDEX idx_entries_status ON entries(status);
CREATE INDEX idx_entries_source ON entries(source);
CREATE INDEX idx_entries_created_by ON entries(created_by);
CREATE INDEX idx_entries_bib_number ON entries(race_id, bib_number) WHERE bib_number IS NOT NULL;

-- =====================================================
-- PAYMENTS (Light - Manual entries)
-- =====================================================
CREATE TABLE IF NOT EXISTS entry_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id UUID NOT NULL REFERENCES entries(id) ON DELETE CASCADE,

  -- Montant
  amount_paid DECIMAL(10,2) NOT NULL DEFAULT 0,
  currency VARCHAR(3) NOT NULL DEFAULT 'EUR',

  -- Canal
  payment_channel VARCHAR(50) NOT NULL DEFAULT 'manual' CHECK (
    payment_channel IN ('manual', 'stripe', 'bank_transfer', 'cash', 'check')
  ),
  payment_status VARCHAR(50) NOT NULL DEFAULT 'manual_comped' CHECK (
    payment_status IN ('manual_comped', 'paid', 'pending', 'failed', 'refunded')
  ),

  -- Reçu
  receipt_url VARCHAR(500),
  receipt_generated_at TIMESTAMPTZ,

  -- Meta
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT entry_payments_unique UNIQUE (entry_id)
);

CREATE INDEX idx_entry_payments_status ON entry_payments(payment_status);
CREATE INDEX idx_entry_payments_channel ON entry_payments(payment_channel);

-- =====================================================
-- CAPACITY TRACKING
-- =====================================================
CREATE TABLE IF NOT EXISTS capacity_counters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Target
  entity_type VARCHAR(20) NOT NULL CHECK (entity_type IN ('event', 'race', 'wave')),
  entity_id UUID NOT NULL,

  -- Compteurs
  current_count INTEGER NOT NULL DEFAULT 0,
  max_capacity INTEGER NOT NULL,
  waitlist_count INTEGER DEFAULT 0,

  -- Lock
  is_locked BOOLEAN DEFAULT false,
  locked_at TIMESTAMPTZ,
  locked_reason VARCHAR(500),

  -- Meta
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT capacity_counters_unique UNIQUE (entity_type, entity_id)
);

CREATE INDEX idx_capacity_entity ON capacity_counters(entity_type, entity_id);
CREATE INDEX idx_capacity_status ON capacity_counters(is_locked);

-- =====================================================
-- LICENSE WINDOWS (Fenêtres autorisées par type)
-- =====================================================
CREATE TABLE IF NOT EXISTS license_windows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  race_id UUID NOT NULL REFERENCES races(id) ON DELETE CASCADE,
  license_type VARCHAR(50) NOT NULL,

  -- Fenêtre temporelle
  opens_at TIMESTAMPTZ NOT NULL,
  closes_at TIMESTAMPTZ NOT NULL,

  -- Règles
  min_age INTEGER,
  max_age INTEGER,
  require_medical_cert BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT license_windows_unique UNIQUE (race_id, license_type)
);

CREATE INDEX idx_license_windows_race ON license_windows(race_id);
CREATE INDEX idx_license_windows_dates ON license_windows(opens_at, closes_at);

-- =====================================================
-- BIB CONFIGURATION
-- =====================================================
CREATE TABLE IF NOT EXISTS bib_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  race_id UUID NOT NULL REFERENCES races(id) ON DELETE CASCADE,

  -- Stratégie
  assignment_strategy VARCHAR(50) NOT NULL DEFAULT 'sequential' CHECK (
    assignment_strategy IN ('sequential', 'by_gender', 'by_category', 'manual_only')
  ),

  -- Plages
  start_number INTEGER NOT NULL,
  end_number INTEGER NOT NULL,

  -- Verrous
  lock_date TIMESTAMPTZ,
  locked BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT bib_configs_unique UNIQUE (race_id)
);

CREATE INDEX idx_bib_configs_race ON bib_configs(race_id);

-- =====================================================
-- EMAIL QUEUE
-- =====================================================
CREATE TABLE IF NOT EXISTS email_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  entry_id UUID NOT NULL REFERENCES entries(id) ON DELETE CASCADE,

  -- Email
  to_email VARCHAR(255) NOT NULL,
  subject VARCHAR(500) NOT NULL,
  template_id VARCHAR(100) NOT NULL,
  template_data JSONB,

  -- Statut
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'sent', 'failed', 'bounced')
  ),
  sent_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  failure_reason TEXT,
  retry_count INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_email_queue_status ON email_queue(status);
CREATE INDEX idx_email_queue_entry ON email_queue(entry_id);
CREATE INDEX idx_email_queue_created ON email_queue(created_at);

-- =====================================================
-- AUDIT LOG (Manual entries specific)
-- =====================================================
CREATE TABLE IF NOT EXISTS entry_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Timestamp
  timestamp_utc TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Actor
  actor_id UUID NOT NULL REFERENCES admin_users(id),
  actor_type VARCHAR(20) NOT NULL CHECK (actor_type IN ('organizer', 'timepulse_staff')),
  actor_email VARCHAR(255),

  -- Action
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID NOT NULL,

  -- Données
  before_state JSONB,
  after_state JSONB,

  -- Contexte
  reason VARCHAR(500),
  override_type VARCHAR(50),
  ip_address INET,
  user_agent TEXT,

  -- Hash chain (same as CMS)
  previous_hash VARCHAR(64),
  record_hash VARCHAR(64) NOT NULL,

  -- Meta
  event_id UUID REFERENCES events(id),
  race_id UUID REFERENCES races(id),
  entry_id UUID REFERENCES entries(id)
);

CREATE INDEX idx_entry_audit_timestamp ON entry_audit_log(timestamp_utc DESC);
CREATE INDEX idx_entry_audit_actor ON entry_audit_log(actor_id);
CREATE INDEX idx_entry_audit_action ON entry_audit_log(action);
CREATE INDEX idx_entry_audit_entity ON entry_audit_log(entity_type, entity_id);
CREATE INDEX idx_entry_audit_entry ON entry_audit_log(entry_id) WHERE entry_id IS NOT NULL;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Update updated_at on athletes
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER athletes_updated_at BEFORE UPDATE ON athletes
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER entries_updated_at BEFORE UPDATE ON entries
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Decrement capacity on entry creation
CREATE OR REPLACE FUNCTION decrement_capacity()
RETURNS TRIGGER AS $$
BEGIN
  -- Update race capacity
  UPDATE capacity_counters
  SET current_count = current_count + 1,
      updated_at = NOW()
  WHERE entity_type = 'race' AND entity_id = NEW.race_id;

  -- Update event capacity
  UPDATE capacity_counters
  SET current_count = current_count + 1,
      updated_at = NOW()
  WHERE entity_type = 'event' AND entity_id = NEW.event_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER entries_decrement_capacity AFTER INSERT ON entries
FOR EACH ROW WHEN (NEW.status != 'cancelled')
EXECUTE FUNCTION decrement_capacity();

-- Increment capacity on cancellation
CREATE OR REPLACE FUNCTION increment_capacity_on_cancel()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status != 'cancelled' AND NEW.status = 'cancelled' THEN
    -- Increment race capacity
    UPDATE capacity_counters
    SET current_count = current_count - 1,
        updated_at = NOW()
    WHERE entity_type = 'race' AND entity_id = NEW.race_id;

    -- Increment event capacity
    UPDATE capacity_counters
    SET current_count = current_count - 1,
        updated_at = NOW()
    WHERE entity_type = 'event' AND entity_id = NEW.event_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER entries_increment_capacity AFTER UPDATE ON entries
FOR EACH ROW
EXECUTE FUNCTION increment_capacity_on_cancel();
```

### Contraintes & Règles d'Unicité

```typescript
// lib/entries/constraints.ts

export const UNIQUENESS_RULES = {
  // Athlète: email unique (si fourni)
  athlete_email: {
    table: 'athletes',
    field: 'email',
    nullsDistinct: false,
  },

  // Athlète: licence unique par type (si fournie)
  athlete_license: {
    table: 'athletes',
    fields: ['license_type', 'license_id'],
    nullsDistinct: false,
  },

  // Entry: un athlète ne peut s'inscrire qu'une fois par course
  entry_athlete_race: {
    table: 'entries',
    fields: ['athlete_id', 'race_id'],
  },

  // Dossard: unique par course (si attribué)
  entry_bib_number: {
    table: 'entries',
    fields: ['race_id', 'bib_number'],
    nullsDistinct: false,
  },
};

export const SOFT_DUPLICATE_DETECTION = {
  // Détection fuzzy sur nom + prénom + date de naissance
  algorithm: 'levenshtein',
  threshold: 0.85,
  fields: ['first_name', 'last_name', 'birthdate'],
  optional_fields: ['license_id'],
};
```

---

## 2. Validations Métier

### Guards & Validators

```typescript
// lib/entries/validators.ts
import { z } from 'zod';
import Fuse from 'fuse.js';
import { supabase } from '@/lib/supabase';

// =====================================================
// SCHEMAS ZOD
// =====================================================

export const athleteSchema = z.object({
  first_name: z.string().min(2).max(100),
  last_name: z.string().min(2).max(100),
  birthdate: z.string().date(),
  gender: z.enum(['M', 'F', 'X', 'NB']),
  email: z.string().email().optional(),
  phone: z.string().max(50).optional(),
  address_line1: z.string().max(255).optional(),
  city: z.string().max(100).optional(),
  postal_code: z.string().max(20).optional(),
  country_code: z.string().length(2).default('FR'),
  license_type: z.string().max(50).optional(),
  license_id: z.string().max(100).optional(),
  medical_doc_status: z.enum(['not_required', 'pending', 'uploaded', 'validated']).default('not_required'),
  consent_data_processing: z.boolean().default(true),
  consent_marketing: z.boolean().default(false),
  consent_photo: z.boolean().default(false),
});

export const manualEntrySchema = z.object({
  athlete: athleteSchema,
  race_id: z.string().uuid(),
  category: z.string().min(1).max(50),
  wave_id: z.string().uuid().optional(),
  corral: z.string().max(20).optional(),
  options: z.record(z.any()).default({}),
  reason: z.string().max(500).optional(),
  notes: z.string().optional(),
  send_confirmation_email: z.boolean().default(false),
});

export const bulkImportSchema = z.object({
  race_id: z.string().uuid(),
  entries: z.array(athleteSchema).min(1).max(1000),
  send_confirmation_emails: z.boolean().default(false),
  skip_duplicates: z.boolean().default(false),
});

// =====================================================
// CAPACITY GUARD
// =====================================================

export interface CapacityCheckResult {
  allowed: boolean;
  reason?: string;
  current: number;
  max: number;
  remaining: number;
}

export async function checkCapacity(
  entityType: 'event' | 'race',
  entityId: string
): Promise<CapacityCheckResult> {
  const { data: counter } = await supabase
    .from('capacity_counters')
    .select('*')
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
    .single();

  if (!counter) {
    return { allowed: false, reason: 'Capacity counter not found', current: 0, max: 0, remaining: 0 };
  }

  if (counter.is_locked) {
    return {
      allowed: false,
      reason: `${entityType} is locked: ${counter.locked_reason}`,
      current: counter.current_count,
      max: counter.max_capacity,
      remaining: 0,
    };
  }

  const remaining = counter.max_capacity - counter.current_count;

  if (remaining <= 0) {
    return {
      allowed: false,
      reason: `${entityType} is full (${counter.current_count}/${counter.max_capacity})`,
      current: counter.current_count,
      max: counter.max_capacity,
      remaining: 0,
    };
  }

  return {
    allowed: true,
    current: counter.current_count,
    max: counter.max_capacity,
    remaining,
  };
}

// =====================================================
// LICENSE WINDOW GUARD
// =====================================================

export interface LicenseWindowCheckResult {
  allowed: boolean;
  reason?: string;
  window?: {
    opens_at: string;
    closes_at: string;
  };
}

export async function checkLicenseWindow(
  raceId: string,
  licenseType?: string
): Promise<LicenseWindowCheckResult> {
  if (!licenseType) {
    return { allowed: true };
  }

  const { data: window } = await supabase
    .from('license_windows')
    .select('*')
    .eq('race_id', raceId)
    .eq('license_type', licenseType)
    .single();

  if (!window) {
    return { allowed: true };
  }

  const now = new Date();
  const opensAt = new Date(window.opens_at);
  const closesAt = new Date(window.closes_at);

  if (now < opensAt) {
    return {
      allowed: false,
      reason: `License window for ${licenseType} opens on ${opensAt.toLocaleDateString()}`,
      window: { opens_at: window.opens_at, closes_at: window.closes_at },
    };
  }

  if (now > closesAt) {
    return {
      allowed: false,
      reason: `License window for ${licenseType} closed on ${closesAt.toLocaleDateString()}`,
      window: { opens_at: window.opens_at, closes_at: window.closes_at },
    };
  }

  return {
    allowed: true,
    window: { opens_at: window.opens_at, closes_at: window.closes_at },
  };
}

// =====================================================
// BIB LOCK GUARD
// =====================================================

export interface BibLockCheckResult {
  allowed: boolean;
  reason?: string;
  lock_date?: string;
}

export async function checkBibLock(raceId: string): Promise<BibLockCheckResult> {
  const { data: config } = await supabase
    .from('bib_configs')
    .select('*')
    .eq('race_id', raceId)
    .single();

  if (!config || !config.lock_date) {
    return { allowed: true };
  }

  const now = new Date();
  const lockDate = new Date(config.lock_date);

  if (now > lockDate) {
    return {
      allowed: false,
      reason: `Bib assignments are locked since ${lockDate.toLocaleDateString()}`,
      lock_date: config.lock_date,
    };
  }

  return { allowed: true };
}

// =====================================================
// AGE & CATEGORY VALIDATION
// =====================================================

export interface AgeValidationResult {
  valid: boolean;
  reason?: string;
  age: number;
  category: string;
}

export function validateAgeForCategory(
  birthdate: string,
  category: string,
  eventDate: string
): AgeValidationResult {
  const birth = new Date(birthdate);
  const event = new Date(eventDate);
  const age = event.getFullYear() - birth.getFullYear();

  // Catégories standards FFA
  const categoryRanges: Record<string, { min: number; max: number }> = {
    'EA': { min: 12, max: 13 },
    'MI': { min: 14, max: 15 },
    'CA': { min: 16, max: 17 },
    'JU': { min: 18, max: 19 },
    'ES': { min: 20, max: 22 },
    'SE': { min: 23, max: 39 },
    'M0': { min: 40, max: 44 },
    'M1': { min: 45, max: 49 },
    'M2': { min: 50, max: 54 },
    'M3': { min: 55, max: 59 },
    'M4': { min: 60, max: 64 },
    'M5': { min: 65, max: 69 },
    'M6': { min: 70, max: 74 },
    'M7': { min: 75, max: 999 },
  };

  const range = categoryRanges[category];

  if (!range) {
    return { valid: true, age, category };
  }

  if (age < range.min || age > range.max) {
    return {
      valid: false,
      reason: `Age ${age} is not valid for category ${category} (expected ${range.min}-${range.max})`,
      age,
      category,
    };
  }

  return { valid: true, age, category };
}

// =====================================================
// DUPLICATE DETECTION (Fuzzy)
// =====================================================

export interface DuplicateCandidate {
  athlete_id: string;
  first_name: string;
  last_name: string;
  birthdate: string;
  email?: string;
  license_id?: string;
  similarity_score: number;
}

export async function detectDuplicates(
  athlete: {
    first_name: string;
    last_name: string;
    birthdate: string;
    license_id?: string;
  }
): Promise<DuplicateCandidate[]> {
  // Fetch potential duplicates (same birthdate or similar names)
  const { data: candidates } = await supabase
    .from('athletes')
    .select('id, first_name, last_name, birthdate, email, license_id')
    .or(`birthdate.eq.${athlete.birthdate},last_name.ilike.%${athlete.last_name}%`);

  if (!candidates || candidates.length === 0) {
    return [];
  }

  // Use Fuse.js for fuzzy matching
  const fuse = new Fuse(candidates, {
    keys: ['first_name', 'last_name'],
    threshold: 0.15, // 85% similarity
    includeScore: true,
  });

  const searchQuery = `${athlete.first_name} ${athlete.last_name}`;
  const results = fuse.search(searchQuery);

  const duplicates: DuplicateCandidate[] = results
    .filter((result) => {
      const candidate = result.item;
      // Check birthdate match
      if (candidate.birthdate !== athlete.birthdate) return false;
      // Check license match (if provided)
      if (athlete.license_id && candidate.license_id) {
        return candidate.license_id === athlete.license_id;
      }
      return true;
    })
    .map((result) => ({
      athlete_id: result.item.id,
      first_name: result.item.first_name,
      last_name: result.item.last_name,
      birthdate: result.item.birthdate,
      email: result.item.email,
      license_id: result.item.license_id,
      similarity_score: 1 - (result.score || 0),
    }));

  return duplicates;
}

// =====================================================
// RGPD COMPLIANCE
// =====================================================

export function validateRGPDConsents(consents: {
  consent_data_processing: boolean;
  consent_marketing?: boolean;
  consent_photo?: boolean;
}): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!consents.consent_data_processing) {
    errors.push('Consent for data processing is required');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// =====================================================
// COMPOSITE GUARD (All checks)
// =====================================================

export interface GuardCheckResult {
  allowed: boolean;
  blockers: Array<{
    type: 'capacity' | 'license_window' | 'bib_lock' | 'age' | 'rgpd';
    reason: string;
    override_allowed: boolean;
  }>;
  warnings: Array<{
    type: 'duplicate' | 'document_missing';
    message: string;
  }>;
}

export async function runAllGuards(input: {
  race_id: string;
  event_id: string;
  athlete: z.infer<typeof athleteSchema>;
  category: string;
  event_date: string;
  actor_type: 'organizer' | 'timepulse_staff';
}): Promise<GuardCheckResult> {
  const blockers: GuardCheckResult['blockers'] = [];
  const warnings: GuardCheckResult['warnings'] = [];

  // 1. Capacity check
  const raceCapacity = await checkCapacity('race', input.race_id);
  if (!raceCapacity.allowed) {
    blockers.push({
      type: 'capacity',
      reason: raceCapacity.reason!,
      override_allowed: input.actor_type === 'timepulse_staff',
    });
  }

  // 2. License window check
  const licenseWindow = await checkLicenseWindow(input.race_id, input.athlete.license_type);
  if (!licenseWindow.allowed) {
    blockers.push({
      type: 'license_window',
      reason: licenseWindow.reason!,
      override_allowed: input.actor_type === 'timepulse_staff',
    });
  }

  // 3. Age validation
  const ageValidation = validateAgeForCategory(
    input.athlete.birthdate,
    input.category,
    input.event_date
  );
  if (!ageValidation.valid) {
    blockers.push({
      type: 'age',
      reason: ageValidation.reason!,
      override_allowed: false,
    });
  }

  // 4. RGPD consents
  const rgpdValidation = validateRGPDConsents({
    consent_data_processing: input.athlete.consent_data_processing,
    consent_marketing: input.athlete.consent_marketing,
    consent_photo: input.athlete.consent_photo,
  });
  if (!rgpdValidation.valid) {
    blockers.push({
      type: 'rgpd',
      reason: rgpdValidation.errors.join(', '),
      override_allowed: false,
    });
  }

  // 5. Duplicate detection (warning only)
  const duplicates = await detectDuplicates({
    first_name: input.athlete.first_name,
    last_name: input.athlete.last_name,
    birthdate: input.athlete.birthdate,
    license_id: input.athlete.license_id,
  });

  if (duplicates.length > 0) {
    warnings.push({
      type: 'duplicate',
      message: `${duplicates.length} potential duplicate(s) found`,
    });
  }

  // 6. Medical document check (warning only)
  if (input.athlete.medical_doc_status === 'pending') {
    warnings.push({
      type: 'document_missing',
      message: 'Medical certificate is pending',
    });
  }

  return {
    allowed: blockers.length === 0,
    blockers,
    warnings,
  };
}
```

---

## 3. API (tRPC)

### Router Definition

```typescript
// server/routers/entry-manual.ts
import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import {
  manualEntrySchema,
  bulkImportSchema,
  runAllGuards,
  checkBibLock,
} from '@/lib/entries/validators';
import { assignBibNumber } from '@/lib/entries/bib';
import { queueConfirmationEmail } from '@/lib/entries/email';
import { appendAuditLog } from '@/lib/entries/audit';

export const entryManualRouter = router({
  // =====================================================
  // CREATE MANUAL ENTRY
  // =====================================================
  create: protectedProcedure
    .input(manualEntrySchema)
    .output(z.object({
      entry_id: z.string().uuid(),
      athlete_id: z.string().uuid(),
      bib_number: z.number().optional(),
      warnings: z.array(z.string()),
    }))
    .mutation(async ({ ctx, input }) => {
      // Check permissions
      await ctx.rbac.check('entry', 'create_manual');

      // Get race details
      const { data: race } = await ctx.supabase
        .from('races')
        .select('event_id, event_date')
        .eq('id', input.race_id)
        .single();

      if (!race) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Race not found' });
      }

      // Run all guards
      const guardResult = await runAllGuards({
        race_id: input.race_id,
        event_id: race.event_id,
        athlete: input.athlete,
        category: input.category,
        event_date: race.event_date,
        actor_type: ctx.user.role === 'timepulse_staff' ? 'timepulse_staff' : 'organizer',
      });

      // Check blockers (unless override allowed)
      const hardBlockers = guardResult.blockers.filter(
        (b) => !b.override_allowed || ctx.user.role !== 'timepulse_staff'
      );

      if (hardBlockers.length > 0) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: hardBlockers.map((b) => b.reason).join('; '),
        });
      }

      // Create or find athlete
      let athleteId: string;

      const { data: existingAthlete } = await ctx.supabase
        .from('athletes')
        .select('id')
        .eq('first_name', input.athlete.first_name)
        .eq('last_name', input.athlete.last_name)
        .eq('birthdate', input.athlete.birthdate)
        .maybeSingle();

      if (existingAthlete) {
        athleteId = existingAthlete.id;
      } else {
        const { data: newAthlete, error } = await ctx.supabase
          .from('athletes')
          .insert(input.athlete)
          .select('id')
          .single();

        if (error || !newAthlete) {
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to create athlete' });
        }

        athleteId = newAthlete.id;
      }

      // Create entry
      const { data: entry, error: entryError } = await ctx.supabase
        .from('entries')
        .insert({
          athlete_id: athleteId,
          event_id: race.event_id,
          race_id: input.race_id,
          organizer_id: ctx.user.organizer_id,
          category: input.category,
          wave_id: input.wave_id,
          corral: input.corral,
          source: 'manual',
          reason: input.reason,
          notes: input.notes,
          status: 'confirmed',
          options: input.options,
          created_by: ctx.user.id,
          created_by_type: ctx.user.role === 'timepulse_staff' ? 'timepulse_staff' : 'organizer',
        })
        .select()
        .single();

      if (entryError || !entry) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to create entry' });
      }

      // Create payment record
      await ctx.supabase.from('entry_payments').insert({
        entry_id: entry.id,
        amount_paid: 0,
        currency: 'EUR',
        payment_channel: 'manual',
        payment_status: 'manual_comped',
      });

      // Assign bib number
      let bibNumber: number | undefined;
      const bibConfig = await ctx.supabase
        .from('bib_configs')
        .select('*')
        .eq('race_id', input.race_id)
        .maybeSingle();

      if (bibConfig.data && bibConfig.data.assignment_strategy !== 'manual_only') {
        bibNumber = await assignBibNumber(input.race_id, input.category, input.athlete.gender);
        await ctx.supabase
          .from('entries')
          .update({ bib_number: bibNumber, bib_assigned_at: new Date().toISOString() })
          .eq('id', entry.id);
      }

      // Send confirmation email
      if (input.send_confirmation_email && input.athlete.email) {
        await queueConfirmationEmail(entry.id, input.athlete.email);
        await ctx.supabase
          .from('entries')
          .update({ confirmation_sent_at: new Date().toISOString() })
          .eq('id', entry.id);
      }

      // Audit log
      await appendAuditLog({
        actor_id: ctx.user.id,
        actor_type: ctx.user.role === 'timepulse_staff' ? 'timepulse_staff' : 'organizer',
        action: 'entry.manual.created',
        entity_type: 'entry',
        entity_id: entry.id,
        after_state: entry,
        reason: input.reason,
        event_id: race.event_id,
        race_id: input.race_id,
        entry_id: entry.id,
      });

      return {
        entry_id: entry.id,
        athlete_id: athleteId,
        bib_number: bibNumber,
        warnings: guardResult.warnings.map((w) => w.message),
      };
    }),

  // =====================================================
  // UPDATE ENTRY
  // =====================================================
  update: protectedProcedure
    .input(z.object({
      entry_id: z.string().uuid(),
      category: z.string().optional(),
      wave_id: z.string().uuid().optional(),
      options: z.record(z.any()).optional(),
      notes: z.string().optional(),
    }))
    .output(z.object({ success: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.rbac.check('entry', 'update');

      const { entry_id, ...updates } = input;

      const { data: before } = await ctx.supabase
        .from('entries')
        .select('*')
        .eq('id', entry_id)
        .single();

      if (!before) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Entry not found' });
      }

      const { error } = await ctx.supabase
        .from('entries')
        .update({
          ...updates,
          updated_by: ctx.user.id,
        })
        .eq('id', entry_id);

      if (error) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Update failed' });
      }

      await appendAuditLog({
        actor_id: ctx.user.id,
        actor_type: ctx.user.role === 'timepulse_staff' ? 'timepulse_staff' : 'organizer',
        action: 'entry.manual.updated',
        entity_type: 'entry',
        entity_id: entry_id,
        before_state: before,
        after_state: { ...before, ...updates },
        entry_id,
      });

      return { success: true };
    }),

  // =====================================================
  // CANCEL ENTRY
  // =====================================================
  cancel: protectedProcedure
    .input(z.object({
      entry_id: z.string().uuid(),
      reason: z.string().min(10),
    }))
    .output(z.object({ success: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.rbac.check('entry', 'cancel');

      const { data: entry } = await ctx.supabase
        .from('entries')
        .select('*')
        .eq('id', input.entry_id)
        .single();

      if (!entry) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Entry not found' });
      }

      if (entry.status === 'cancelled') {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Entry already cancelled' });
      }

      await ctx.supabase
        .from('entries')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          cancellation_reason: input.reason,
          updated_by: ctx.user.id,
        })
        .eq('id', input.entry_id);

      await appendAuditLog({
        actor_id: ctx.user.id,
        actor_type: ctx.user.role === 'timepulse_staff' ? 'timepulse_staff' : 'organizer',
        action: 'entry.manual.cancelled',
        entity_type: 'entry',
        entity_id: input.entry_id,
        before_state: entry,
        reason: input.reason,
        entry_id: input.entry_id,
      });

      return { success: true };
    }),

  // =====================================================
  // BULK IMPORT
  // =====================================================
  bulkImport: protectedProcedure
    .input(bulkImportSchema)
    .output(z.object({
      success_count: z.number(),
      error_count: z.number(),
      errors: z.array(z.object({
        row: z.number(),
        athlete: z.string(),
        reason: z.string(),
      })),
    }))
    .mutation(async ({ ctx, input }) => {
      await ctx.rbac.check('entry', 'bulk_import');

      let successCount = 0;
      let errorCount = 0;
      const errors: Array<{ row: number; athlete: string; reason: string }> = [];

      for (let i = 0; i < input.entries.length; i++) {
        const athleteData = input.entries[i];

        try {
          // Use create mutation internally
          await ctx.procedures.entryManual.create({
            athlete: athleteData,
            race_id: input.race_id,
            category: athleteData.category || 'SE',
            send_confirmation_email: input.send_confirmation_emails,
          });

          successCount++;
        } catch (error: any) {
          errorCount++;
          errors.push({
            row: i + 1,
            athlete: `${athleteData.first_name} ${athleteData.last_name}`,
            reason: error.message,
          });

          if (!input.skip_duplicates) {
            break;
          }
        }
      }

      await appendAuditLog({
        actor_id: ctx.user.id,
        actor_type: ctx.user.role === 'timepulse_staff' ? 'timepulse_staff' : 'organizer',
        action: 'entry.manual.bulk_import',
        entity_type: 'bulk_import',
        entity_id: input.race_id,
        after_state: { success_count: successCount, error_count: errorCount },
        race_id: input.race_id,
      });

      return { success_count: successCount, error_count: errorCount, errors };
    }),

  // =====================================================
  // RESEND CONFIRMATION EMAIL
  // =====================================================
  resendConfirmation: protectedProcedure
    .input(z.object({ entry_id: z.string().uuid() }))
    .output(z.object({ success: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.rbac.check('entry', 'resend_email');

      const { data: entry } = await ctx.supabase
        .from('entries')
        .select('*, athletes(email)')
        .eq('id', input.entry_id)
        .single();

      if (!entry || !entry.athletes.email) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Entry or email not found' });
      }

      await queueConfirmationEmail(entry.id, entry.athletes.email);

      await ctx.supabase
        .from('entries')
        .update({
          confirmation_resend_count: (entry.confirmation_resend_count || 0) + 1,
          last_confirmation_sent_at: new Date().toISOString(),
        })
        .eq('id', input.entry_id);

      await appendAuditLog({
        actor_id: ctx.user.id,
        actor_type: ctx.user.role === 'timepulse_staff' ? 'timepulse_staff' : 'organizer',
        action: 'entry.email.confirmation.resent',
        entity_type: 'entry',
        entity_id: input.entry_id,
        entry_id: input.entry_id,
      });

      return { success: true };
    }),

  // =====================================================
  // ASSIGN/REASSIGN BIB
  // =====================================================
  assignBib: protectedProcedure
    .input(z.object({
      entry_id: z.string().uuid(),
      bib_number: z.number().int().positive(),
    }))
    .output(z.object({ success: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.rbac.check('entry', 'assign_bib');

      const { data: entry } = await ctx.supabase
        .from('entries')
        .select('*, races(id)')
        .eq('id', input.entry_id)
        .single();

      if (!entry) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Entry not found' });
      }

      // Check bib lock
      const bibLock = await checkBibLock(entry.races.id);
      if (!bibLock.allowed && ctx.user.role !== 'timepulse_staff') {
        throw new TRPCError({ code: 'FORBIDDEN', message: bibLock.reason });
      }

      // Check bib availability
      const { data: existingBib } = await ctx.supabase
        .from('entries')
        .select('id')
        .eq('race_id', entry.race_id)
        .eq('bib_number', input.bib_number)
        .neq('id', input.entry_id)
        .maybeSingle();

      if (existingBib) {
        throw new TRPCError({ code: 'CONFLICT', message: `Bib ${input.bib_number} is already assigned` });
      }

      await ctx.supabase
        .from('entries')
        .update({
          bib_number: input.bib_number,
          bib_assigned_at: new Date().toISOString(),
          updated_by: ctx.user.id,
        })
        .eq('id', input.entry_id);

      await appendAuditLog({
        actor_id: ctx.user.id,
        actor_type: ctx.user.role === 'timepulse_staff' ? 'timepulse_staff' : 'organizer',
        action: entry.bib_number ? 'entry.bib.reassigned' : 'entry.bib.assigned',
        entity_type: 'entry',
        entity_id: input.entry_id,
        before_state: { bib_number: entry.bib_number },
        after_state: { bib_number: input.bib_number },
        override_type: bibLock.allowed ? undefined : 'bib_lock',
        entry_id: input.entry_id,
      });

      return { success: true };
    }),

  // =====================================================
  // CAPACITY PREVIEW
  // =====================================================
  capacityPreview: protectedProcedure
    .input(z.object({
      race_id: z.string().uuid(),
    }))
    .output(z.object({
      race: z.object({
        current: z.number(),
        max: z.number(),
        remaining: z.number(),
        locked: z.boolean(),
      }),
      event: z.object({
        current: z.number(),
        max: z.number(),
        remaining: z.number(),
        locked: z.boolean(),
      }),
    }))
    .query(async ({ ctx, input }) => {
      const { data: race } = await ctx.supabase
        .from('races')
        .select('event_id')
        .eq('id', input.race_id)
        .single();

      if (!race) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Race not found' });
      }

      const { data: raceCapacity } = await ctx.supabase
        .from('capacity_counters')
        .select('*')
        .eq('entity_type', 'race')
        .eq('entity_id', input.race_id)
        .single();

      const { data: eventCapacity } = await ctx.supabase
        .from('capacity_counters')
        .select('*')
        .eq('entity_type', 'event')
        .eq('entity_id', race.event_id)
        .single();

      return {
        race: {
          current: raceCapacity?.current_count || 0,
          max: raceCapacity?.max_capacity || 0,
          remaining: (raceCapacity?.max_capacity || 0) - (raceCapacity?.current_count || 0),
          locked: raceCapacity?.is_locked || false,
        },
        event: {
          current: eventCapacity?.current_count || 0,
          max: eventCapacity?.max_capacity || 0,
          remaining: (eventCapacity?.max_capacity || 0) - (eventCapacity?.current_count || 0),
          locked: eventCapacity?.is_locked || false,
        },
      };
    }),
});
```

---

## 4. Flux UX (Wireframes Textuels)

### 4.1 Création Simple

```
┌──────────────────────────────────────────────────────────────────────┐
│ NOUVELLE INSCRIPTION MANUELLE                              [Annuler] │
├──────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ÉTAPE 1/3: ATHLÈTE                                                  │
│                                                                       │
│  IDENTITÉ *                                                          │
│  Prénom:  [________________]    Nom:  [________________]             │
│  Date de naissance: [__/__/____]    Genre: [Homme ▾]                │
│                                                                       │
│  ⚠️ Attention: doublon potentiel détecté                             │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ Jean DUPONT - né le 15/03/1985 - Licence: 123456            │   │
│  │ [Utiliser cet athlète] [Continuer quand même]                │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                       │
│  CONTACT                                                             │
│  Email:  [_____________________]  (optionnel - pour confirmation)    │
│  Téléphone: [_______________]                                        │
│                                                                       │
│  LICENCE                                                             │
│  Type: [FFA ▾]   Numéro: [__________]   Valid. jusqu'au: [____]    │
│                                                                       │
│  CERTIFICAT MÉDICAL                                                  │
│  Statut: [ ] Non requis  [x] À fournir  [ ] Téléverser maintenant   │
│  [Choisir fichier...]                                                │
│                                                                       │
│  CONSENTEMENTS *                                                     │
│  [x] Traitement des données (obligatoire)                            │
│  [ ] Marketing                                                       │
│  [ ] Photos/vidéos                                                   │
│                                                                       │
│  [Annuler]                                        [Suivant: Épreuve]│
└──────────────────────────────────────────────────────────────────────┘
```

```
┌──────────────────────────────────────────────────────────────────────┐
│ NOUVELLE INSCRIPTION MANUELLE                              [Annuler] │
├──────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ÉTAPE 2/3: ÉPREUVE & OPTIONS                                        │
│                                                                       │
│  ÉPREUVE *                                                           │
│  [Marathon de Paris - 10km ▾]                                        │
│                                                                       │
│  ✅ Capacité: 245/300 (55 places restantes)                          │
│                                                                       │
│  CATÉGORIE *                                                         │
│  [SE (Sénior) ▾]   ✅ Compatible avec l'âge (38 ans)                │
│                                                                       │
│  SAS DE DÉPART                                                       │
│  [SAS 1 (8:00) ▾]                                                    │
│                                                                       │
│  OPTIONS                                                             │
│  Taille T-shirt: [L ▾]                                              │
│  Ravitaillement: [x] Végétarien  [ ] Vegan  [ ] Sans gluten         │
│                                                                       │
│  RAISON DE L'INSCRIPTION MANUELLE *                                  │
│  [Invité organisateur ▾]                                             │
│  OU autre: [_______________________________]                         │
│                                                                       │
│  NOTES INTERNES (optionnel)                                          │
│  [_______________________________________________]                    │
│  [_______________________________________________]                    │
│                                                                       │
│  [< Retour]                                          [Suivant: Récap]│
└──────────────────────────────────────────────────────────────────────┘
```

```
┌──────────────────────────────────────────────────────────────────────┐
│ NOUVELLE INSCRIPTION MANUELLE                              [Annuler] │
├──────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ÉTAPE 3/3: RÉCAPITULATIF & DOSSARD                                 │
│                                                                       │
│  ATHLÈTE                                                             │
│  Jean DUPONT - né le 15/03/1985 (38 ans) - Homme                    │
│  Email: jean.dupont@example.com                                      │
│  Licence FFA: 123456 (valide jusqu'au 31/12/2025)                   │
│  Certificat médical: À fournir                                       │
│                                                                       │
│  ÉPREUVE                                                             │
│  Marathon de Paris - 10km                                            │
│  Catégorie: SE (Sénior)                                              │
│  SAS: SAS 1 (8:00)                                                   │
│  Options: T-shirt L, Ravitaillement végétarien                       │
│                                                                       │
│  DOSSARD                                                             │
│  ✅ Attribution automatique activée                                  │
│  Dossard attribué: #1247                                             │
│                                                                       │
│  PAIEMENT                                                            │
│  Montant: 0,00 € (inscription manuelle)                              │
│  Canal: Manuel (comped)                                              │
│                                                                       │
│  EMAIL DE CONFIRMATION                                               │
│  [x] Envoyer un email de confirmation à jean.dupont@example.com      │
│                                                                       │
│  ⚠️ AVERTISSEMENTS                                                   │
│  • Certificat médical requis avant le jour J                         │
│                                                                       │
│  [< Retour]                          [Créer l'inscription]           │
└──────────────────────────────────────────────────────────────────────┘
```

### 4.2 Import CSV

```
┌──────────────────────────────────────────────────────────────────────┐
│ IMPORT CSV - INSCRIPTIONS MANUELLES                        [Annuler] │
├──────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ÉTAPE 1/4: TÉLÉCHARGEMENT                                           │
│                                                                       │
│  [Télécharger le modèle CSV]                                         │
│                                                                       │
│  FICHIER                                                             │
│  ┌────────────────────────────────────────────────────────────┐     │
│  │  [Glisser-déposer ou cliquer pour choisir un fichier]      │     │
│  │                                                              │     │
│  │  Formats acceptés: .csv, .xlsx                              │     │
│  │  Taille max: 5 Mo                                           │     │
│  └────────────────────────────────────────────────────────────┘     │
│                                                                       │
│  ÉPREUVE CIBLE                                                       │
│  [Marathon de Paris - 10km ▾]                                        │
│                                                                       │
│  OPTIONS                                                             │
│  [x] Ignorer les doublons                                            │
│  [x] Envoyer emails de confirmation (si email présent)               │
│                                                                       │
│  [Annuler]                                             [Suivant]     │
└──────────────────────────────────────────────────────────────────────┘
```

```
┌──────────────────────────────────────────────────────────────────────┐
│ IMPORT CSV - INSCRIPTIONS MANUELLES                        [Annuler] │
├──────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ÉTAPE 2/4: MAPPING COLONNES                                         │
│                                                                       │
│  Votre CSV contient 245 lignes                                       │
│                                                                       │
│  ASSOCIEZ VOS COLONNES                                               │
│  ┌──────────────────┬─────────────────┬────────────────────────┐    │
│  │ Colonne CSV      │ Champ Timepulse │ Aperçu données         │    │
│  ├──────────────────┼─────────────────┼────────────────────────┤    │
│  │ Prénom           │ [first_name ▾]  │ Jean, Marie, Paul...   │    │
│  │ Nom              │ [last_name ▾]   │ DUPONT, MARTIN...      │    │
│  │ DDN              │ [birthdate ▾]   │ 15/03/1985, 22/11...   │    │
│  │ Sexe             │ [gender ▾]      │ M, F, M...             │    │
│  │ Email            │ [email ▾]       │ jean@..., marie@...    │    │
│  │ Licence          │ [license_id ▾]  │ 123456, 234567...      │    │
│  │ Cat              │ [category ▾]    │ SE, M1, ES...          │    │
│  └──────────────────┴─────────────────┴────────────────────────┘    │
│                                                                       │
│  [< Retour]                                   [Valider & Prévisualiser]│
└──────────────────────────────────────────────────────────────────────┘
```

```
┌──────────────────────────────────────────────────────────────────────┐
│ IMPORT CSV - INSCRIPTIONS MANUELLES                        [Annuler] │
├──────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ÉTAPE 3/4: PRÉVISUALISATION & ERREURS                              │
│                                                                       │
│  RÉSUMÉ                                                              │
│  ✅ 238 lignes valides                                               │
│  ❌ 7 lignes avec erreurs                                            │
│                                                                       │
│  ERREURS DÉTECTÉES                                                   │
│  ┌─────┬────────────────────┬─────────────────────────────────┐     │
│  │Ligne│ Athlète            │ Erreur                          │     │
│  ├─────┼────────────────────┼─────────────────────────────────┤     │
│  │  12 │ Paul BERNARD       │ Email invalide                  │     │
│  │  34 │ Sophie LECLERC     │ Date de naissance manquante     │     │
│  │  56 │ Thomas PETIT       │ Catégorie incompatible (âge)    │     │
│  │  78 │ Marie ROUX         │ Doublon détecté (licence)       │     │
│  │ 102 │ Pierre BLANC       │ Capacité insuffisante           │     │
│  │ 145 │ Julie NOIR         │ Fenêtre licence fermée          │     │
│  │ 189 │ Marc VERT          │ Email invalide                  │     │
│  └─────┴────────────────────┴─────────────────────────────────┘     │
│                                                                       │
│  OPTIONS                                                             │
│  [ ] Importer uniquement les lignes valides (238)                    │
│  [ ] Corriger les erreurs et réessayer                               │
│                                                                       │
│  [< Retour]                                       [Lancer l'import]  │
└──────────────────────────────────────────────────────────────────────┘
```

```
┌──────────────────────────────────────────────────────────────────────┐
│ IMPORT CSV - RÉSULTAT                                        [Fermer]│
├──────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  IMPORT TERMINÉ                                                      │
│                                                                       │
│  ✅ 238 inscriptions créées avec succès                              │
│  ❌ 7 inscriptions échouées                                          │
│                                                                       │
│  DÉTAILS                                                             │
│  • Dossards attribués: #1201 à #1438                                 │
│  • Emails de confirmation envoyés: 215 (23 sans email)               │
│  • Durée: 12 secondes                                                │
│                                                                       │
│  ACTIONS                                                             │
│  [Télécharger le rapport complet]                                    │
│  [Voir les inscriptions créées]                                      │
│                                                                       │
│  [Fermer]                                                            │
└──────────────────────────────────────────────────────────────────────┘
```

### 4.3 Fiche Inscription

```
┌──────────────────────────────────────────────────────────────────────┐
│ INSCRIPTION #1247                                           [Fermer] │
├──────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  STATUT: ✅ Confirmée                                                │
│  Créée le 14/10/2025 à 14:23 par marie@timepulse.fr (Organisateur)  │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │ ATHLÈTE                                                      │    │
│  │ Jean DUPONT                                                  │    │
│  │ Né le 15/03/1985 (38 ans) - Homme                           │    │
│  │ jean.dupont@example.com - 06 12 34 56 78                    │    │
│  │ Licence FFA: 123456 (exp. 31/12/2025)                       │    │
│  │                                                              │    │
│  │ [Modifier athlète]                                          │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │ ÉPREUVE                                                      │    │
│  │ Marathon de Paris - 10km                                     │    │
│  │ Catégorie: SE (Sénior)                                       │    │
│  │ SAS: SAS 1 (8:00)                                            │    │
│  │ Dossard: #1247 🔒 (verrouillé le 10/10/2025)                │    │
│  │                                                              │    │
│  │ Options: T-shirt L, Ravitaillement végétarien               │    │
│  │                                                              │    │
│  │ [Modifier options]  [Réassigner dossard (Staff only)]       │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                       │
│  ┌──────────────────────────────────────��──────────────────────┐    │
│  │ DOCUMENTS                                                    │    │
│  │ ⚠️ Certificat médical: À fournir                             │    │
│  │                                                              │    │
│  │ [Téléverser document]  [Marquer comme reçu]                 │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │ EMAIL                                                        │    │
│  │ ✅ Confirmation envoyée le 14/10/2025 à 14:25               │    │
│  │ Renvois: 0                                                   │    │
│  │                                                              │    │
│  │ [Re-envoyer confirmation]                                    │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │ PAIEMENT                                                     │    │
│  │ Statut: Comped (inscription manuelle)                       │    │
│  │ Montant: 0,00 €                                              │    │
│  │ Raison: Invité organisateur                                 │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                       │
│  ACTIONS                                                             │
│  [Annuler inscription]  [Transférer vers autre course]              │
│  [Voir historique audit]                                             │
│                                                                       │
│  [Fermer]                                                            │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 5. Email

### Template de Confirmation

```typescript
// lib/emails/templates/manual-entry-confirmation.ts

export const manualEntryConfirmationTemplate = {
  id: 'manual_entry_confirmation',
  subject: '✅ Confirmation d\'inscription - {{event_name}}',
  html: `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #007bff; color: white; padding: 20px; text-align: center; }
        .content { padding: 30px 20px; background: #f9f9f9; }
        .bib { font-size: 48px; font-weight: bold; color: #007bff; text-align: center; margin: 20px 0; }
        .info-block { background: white; padding: 15px; margin: 15px 0; border-left: 4px solid #007bff; }
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
        .button { display: inline-block; padding: 12px 24px; background: #007bff; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>{{event_name}}</h1>
        </div>

        <div class="content">
          <p>Bonjour {{first_name}} {{last_name}},</p>

          <p>Votre inscription à <strong>{{race_name}}</strong> est confirmée !</p>

          {{#if bib_number}}
          <div class="bib">Dossard #{{bib_number}}</div>
          {{/if}}

          <div class="info-block">
            <h3>📋 Informations</h3>
            <ul>
              <li><strong>Épreuve:</strong> {{race_name}}</li>
              <li><strong>Date:</strong> {{event_date}}</li>
              <li><strong>Catégorie:</strong> {{category}}</li>
              {{#if wave_name}}
              <li><strong>SAS de départ:</strong> {{wave_name}} ({{wave_time}})</li>
              {{/if}}
              {{#if options}}
              <li><strong>Options:</strong> {{options}}</li>
              {{/if}}
            </ul>
          </div>

          {{#if missing_documents}}
          <div class="info-block" style="border-color: #ffc107;">
            <h3>⚠️ Documents à fournir</h3>
            <p>{{missing_documents}}</p>
            <p>Merci de nous transmettre ces documents avant le jour J.</p>
          </div>
          {{/if}}

          {{#if participant_portal_url}}
          <div style="text-align: center;">
            <a href="{{participant_portal_url}}" class="button">Accéder à mon espace</a>
          </div>
          {{/if}}

          <div class="info-block">
            <h3>📧 Contact</h3>
            <p>Pour toute question:<br>
            Email: {{organizer_email}}<br>
            Téléphone: {{organizer_phone}}</p>
          </div>

          <p>À bientôt sur la ligne de départ !</p>
          <p><em>L'équipe {{organizer_name}}</em></p>
        </div>

        <div class="footer">
          <p>Chronométrage par <a href="https://timepulse.fr">Timepulse</a></p>
          <p><small>Vous recevez cet email car vous êtes inscrit à {{event_name}}</small></p>
        </div>
      </div>
    </body>
    </html>
  `,
  text: `
Bonjour {{first_name}} {{last_name}},

Votre inscription à {{race_name}} est confirmée !

{{#if bib_number}}
Dossard: #{{bib_number}}
{{/if}}

INFORMATIONS:
- Épreuve: {{race_name}}
- Date: {{event_date}}
- Catégorie: {{category}}
{{#if wave_name}}
- SAS: {{wave_name}} ({{wave_time}})
{{/if}}

{{#if missing_documents}}
⚠️ DOCUMENTS À FOURNIR:
{{missing_documents}}
{{/if}}

Contact: {{organizer_email}} - {{organizer_phone}}

À bientôt !
L'équipe {{organizer_name}}

---
Chronométrage par Timepulse - https://timepulse.fr
  `,
};
```

### Email Queue Service

```typescript
// lib/emails/queue.ts
import { supabase } from '@/lib/supabase';
import Handlebars from 'handlebars';
import { manualEntryConfirmationTemplate } from './templates/manual-entry-confirmation';

export async function queueConfirmationEmail(entryId: string, toEmail: string) {
  // Fetch entry data
  const { data: entry } = await supabase
    .from('entries')
    .select(`
      *,
      athletes(*),
      races(*, events(*)),
      waves(name, start_time)
    `)
    .eq('id', entryId)
    .single();

  if (!entry) {
    throw new Error('Entry not found');
  }

  // Compile template
  const subjectTemplate = Handlebars.compile(manualEntryConfirmationTemplate.subject);
  const htmlTemplate = Handlebars.compile(manualEntryConfirmationTemplate.html);

  const templateData = {
    first_name: entry.athletes.first_name,
    last_name: entry.athletes.last_name,
    event_name: entry.races.events.name,
    race_name: entry.races.name,
    event_date: new Date(entry.races.events.event_date).toLocaleDateString('fr-FR'),
    category: entry.category,
    bib_number: entry.bib_number,
    wave_name: entry.waves?.name,
    wave_time: entry.waves?.start_time,
    options: formatOptions(entry.options),
    missing_documents: entry.athletes.medical_doc_status === 'pending' ? 'Certificat médical' : null,
    organizer_email: entry.races.events.organizer_email,
    organizer_phone: entry.races.events.organizer_phone,
    organizer_name: entry.races.events.organizer_name,
    participant_portal_url: `https://timepulse.fr/participant/${entry.id}`,
  };

  const subject = subjectTemplate(templateData);
  const html = htmlTemplate(templateData);

  // Queue email
  await supabase.from('email_queue').insert({
    entry_id: entryId,
    to_email: toEmail,
    subject,
    template_id: manualEntryConfirmationTemplate.id,
    template_data: templateData,
    status: 'pending',
  });
}

function formatOptions(options: Record<string, any>): string {
  return Object.entries(options)
    .map(([key, value]) => `${key}: ${value}`)
    .join(', ');
}
```

### Email Sending Policy

```typescript
// Conditions d'envoi
export const EMAIL_POLICY = {
  // Envoi immédiat si email présent ET toggle activé
  immediate: {
    condition: (email?: string, sendEmail?: boolean) => !!email && sendEmail !== false,
    template: 'manual_entry_confirmation',
  },

  // Re-envoi manuel (max 5 fois)
  resend: {
    max_count: 5,
    cooldown_minutes: 5,
  },

  // Retry automatique en cas d'échec
  retry: {
    max_retries: 3,
    backoff_minutes: [5, 15, 60],
  },
};
```

---

## 6. Audit

### Taxonomy d'Événements

```typescript
// lib/entries/audit-taxonomy.ts

export const ENTRY_AUDIT_ACTIONS = {
  // Création
  'entry.manual.created': 'Manual entry created',
  'entry.manual.bulk_imported': 'Bulk manual entries imported',

  // Modifications
  'entry.manual.updated': 'Manual entry updated',
  'entry.manual.athlete_updated': 'Athlete information updated',

  // Statuts
  'entry.manual.cancelled': 'Manual entry cancelled',
  'entry.manual.transferred': 'Entry transferred to another race',

  // Documents
  'entry.docs.uploaded': 'Document uploaded',
  'entry.docs.validated': 'Document validated',
  'entry.docs.rejected': 'Document rejected',

  // Dossards
  'entry.bib.assigned': 'Bib number assigned',
  'entry.bib.reassigned': 'Bib number reassigned',
  'entry.bib.released': 'Bib number released',

  // Emails
  'entry.email.confirmation.sent': 'Confirmation email sent',
  'entry.email.confirmation.resent': 'Confirmation email resent',
  'entry.email.failed': 'Email failed to send',

  // Guards
  'guard.blocked.capacity': 'Entry blocked: capacity full',
  'guard.blocked.license_window': 'Entry blocked: license window closed',
  'guard.blocked.bib_lock': 'Entry blocked: bib assignments locked',
  'guard.warning.duplicate': 'Duplicate athlete detected',

  // Overrides
  'override.capacity': 'Capacity limit overridden',
  'override.license_window': 'License window override',
  'override.bib_lock': 'Bib lock overridden',
  'override.started': 'Override session started',
  'override.ended': 'Override session ended',

  // Capacité
  'capacity.incremented': 'Capacity counter incremented',
  'capacity.decremented': 'Capacity counter decremented',
} as const;
```

### Audit Log Service

```typescript
// lib/entries/audit.ts
import { supabase } from '@/lib/supabase';
import crypto from 'crypto';

export interface AuditLogEntry {
  actor_id: string;
  actor_type: 'organizer' | 'timepulse_staff';
  action: string;
  entity_type: string;
  entity_id: string;
  before_state?: any;
  after_state?: any;
  reason?: string;
  override_type?: string;
  event_id?: string;
  race_id?: string;
  entry_id?: string;
}

export async function appendAuditLog(entry: AuditLogEntry) {
  // Get last record hash
  const { data: lastRecord } = await supabase
    .from('entry_audit_log')
    .select('record_hash')
    .order('timestamp_utc', { ascending: false })
    .limit(1)
    .maybeSingle();

  const timestamp = new Date();
  const previousHash = lastRecord?.record_hash || null;

  // Get actor email
  const { data: actor } = await supabase
    .from('admin_users')
    .select('email')
    .eq('id', entry.actor_id)
    .single();

  // Calculate record hash
  const recordData = JSON.stringify({
    timestamp: timestamp.toISOString(),
    actor: entry.actor_id,
    action: entry.action,
    entity: `${entry.entity_type}:${entry.entity_id}`,
    before: entry.before_state,
    after: entry.after_state,
    previous: previousHash || '',
  });

  const recordHash = crypto.createHash('sha256').update(recordData).digest('hex');

  // Insert audit log
  await supabase.from('entry_audit_log').insert({
    timestamp_utc: timestamp.toISOString(),
    actor_id: entry.actor_id,
    actor_type: entry.actor_type,
    actor_email: actor?.email,
    action: entry.action,
    entity_type: entry.entity_type,
    entity_id: entry.entity_id,
    before_state: entry.before_state,
    after_state: entry.after_state,
    reason: entry.reason,
    override_type: entry.override_type,
    previous_hash: previousHash,
    record_hash: recordHash,
    event_id: entry.event_id,
    race_id: entry.race_id,
    entry_id: entry.entry_id,
  });
}
```

### Exemples d'Audit Log (10 entrées)

```typescript
export const AUDIT_LOG_EXAMPLES = [
  {
    id: '1',
    timestamp_utc: '2025-10-14T10:00:00Z',
    actor_id: 'user_org_123',
    actor_type: 'organizer',
    actor_email: 'marie@organisateur.fr',
    action: 'entry.manual.created',
    entity_type: 'entry',
    entity_id: 'entry_001',
    after_state: {
      athlete: { first_name: 'Jean', last_name: 'DUPONT', birthdate: '1985-03-15' },
      race_id: 'race_10km',
      category: 'SE',
      status: 'confirmed',
    },
    reason: 'Invité organisateur',
    previous_hash: null,
    record_hash: 'abc123...',
    event_id: 'event_001',
    race_id: 'race_10km',
    entry_id: 'entry_001',
  },
  {
    id: '2',
    timestamp_utc: '2025-10-14T10:05:00Z',
    actor_id: 'user_org_123',
    actor_type: 'organizer',
    action: 'entry.bib.assigned',
    entity_type: 'entry',
    entity_id: 'entry_001',
    before_state: { bib_number: null },
    after_state: { bib_number: 1247 },
    previous_hash: 'abc123...',
    record_hash: 'def456...',
    entry_id: 'entry_001',
  },
  {
    id: '3',
    timestamp_utc: '2025-10-14T10:06:00Z',
    actor_id: 'user_org_123',
    actor_type: 'organizer',
    action: 'entry.email.confirmation.sent',
    entity_type: 'entry',
    entity_id: 'entry_001',
    after_state: { email: 'jean.dupont@example.com', sent_at: '2025-10-14T10:06:00Z' },
    previous_hash: 'def456...',
    record_hash: 'ghi789...',
    entry_id: 'entry_001',
  },
  {
    id: '4',
    timestamp_utc: '2025-10-14T11:00:00Z',
    actor_id: 'user_org_456',
    actor_type: 'organizer',
    action: 'guard.warning.duplicate',
    entity_type: 'entry',
    entity_id: 'entry_002',
    after_state: {
      duplicate_candidates: [
        { athlete_id: 'athlete_123', similarity: 0.92 },
      ],
    },
    reason: 'Potential duplicate detected during manual entry creation',
    previous_hash: 'ghi789...',
    record_hash: 'jkl012...',
    entry_id: 'entry_002',
  },
  {
    id: '5',
    timestamp_utc: '2025-10-14T12:00:00Z',
    actor_id: 'user_staff_001',
    actor_type: 'timepulse_staff',
    action: 'override.capacity',
    entity_type: 'capacity',
    entity_id: 'race_10km',
    before_state: { current: 300, max: 300, remaining: 0 },
    after_state: { current: 301, max: 300, remaining: -1 },
    reason: 'Late registration authorized by race director',
    override_type: 'capacity',
    previous_hash: 'jkl012...',
    record_hash: 'mno345...',
    race_id: 'race_10km',
  },
  {
    id: '6',
    timestamp_utc: '2025-10-14T13:00:00Z',
    actor_id: 'user_org_123',
    actor_type: 'organizer',
    action: 'entry.manual.bulk_imported',
    entity_type: 'bulk_import',
    entity_id: 'race_10km',
    after_state: { success_count: 238, error_count: 7, total: 245 },
    reason: 'CSV bulk import',
    previous_hash: 'mno345...',
    record_hash: 'pqr678...',
    race_id: 'race_10km',
  },
  {
    id: '7',
    timestamp_utc: '2025-10-14T14:00:00Z',
    actor_id: 'user_staff_002',
    actor_type: 'timepulse_staff',
    action: 'override.bib_lock',
    entity_type: 'entry',
    entity_id: 'entry_045',
    before_state: { bib_number: 1150 },
    after_state: { bib_number: 1250 },
    reason: 'Bib reassignment after lock date for error correction',
    override_type: 'bib_lock',
    previous_hash: 'pqr678...',
    record_hash: 'stu901...',
    entry_id: 'entry_045',
  },
  {
    id: '8',
    timestamp_utc: '2025-10-14T15:00:00Z',
    actor_id: 'user_org_123',
    actor_type: 'organizer',
    action: 'guard.blocked.license_window',
    entity_type: 'entry',
    entity_id: 'entry_pending',
    after_state: {
      blocked: true,
      license_type: 'FFA',
      window_closes_at: '2025-10-13T23:59:59Z',
    },
    reason: 'FFA license window closed',
    previous_hash: 'stu901...',
    record_hash: 'vwx234...',
  },
  {
    id: '9',
    timestamp_utc: '2025-10-14T16:00:00Z',
    actor_id: 'user_org_456',
    actor_type: 'organizer',
    action: 'entry.manual.cancelled',
    entity_type: 'entry',
    entity_id: 'entry_030',
    before_state: { status: 'confirmed' },
    after_state: { status: 'cancelled', cancelled_at: '2025-10-14T16:00:00Z' },
    reason: 'Athlete withdrawal - injury',
    previous_hash: 'vwx234...',
    record_hash: 'yz567...',
    entry_id: 'entry_030',
  },
  {
    id: '10',
    timestamp_utc: '2025-10-14T17:00:00Z',
    actor_id: 'user_org_123',
    actor_type: 'organizer',
    action: 'entry.email.confirmation.resent',
    entity_type: 'entry',
    entity_id: 'entry_001',
    after_state: {
      resend_count: 1,
      last_sent_at: '2025-10-14T17:00:00Z',
    },
    reason: 'Athlete requested email resend',
    previous_hash: 'yz567...',
    record_hash: 'abc890...',
    entry_id: 'entry_001',
  },
];
```
