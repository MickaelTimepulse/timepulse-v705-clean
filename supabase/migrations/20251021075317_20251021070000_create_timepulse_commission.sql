/*
  # Système de Commission Timepulse pour Inscriptions en Ligne

  1. Nouvelle Table
    - `timepulse_commission_settings`
      - `id` (uuid, primary key)
      - `commission_cents` (integer) - Montant de la commission en centimes
      - `is_active` (boolean) - Si cette commission est active
      - `valid_from` (timestamptz) - Date d'application de cette commission
      - `valid_until` (timestamptz, nullable) - Date de fin (null = illimité)
      - `created_at` (timestamptz)
      - `created_by` (uuid) - Admin qui a créé cette configuration
      - `notes` (text) - Notes optionnelles sur ce changement de commission

  2. Modifications de entry_payments
    - Ajout de `amount_organizer_cents` - Montant revenant à l'organisateur (sans commission)
    - Ajout de `timepulse_commission_cents` - Commission Timepulse
    - Ajout de `total_amount_cents` - Montant total payé par l'athlète
    - Ajout de `stripe_payment_intent_id` - ID du paiement Stripe
    - Ajout de `stripe_charge_id` - ID de la charge Stripe
    - Modification de `payment_method` pour inclure 'apple_pay', 'google_pay', 'card'

  3. Sécurité
    - RLS sur timepulse_commission_settings : seuls les admins Timepulse peuvent gérer
    - Les organisateurs ne voient que `amount_organizer_cents` dans leurs exports

  4. Logique de Calcul
    - total_amount_cents = amount_organizer_cents + timepulse_commission_cents
    - Par défaut : commission = 99 centimes (0,99€)
*/

-- =====================================================
-- TABLE COMMISSION TIMEPULSE
-- =====================================================
CREATE TABLE IF NOT EXISTS timepulse_commission_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  commission_cents INTEGER NOT NULL DEFAULT 99 CHECK (commission_cents >= 0),
  is_active BOOLEAN DEFAULT true,
  valid_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES admin_users(id),
  notes TEXT,

  CONSTRAINT valid_date_range CHECK (valid_until IS NULL OR valid_until > valid_from)
);

CREATE INDEX IF NOT EXISTS idx_commission_active ON timepulse_commission_settings(is_active, valid_from) WHERE is_active = true;

-- Insérer la commission par défaut (0,99€)
INSERT INTO timepulse_commission_settings (commission_cents, is_active, notes, valid_from)
VALUES (99, true, 'Commission par défaut Timepulse', NOW())
ON CONFLICT DO NOTHING;

-- =====================================================
-- RLS COMMISSION SETTINGS
-- =====================================================
ALTER TABLE timepulse_commission_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins Timepulse can view commission settings"
  ON timepulse_commission_settings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.role = 'timepulse_staff'
      AND admin_users.is_active = true
    )
  );

CREATE POLICY "Admins Timepulse can create commission settings"
  ON timepulse_commission_settings FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.role = 'timepulse_staff'
      AND admin_users.is_active = true
    )
  );

CREATE POLICY "Admins Timepulse can update commission settings"
  ON timepulse_commission_settings FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.role = 'timepulse_staff'
      AND admin_users.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.role = 'timepulse_staff'
      AND admin_users.is_active = true
    )
  );

-- =====================================================
-- MODIFICATIONS ENTRY_PAYMENTS
-- =====================================================

-- Ajouter les colonnes pour la commission et le paiement en ligne
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'entry_payments' AND column_name = 'amount_organizer_cents'
  ) THEN
    ALTER TABLE entry_payments ADD COLUMN amount_organizer_cents INTEGER NOT NULL DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'entry_payments' AND column_name = 'timepulse_commission_cents'
  ) THEN
    ALTER TABLE entry_payments ADD COLUMN timepulse_commission_cents INTEGER NOT NULL DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'entry_payments' AND column_name = 'total_amount_cents'
  ) THEN
    ALTER TABLE entry_payments ADD COLUMN total_amount_cents INTEGER NOT NULL DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'entry_payments' AND column_name = 'stripe_payment_intent_id'
  ) THEN
    ALTER TABLE entry_payments ADD COLUMN stripe_payment_intent_id VARCHAR(255);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'entry_payments' AND column_name = 'stripe_charge_id'
  ) THEN
    ALTER TABLE entry_payments ADD COLUMN stripe_charge_id VARCHAR(255);
  END IF;
END $$;

-- Modifier la contrainte payment_method pour inclure les nouveaux modes
ALTER TABLE entry_payments DROP CONSTRAINT IF EXISTS entry_payments_payment_method_check;
ALTER TABLE entry_payments ADD CONSTRAINT entry_payments_payment_method_check
  CHECK (payment_method IN ('cash', 'check', 'bank_transfer', 'stripe', 'card', 'apple_pay', 'google_pay', 'manual'));

-- Migrer les données existantes : amount_paid devient amount_organizer_cents
UPDATE entry_payments
SET
  amount_organizer_cents = CAST(amount_paid AS INTEGER),
  total_amount_cents = CAST(amount_paid AS INTEGER),
  timepulse_commission_cents = 0
WHERE amount_organizer_cents = 0;

-- =====================================================
-- FONCTION : Obtenir la Commission Active
-- =====================================================
CREATE OR REPLACE FUNCTION get_active_commission()
RETURNS INTEGER AS $$
DECLARE
  commission_amount INTEGER;
BEGIN
  SELECT commission_cents INTO commission_amount
  FROM timepulse_commission_settings
  WHERE is_active = true
    AND valid_from <= NOW()
    AND (valid_until IS NULL OR valid_until > NOW())
  ORDER BY valid_from DESC
  LIMIT 1;

  RETURN COALESCE(commission_amount, 99);
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_active_commission() IS 'Retourne le montant de la commission Timepulse active en centimes';
