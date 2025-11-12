/*
  # Ajout du montant et système de remboursement pour les inscriptions

  1. Modifications de la table entries
    - Ajout de `amount` (numeric) : Montant total payé en euros
    - Ajout de `paid_at` (timestamptz) : Date du paiement confirmé
    - Ajout de `refund_status` (text) : Statut du remboursement (none, partial, full)
    - Ajout de `refund_amount` (numeric) : Montant remboursé en euros
    - Ajout de `refund_transaction_fees` (boolean) : Si les frais de transaction ont été remboursés
    - Ajout de `refund_requested_at` (timestamptz) : Date de demande de remboursement
    - Ajout de `refund_completed_at` (timestamptz) : Date de finalisation du remboursement
    - Ajout de `refund_notes` (text) : Notes sur le remboursement

  2. Mise à jour de la fonction admin_get_all_entries
    - Inclure les champs de montant et de remboursement dans les résultats

  3. Notes
    - Les montants sont stockés en euros (pas en centimes)
    - Le refund_status permet de suivre l'état des remboursements
    - Les frais de transaction Lyra sont environ 1.4% + 0.25€ par transaction
*/

-- Ajouter les colonnes de montant et remboursement à la table entries
ALTER TABLE entries 
  ADD COLUMN IF NOT EXISTS amount numeric DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS paid_at timestamptz,
  ADD COLUMN IF NOT EXISTS refund_status text DEFAULT 'none' CHECK (refund_status IN ('none', 'partial', 'full')),
  ADD COLUMN IF NOT EXISTS refund_amount numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS refund_transaction_fees boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS refund_requested_at timestamptz,
  ADD COLUMN IF NOT EXISTS refund_completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS refund_notes text;

-- Supprimer l'ancienne fonction pour pouvoir la recréer avec de nouveaux champs
DROP FUNCTION IF EXISTS admin_get_all_entries();

-- Recréer la fonction admin pour inclure les nouveaux champs
CREATE OR REPLACE FUNCTION admin_get_all_entries()
RETURNS TABLE (
  id uuid,
  race_id uuid,
  event_id uuid,
  event_name text,
  event_city text,
  race_name text,
  bib_number integer,
  first_name text,
  last_name text,
  gender text,
  birthdate date,
  email text,
  phone_mobile text,
  nationality_code text,
  license_number text,
  club text,
  category text,
  status text,
  amount numeric,
  paid_at timestamptz,
  refund_status text,
  refund_amount numeric,
  created_at timestamptz
) 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.id,
    e.race_id,
    ev.id as event_id,
    ev.name as event_name,
    ev.city as event_city,
    r.name as race_name,
    e.bib_number,
    a.first_name,
    a.last_name,
    a.gender,
    a.birth_date as birthdate,
    a.email,
    a.phone_mobile,
    a.nationality_code,
    a.license_number,
    a.club,
    '' as category,
    e.status,
    e.amount,
    e.paid_at,
    e.refund_status,
    e.refund_amount,
    e.created_at
  FROM entries e
  JOIN races r ON r.id = e.race_id
  JOIN events ev ON ev.id = r.event_id
  JOIN athletes a ON a.id = e.athlete_id
  ORDER BY e.created_at DESC;
END;
$$;

-- Commentaires pour documentation
COMMENT ON COLUMN entries.amount IS 'Montant total payé en euros';
COMMENT ON COLUMN entries.paid_at IS 'Date et heure du paiement confirmé';
COMMENT ON COLUMN entries.refund_status IS 'Statut du remboursement: none, partial, full';
COMMENT ON COLUMN entries.refund_amount IS 'Montant remboursé en euros';
COMMENT ON COLUMN entries.refund_transaction_fees IS 'Indique si les frais de transaction ont été remboursés';
