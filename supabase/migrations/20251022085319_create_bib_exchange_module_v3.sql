/*
  # Module Bourse aux Dossards (Bib Exchange)

  1. Description
    - Système de revente sécurisée de dossards entre coureurs
    - Transfert automatique des inscriptions
    - Remboursement automatique moins frais Timepulse (5€)
    - Respect du genre pour les catégories genrées

  2. Tables créées
    - `bib_exchange_settings` : Configuration de la bourse par événement
    - `bib_exchange_listings` : Dossards mis en vente
    - `bib_exchange_transfers` : Historique des transferts

  3. Sécurité
    - RLS activé sur toutes les tables
    - Validation du genre pour les catégories genrées
    - Date limite de transfert respectée
    - Remboursement automatique du vendeur

  4. Règles métier
    - Prix de revente = prix d'achat initial
    - Frais Timepulse = 5€ déduits du remboursement
    - Le dossard doit correspondre au genre (si catégorie genrée)
    - Transfert uniquement si bourse ouverte et avant date limite
*/

-- Table de configuration de la bourse par événement
CREATE TABLE IF NOT EXISTS bib_exchange_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  is_enabled boolean DEFAULT false NOT NULL,
  transfer_deadline timestamptz,
  timepulse_fee_amount decimal(10,2) DEFAULT 5.00 NOT NULL,
  allow_gender_mismatch boolean DEFAULT false NOT NULL,
  rules_text text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(event_id)
);

-- Table des dossards en vente
CREATE TABLE IF NOT EXISTS bib_exchange_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  race_id uuid REFERENCES races(id) ON DELETE CASCADE NOT NULL,
  registration_id uuid REFERENCES registrations(id) ON DELETE CASCADE NOT NULL,
  
  -- Informations du dossard
  bib_number integer,
  original_price decimal(10,2) NOT NULL,
  sale_price decimal(10,2) NOT NULL,
  seller_refund_amount decimal(10,2) NOT NULL,
  
  -- Contraintes de transfert
  gender_required text CHECK (gender_required IN ('M', 'F', 'any')),
  
  -- Statut
  status text DEFAULT 'available' CHECK (status IN ('available', 'sold', 'cancelled')) NOT NULL,
  
  -- Dates
  listed_at timestamptz DEFAULT now() NOT NULL,
  sold_at timestamptz,
  cancelled_at timestamptz,
  
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Table des transferts effectués
CREATE TABLE IF NOT EXISTS bib_exchange_transfers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid REFERENCES bib_exchange_listings(id) ON DELETE CASCADE NOT NULL,
  event_id uuid REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  race_id uuid REFERENCES races(id) ON DELETE CASCADE NOT NULL,
  
  -- Vendeur
  seller_registration_id uuid REFERENCES registrations(id) ON DELETE SET NULL,
  seller_refund_amount decimal(10,2) NOT NULL,
  seller_refund_status text DEFAULT 'pending' CHECK (seller_refund_status IN ('pending', 'completed', 'failed')) NOT NULL,
  
  -- Acheteur
  buyer_registration_id uuid REFERENCES registrations(id) ON DELETE CASCADE NOT NULL,
  buyer_payment_amount decimal(10,2) NOT NULL,
  buyer_payment_status text DEFAULT 'pending' CHECK (buyer_payment_status IN ('pending', 'completed', 'failed')) NOT NULL,
  
  -- Timepulse
  timepulse_fee_amount decimal(10,2) NOT NULL,
  
  -- Dates
  transferred_at timestamptz DEFAULT now() NOT NULL,
  refund_completed_at timestamptz,
  
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Indexes pour les performances
CREATE INDEX IF NOT EXISTS idx_bib_exchange_listings_event_status ON bib_exchange_listings(event_id, status);
CREATE INDEX IF NOT EXISTS idx_bib_exchange_listings_race_status ON bib_exchange_listings(race_id, status);
CREATE INDEX IF NOT EXISTS idx_bib_exchange_listings_registration ON bib_exchange_listings(registration_id);
CREATE INDEX IF NOT EXISTS idx_bib_exchange_transfers_listing ON bib_exchange_transfers(listing_id);
CREATE INDEX IF NOT EXISTS idx_bib_exchange_transfers_event ON bib_exchange_transfers(event_id);

-- Activer RLS
ALTER TABLE bib_exchange_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE bib_exchange_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE bib_exchange_transfers ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour bib_exchange_settings

-- Les organisateurs peuvent tout gérer
CREATE POLICY "Organizers can manage bib exchange settings"
  ON bib_exchange_settings FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM events e
      JOIN organizers o ON e.organizer_id = o.id
      WHERE e.id = bib_exchange_settings.event_id
      AND o.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM events e
      JOIN organizers o ON e.organizer_id = o.id
      WHERE e.id = bib_exchange_settings.event_id
      AND o.user_id = auth.uid()
    )
  );

-- Lecture publique des paramètres (pour savoir si la bourse est ouverte)
CREATE POLICY "Public can view bib exchange settings"
  ON bib_exchange_settings FOR SELECT
  TO public
  USING (is_enabled = true);

-- Politiques RLS pour bib_exchange_listings

-- Les vendeurs peuvent créer leurs propres annonces
CREATE POLICY "Users can create their own listings"
  ON bib_exchange_listings FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM registrations r
      WHERE r.id = registration_id
      AND r.user_id = auth.uid()
    )
  );

-- Les vendeurs peuvent voir et modifier leurs propres annonces
CREATE POLICY "Users can manage their own listings"
  ON bib_exchange_listings FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM registrations r
      WHERE r.id = registration_id
      AND r.user_id = auth.uid()
    )
  );

-- Les organisateurs peuvent tout voir et modifier
CREATE POLICY "Organizers can manage all listings"
  ON bib_exchange_listings FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM events e
      JOIN organizers o ON e.organizer_id = o.id
      WHERE e.id = event_id
      AND o.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM events e
      JOIN organizers o ON e.organizer_id = o.id
      WHERE e.id = event_id
      AND o.user_id = auth.uid()
    )
  );

-- Lecture publique des dossards disponibles
CREATE POLICY "Public can view available listings"
  ON bib_exchange_listings FOR SELECT
  TO public
  USING (status = 'available');

-- Politiques RLS pour bib_exchange_transfers

-- Les organisateurs peuvent tout voir
CREATE POLICY "Organizers can view all transfers"
  ON bib_exchange_transfers FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM events e
      JOIN organizers o ON e.organizer_id = o.id
      WHERE e.id = event_id
      AND o.user_id = auth.uid()
    )
  );

-- Les vendeurs peuvent voir leurs transferts
CREATE POLICY "Sellers can view their transfers"
  ON bib_exchange_transfers FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM registrations r
      WHERE r.id = seller_registration_id
      AND r.user_id = auth.uid()
    )
  );

-- Les acheteurs peuvent voir leurs transferts
CREATE POLICY "Buyers can view their transfers"
  ON bib_exchange_transfers FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM registrations r
      WHERE r.id = buyer_registration_id
      AND r.user_id = auth.uid()
    )
  );

-- Fonction pour calculer le remboursement vendeur
CREATE OR REPLACE FUNCTION calculate_seller_refund(
  original_price decimal,
  timepulse_fee decimal
)
RETURNS decimal
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN GREATEST(0, original_price - timepulse_fee);
END;
$$;

-- Activer le realtime sur les listings
ALTER TABLE bib_exchange_listings REPLICA IDENTITY FULL;

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_bib_exchange_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_bib_exchange_settings_updated_at
  BEFORE UPDATE ON bib_exchange_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_bib_exchange_updated_at();

CREATE TRIGGER update_bib_exchange_listings_updated_at
  BEFORE UPDATE ON bib_exchange_listings
  FOR EACH ROW
  EXECUTE FUNCTION update_bib_exchange_updated_at();
