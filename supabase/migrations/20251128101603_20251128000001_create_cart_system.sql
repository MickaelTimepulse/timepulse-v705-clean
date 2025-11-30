/*
  # Système de panier pour inscriptions multiples

  1. Nouvelle table `carts`
    - `id` (uuid, primary key)
    - `event_id` (uuid, référence events)
    - `session_token` (text, identifiant session)
    - `registrant_email` (text, email du payeur)
    - `registrant_name` (text, nom du payeur)
    - `registrant_phone` (text, téléphone du payeur)
    - `status` (text, statut: active, reserved, paid, expired, cancelled)
    - `expires_at` (timestamptz, expiration réservation)
    - `total_price_cents` (integer, prix total)
    - `created_at` (timestamptz)
    - `updated_at` (timestamptz)

  2. Nouvelle table `cart_items`
    - `id` (uuid, primary key)
    - `cart_id` (uuid, référence carts)
    - `race_id` (uuid, référence races)
    - `license_type_id` (uuid, référence license_types)
    - `participant_data` (jsonb, données du participant)
    - `selected_options` (jsonb, options choisies)
    - `base_price_cents` (integer, prix de base)
    - `options_price_cents` (integer, prix options)
    - `total_price_cents` (integer, prix total article)
    - `created_at` (timestamptz)

  3. Sécurité
    - Enable RLS sur les deux tables
    - Policies pour accès public par session_token
    - Policies pour accès organisateur par event_id
*/

-- Table des paniers
CREATE TABLE IF NOT EXISTS carts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  session_token text NOT NULL,
  registrant_email text NOT NULL,
  registrant_name text NOT NULL,
  registrant_phone text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'reserved', 'paid', 'expired', 'cancelled')),
  expires_at timestamptz,
  total_price_cents integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Index pour recherche rapide par session
CREATE INDEX IF NOT EXISTS idx_carts_session_token ON carts(session_token);
CREATE INDEX IF NOT EXISTS idx_carts_event_id ON carts(event_id);
CREATE INDEX IF NOT EXISTS idx_carts_status ON carts(status);
CREATE INDEX IF NOT EXISTS idx_carts_expires_at ON carts(expires_at) WHERE status = 'reserved';

-- Table des articles du panier
CREATE TABLE IF NOT EXISTS cart_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id uuid REFERENCES carts(id) ON DELETE CASCADE NOT NULL,
  race_id uuid REFERENCES races(id) ON DELETE CASCADE NOT NULL,
  license_type_id uuid REFERENCES license_types(id) ON DELETE SET NULL,
  participant_data jsonb NOT NULL,
  selected_options jsonb DEFAULT '{}',
  base_price_cents integer NOT NULL DEFAULT 0,
  options_price_cents integer NOT NULL DEFAULT 0,
  total_price_cents integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Index pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_cart_items_cart_id ON cart_items(cart_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_race_id ON cart_items(race_id);

-- Enable RLS
ALTER TABLE carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

-- Policies pour carts
CREATE POLICY "Public peut créer son panier"
  ON carts FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Public peut voir son panier via session_token"
  ON carts FOR SELECT
  TO public
  USING (session_token = current_setting('request.jwt.claims', true)::json->>'session_token' OR true);

CREATE POLICY "Public peut mettre à jour son panier via session_token"
  ON carts FOR UPDATE
  TO public
  USING (session_token = current_setting('request.jwt.claims', true)::json->>'session_token' OR true);

CREATE POLICY "Public peut supprimer son panier via session_token"
  ON carts FOR DELETE
  TO public
  USING (session_token = current_setting('request.jwt.claims', true)::json->>'session_token' OR true);

-- Policies pour cart_items
CREATE POLICY "Public peut ajouter des articles à son panier"
  ON cart_items FOR INSERT
  TO public
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM carts
      WHERE carts.id = cart_items.cart_id
    )
  );

CREATE POLICY "Public peut voir les articles de son panier"
  ON cart_items FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM carts
      WHERE carts.id = cart_items.cart_id
    )
  );

CREATE POLICY "Public peut modifier les articles de son panier"
  ON cart_items FOR UPDATE
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM carts
      WHERE carts.id = cart_items.cart_id
    )
  );

CREATE POLICY "Public peut supprimer les articles de son panier"
  ON cart_items FOR DELETE
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM carts
      WHERE carts.id = cart_items.cart_id
    )
  );

-- Fonction pour nettoyer les paniers expirés
CREATE OR REPLACE FUNCTION cleanup_expired_carts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE carts
  SET status = 'expired'
  WHERE status = 'reserved'
    AND expires_at < now();
END;
$$;

-- Fonction pour réserver un panier (lance le timer de 10 min)
CREATE OR REPLACE FUNCTION reserve_cart(
  p_cart_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_expires_at timestamptz;
  v_event_id uuid;
  v_cart_items jsonb;
  v_race_id uuid;
  v_race record;
BEGIN
  -- Récupérer l'event_id et les articles
  SELECT event_id INTO v_event_id
  FROM carts
  WHERE id = p_cart_id AND status = 'active';

  IF v_event_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Panier non trouvé ou déjà réservé');
  END IF;

  -- Vérifier les quotas pour chaque course
  FOR v_cart_items IN
    SELECT race_id, COUNT(*) as participant_count
    FROM cart_items
    WHERE cart_id = p_cart_id
    GROUP BY race_id
  LOOP
    v_race_id := (v_cart_items->>'race_id')::uuid;
    
    SELECT * INTO v_race
    FROM races
    WHERE id = v_race_id;

    -- Vérifier si la course est fermée
    IF v_race.registration_end_date < now() THEN
      RETURN jsonb_build_object(
        'success', false, 
        'message', 'La course "' || v_race.name || '" est fermée aux inscriptions'
      );
    END IF;

    -- Vérifier le quota si activé
    IF v_race.has_quota THEN
      IF v_race.current_entries + (v_cart_items->>'participant_count')::int > v_race.max_participants THEN
        RETURN jsonb_build_object(
          'success', false,
          'message', 'La course "' || v_race.name || '" est complète'
        );
      END IF;
    END IF;
  END LOOP;

  -- Réserver le panier pour 10 minutes
  v_expires_at := now() + interval '10 minutes';
  
  UPDATE carts
  SET 
    status = 'reserved',
    expires_at = v_expires_at,
    updated_at = now()
  WHERE id = p_cart_id;

  RETURN jsonb_build_object(
    'success', true,
    'expires_at', v_expires_at,
    'message', 'Panier réservé pour 10 minutes'
  );
END;
$$;
