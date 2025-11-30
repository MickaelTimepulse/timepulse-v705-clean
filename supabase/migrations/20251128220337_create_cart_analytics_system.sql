/*
  # Système d'analytics pour les paniers (Cart Analytics)

  1. Nouvelle table `cart_analytics`
    - Tracking des transitions de statut
    - Métriques de conversion (temps avant réservation, paiement)
    - Identification des étapes d'abandon
    - Historique complet pour analytics

  2. Trigger automatique
    - Enregistrement de chaque changement de statut
    - Calcul automatique des métriques temporelles
    - Détection de l'étape d'abandon

  3. Vues SQL pour admin et organisateurs
    - `admin_carts_overview`: Vue globale tous paniers
    - `organizer_carts_overview`: Vue filtrée par organisateur

  4. Fonctions d'analytics
    - `get_cart_metrics()`: Métriques agrégées par période
    - `get_cart_funnel()`: Tunnel de conversion

  5. Sécurité
    - RLS activé sur cart_analytics
    - Policies admin et organisateurs
*/

-- =====================================================
-- 1. TABLE CART_ANALYTICS
-- =====================================================

CREATE TABLE IF NOT EXISTS cart_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id UUID REFERENCES carts(id) ON DELETE CASCADE NOT NULL,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,

  -- Tracking des transitions de statut
  status_transitions JSONB DEFAULT '[]'::jsonb,

  -- Étape d'abandon (si applicable)
  abandonment_stage TEXT CHECK (abandonment_stage IN ('cart_creation', 'adding_items', 'reservation', 'payment_page')),

  -- Compteurs
  total_items INTEGER DEFAULT 0,
  final_price_cents INTEGER DEFAULT 0,

  -- Métriques temporelles (en secondes)
  time_to_first_item_seconds INTEGER,
  time_to_reservation_seconds INTEGER,
  time_to_payment_seconds INTEGER,

  -- Métadonnées
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_cart_analytics_cart_id ON cart_analytics(cart_id);
CREATE INDEX IF NOT EXISTS idx_cart_analytics_event_id ON cart_analytics(event_id);
CREATE INDEX IF NOT EXISTS idx_cart_analytics_abandonment ON cart_analytics(abandonment_stage) WHERE abandonment_stage IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_cart_analytics_created_at ON cart_analytics(created_at);

-- Enable RLS
ALTER TABLE cart_analytics ENABLE ROW LEVEL SECURITY;

-- Policies pour cart_analytics
CREATE POLICY "Admin peut tout voir sur cart_analytics"
  ON cart_analytics FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
    )
  );

CREATE POLICY "Organisateurs peuvent voir leurs analytics"
  ON cart_analytics FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM events e
      JOIN organizers o ON o.id = e.organizer_id
      WHERE e.id = cart_analytics.event_id
        AND o.id = auth.uid()
    )
  );

-- =====================================================
-- 2. TRIGGER POUR LOGGING DES TRANSITIONS
-- =====================================================

CREATE OR REPLACE FUNCTION log_cart_transition()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_analytics_id UUID;
  v_transition JSONB;
  v_time_diff INTEGER;
BEGIN
  -- Si c'est un INSERT (nouveau cart), créer l'entrée analytics
  IF TG_OP = 'INSERT' THEN
    INSERT INTO cart_analytics (
      cart_id,
      event_id,
      status_transitions,
      created_at
    ) VALUES (
      NEW.id,
      NEW.event_id,
      jsonb_build_array(
        jsonb_build_object(
          'from', NULL,
          'to', NEW.status,
          'at', now()
        )
      ),
      NEW.created_at
    );
    RETURN NEW;
  END IF;

  -- Si c'est un UPDATE avec changement de statut
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    -- Récupérer l'ID analytics
    SELECT id INTO v_analytics_id
    FROM cart_analytics
    WHERE cart_id = NEW.id;

    -- Si pas trouvé, créer l'entrée
    IF v_analytics_id IS NULL THEN
      INSERT INTO cart_analytics (cart_id, event_id, created_at)
      VALUES (NEW.id, NEW.event_id, OLD.created_at)
      RETURNING id INTO v_analytics_id;
    END IF;

    -- Construire l'objet transition
    v_transition := jsonb_build_object(
      'from', OLD.status,
      'to', NEW.status,
      'at', now()
    );

    -- Calculer le temps écoulé depuis la création
    v_time_diff := EXTRACT(EPOCH FROM (now() - OLD.created_at))::INTEGER;

    -- Mettre à jour cart_analytics
    UPDATE cart_analytics
    SET
      status_transitions = status_transitions || v_transition,
      updated_at = now(),

      -- Mettre à jour les métriques temporelles
      time_to_reservation_seconds = CASE
        WHEN NEW.status = 'reserved' AND time_to_reservation_seconds IS NULL
        THEN v_time_diff
        ELSE time_to_reservation_seconds
      END,

      time_to_payment_seconds = CASE
        WHEN NEW.status = 'paid' AND time_to_payment_seconds IS NULL
        THEN v_time_diff
        ELSE time_to_payment_seconds
      END,

      -- Déterminer l'étape d'abandon
      abandonment_stage = CASE
        WHEN NEW.status IN ('expired', 'cancelled') THEN
          CASE OLD.status
            WHEN 'active' THEN 'adding_items'
            WHEN 'reserved' THEN 'payment_page'
            ELSE abandonment_stage
          END
        ELSE abandonment_stage
      END
    WHERE id = v_analytics_id;
  END IF;

  RETURN NEW;
END;
$$;

-- Créer le trigger sur INSERT et UPDATE
DROP TRIGGER IF EXISTS cart_transition_logger ON carts;
CREATE TRIGGER cart_transition_logger
  AFTER INSERT OR UPDATE ON carts
  FOR EACH ROW
  EXECUTE FUNCTION log_cart_transition();

-- =====================================================
-- 3. TRIGGER POUR COMPTAGE DES ITEMS
-- =====================================================

CREATE OR REPLACE FUNCTION update_cart_analytics_items()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_cart_id UUID;
  v_item_count INTEGER;
  v_total_price INTEGER;
  v_time_diff INTEGER;
BEGIN
  -- Récupérer le cart_id
  IF TG_OP = 'DELETE' THEN
    v_cart_id := OLD.cart_id;
  ELSE
    v_cart_id := NEW.cart_id;
  END IF;

  -- Compter les items et calculer le total
  SELECT
    COUNT(*),
    COALESCE(SUM(total_price_cents), 0)
  INTO v_item_count, v_total_price
  FROM cart_items
  WHERE cart_id = v_cart_id;

  -- Calculer le temps depuis la création du cart
  SELECT EXTRACT(EPOCH FROM (now() - c.created_at))::INTEGER
  INTO v_time_diff
  FROM carts c
  WHERE c.id = v_cart_id;

  -- Mettre à jour cart_analytics
  UPDATE cart_analytics
  SET
    total_items = v_item_count,
    final_price_cents = v_total_price,
    updated_at = now(),
    time_to_first_item_seconds = CASE
      WHEN time_to_first_item_seconds IS NULL AND v_item_count > 0
      THEN v_time_diff
      ELSE time_to_first_item_seconds
    END
  WHERE cart_id = v_cart_id;

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Trigger sur cart_items
DROP TRIGGER IF EXISTS cart_items_analytics_update ON cart_items;
CREATE TRIGGER cart_items_analytics_update
  AFTER INSERT OR UPDATE OR DELETE ON cart_items
  FOR EACH ROW
  EXECUTE FUNCTION update_cart_analytics_items();

-- =====================================================
-- 4. VUE ADMIN_CARTS_OVERVIEW
-- =====================================================

CREATE OR REPLACE VIEW admin_carts_overview AS
SELECT
  c.id,
  c.event_id,
  e.name AS event_name,
  c.registrant_email,
  c.registrant_name,
  c.registrant_phone,
  c.status,
  c.total_price_cents,
  c.created_at,
  c.updated_at,
  c.expires_at,
  COALESCE(items.item_count, 0) AS participant_count,
  ca.time_to_reservation_seconds,
  ca.time_to_payment_seconds,
  ca.abandonment_stage,
  EXTRACT(EPOCH FROM (now() - c.created_at))::INTEGER AS age_seconds
FROM carts c
LEFT JOIN events e ON e.id = c.event_id
LEFT JOIN (
  SELECT cart_id, COUNT(*) AS item_count
  FROM cart_items
  GROUP BY cart_id
) items ON items.cart_id = c.id
LEFT JOIN cart_analytics ca ON ca.cart_id = c.id;

-- =====================================================
-- 5. VUE ORGANIZER_CARTS_OVERVIEW
-- =====================================================

CREATE OR REPLACE VIEW organizer_carts_overview AS
SELECT
  c.id,
  c.event_id,
  e.name AS event_name,
  e.organizer_id,
  c.registrant_email,
  c.registrant_name,
  c.status,
  c.total_price_cents,
  c.created_at,
  c.expires_at,
  COALESCE(items.item_count, 0) AS participant_count,
  EXTRACT(EPOCH FROM (now() - c.created_at))::INTEGER AS age_seconds
FROM carts c
LEFT JOIN events e ON e.id = c.event_id
LEFT JOIN (
  SELECT cart_id, COUNT(*) AS item_count
  FROM cart_items
  GROUP BY cart_id
) items ON items.cart_id = c.id;

-- =====================================================
-- 6. FONCTION GET_CART_METRICS
-- =====================================================

CREATE OR REPLACE FUNCTION get_cart_metrics(
  p_event_id UUID DEFAULT NULL,
  p_date_from TIMESTAMPTZ DEFAULT now() - INTERVAL '30 days',
  p_date_to TIMESTAMPTZ DEFAULT now()
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total_carts INTEGER;
  v_paid_carts INTEGER;
  v_abandoned_carts INTEGER;
  v_active_carts INTEGER;
  v_reserved_carts INTEGER;
  v_avg_basket_cents INTEGER;
  v_avg_items NUMERIC;
  v_conversion_rate NUMERIC;
  v_avg_time_to_payment INTEGER;
BEGIN
  -- Compter les paniers par statut
  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'paid'),
    COUNT(*) FILTER (WHERE status IN ('expired', 'cancelled')),
    COUNT(*) FILTER (WHERE status = 'active'),
    COUNT(*) FILTER (WHERE status = 'reserved'),
    AVG(total_price_cents)::INTEGER,
    AVG(COALESCE(ca.total_items, 0))
  INTO
    v_total_carts,
    v_paid_carts,
    v_abandoned_carts,
    v_active_carts,
    v_reserved_carts,
    v_avg_basket_cents,
    v_avg_items
  FROM carts c
  LEFT JOIN cart_analytics ca ON ca.cart_id = c.id
  WHERE c.created_at BETWEEN p_date_from AND p_date_to
    AND (p_event_id IS NULL OR c.event_id = p_event_id);

  -- Calculer le taux de conversion
  v_conversion_rate := CASE
    WHEN v_total_carts > 0 THEN ROUND((v_paid_carts::NUMERIC / v_total_carts * 100), 2)
    ELSE 0
  END;

  -- Temps moyen avant paiement
  SELECT AVG(time_to_payment_seconds)::INTEGER
  INTO v_avg_time_to_payment
  FROM cart_analytics
  WHERE time_to_payment_seconds IS NOT NULL
    AND created_at BETWEEN p_date_from AND p_date_to
    AND (p_event_id IS NULL OR event_id = p_event_id);

  -- Retourner le JSON
  RETURN jsonb_build_object(
    'total_carts', COALESCE(v_total_carts, 0),
    'paid_carts', COALESCE(v_paid_carts, 0),
    'abandoned_carts', COALESCE(v_abandoned_carts, 0),
    'active_carts', COALESCE(v_active_carts, 0),
    'reserved_carts', COALESCE(v_reserved_carts, 0),
    'conversion_rate', COALESCE(v_conversion_rate, 0),
    'avg_basket_cents', COALESCE(v_avg_basket_cents, 0),
    'avg_items', COALESCE(v_avg_items, 0),
    'avg_time_to_payment_seconds', v_avg_time_to_payment
  );
END;
$$;

-- =====================================================
-- 7. FONCTION GET_CART_FUNNEL
-- =====================================================

CREATE OR REPLACE FUNCTION get_cart_funnel(
  p_event_id UUID DEFAULT NULL,
  p_date_from TIMESTAMPTZ DEFAULT now() - INTERVAL '30 days',
  p_date_to TIMESTAMPTZ DEFAULT now()
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_carts_created INTEGER;
  v_carts_with_items INTEGER;
  v_carts_reserved INTEGER;
  v_carts_paid INTEGER;
BEGIN
  -- Étape 1: Paniers créés
  SELECT COUNT(*)
  INTO v_carts_created
  FROM carts
  WHERE created_at BETWEEN p_date_from AND p_date_to
    AND (p_event_id IS NULL OR event_id = p_event_id);

  -- Étape 2: Paniers avec au moins 1 item
  SELECT COUNT(DISTINCT c.id)
  INTO v_carts_with_items
  FROM carts c
  JOIN cart_items ci ON ci.cart_id = c.id
  WHERE c.created_at BETWEEN p_date_from AND p_date_to
    AND (p_event_id IS NULL OR c.event_id = p_event_id);

  -- Étape 3: Paniers réservés
  SELECT COUNT(*)
  INTO v_carts_reserved
  FROM carts
  WHERE created_at BETWEEN p_date_from AND p_date_to
    AND status IN ('reserved', 'paid')
    AND (p_event_id IS NULL OR event_id = p_event_id);

  -- Étape 4: Paniers payés
  SELECT COUNT(*)
  INTO v_carts_paid
  FROM carts
  WHERE created_at BETWEEN p_date_from AND p_date_to
    AND status = 'paid'
    AND (p_event_id IS NULL OR event_id = p_event_id);

  RETURN jsonb_build_object(
    'created', COALESCE(v_carts_created, 0),
    'with_items', COALESCE(v_carts_with_items, 0),
    'reserved', COALESCE(v_carts_reserved, 0),
    'paid', COALESCE(v_carts_paid, 0),
    'conversion_to_items', CASE WHEN v_carts_created > 0
      THEN ROUND((v_carts_with_items::NUMERIC / v_carts_created * 100), 2)
      ELSE 0 END,
    'conversion_to_reserved', CASE WHEN v_carts_with_items > 0
      THEN ROUND((v_carts_reserved::NUMERIC / v_carts_with_items * 100), 2)
      ELSE 0 END,
    'conversion_to_paid', CASE WHEN v_carts_reserved > 0
      THEN ROUND((v_carts_paid::NUMERIC / v_carts_reserved * 100), 2)
      ELSE 0 END
  );
END;
$$;