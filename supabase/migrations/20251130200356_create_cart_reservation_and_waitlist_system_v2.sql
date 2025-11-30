/*
  # Système de réservation des places et file d'attente
  
  1. Modifications sur `races`
    - Ajouter `reserved_spots` : nombre de places réservées dans les paniers
    - Ajouter `confirmed_entries` : nombre d'inscriptions confirmées (payées)
    
  2. Nouvelle table `race_waitlist`
    - File d'attente pour les courses complètes
    - Position dans la file
    - Temps d'attente estimé
    - Notification newsletter bourse aux dossards
    
  3. Modifications sur `race_options`
    - Ajouter `reserved_quantity` : quantité réservée dans les paniers
    - Ajouter `confirmed_quantity` : quantité confirmée (payée)
    
  4. Fonctions
    - `check_race_availability()` : Vérifie la disponibilité
    - `reserve_cart_spots()` : Réserve des places lors de l'ajout au panier
    - `release_cart_spots()` : Libère des places lors de l'expiration du panier
    - `add_to_waitlist()` : Ajoute un participant à la file d'attente
    - `notify_next_in_waitlist()` : Notifie les premiers de la file quand une place se libère
    - `calculate_wait_time()` : Calcule le temps d'attente estimé
    
  5. Sécurité
    - RLS activé sur race_waitlist
    - Accès public en lecture pour voir sa position
*/

-- ============================================================
-- 1. MODIFICATIONS SUR LA TABLE races
-- ============================================================

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'races' AND column_name = 'reserved_spots'
  ) THEN
    ALTER TABLE races ADD COLUMN reserved_spots integer DEFAULT 0 NOT NULL;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'races' AND column_name = 'confirmed_entries'
  ) THEN
    ALTER TABLE races ADD COLUMN confirmed_entries integer DEFAULT 0 NOT NULL;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'races' AND column_name = 'has_quota'
  ) THEN
    ALTER TABLE races ADD COLUMN has_quota boolean DEFAULT false NOT NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_races_availability 
ON races(id, max_participants, reserved_spots, confirmed_entries) 
WHERE has_quota = true;

COMMENT ON COLUMN races.reserved_spots IS 'Nombre de places réservées dans les paniers actifs';
COMMENT ON COLUMN races.confirmed_entries IS 'Nombre d inscriptions confirmées (payées)';
COMMENT ON COLUMN races.has_quota IS 'Indique si cette course a un quota maximum';

-- ============================================================
-- 2. MODIFICATIONS SUR LA TABLE race_options
-- ============================================================

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'race_options' AND column_name = 'reserved_quantity'
  ) THEN
    ALTER TABLE race_options ADD COLUMN reserved_quantity integer DEFAULT 0 NOT NULL;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'race_options' AND column_name = 'confirmed_quantity'
  ) THEN
    ALTER TABLE race_options ADD COLUMN confirmed_quantity integer DEFAULT 0 NOT NULL;
  END IF;
END $$;

-- ============================================================
-- 3. TABLE race_waitlist (FILE D'ATTENTE)
-- ============================================================

CREATE TABLE IF NOT EXISTS race_waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  race_id uuid NOT NULL REFERENCES races(id) ON DELETE CASCADE,
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  
  email text NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  phone text,
  
  position integer NOT NULL,
  estimated_wait_minutes integer,
  
  subscribe_to_bib_exchange boolean DEFAULT false,
  
  status text DEFAULT 'waiting' CHECK (status IN ('waiting', 'notified', 'expired', 'registered')),
  notified_at timestamptz,
  expires_at timestamptz,
  
  session_token text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_waitlist_race_position 
ON race_waitlist(race_id, position) 
WHERE status = 'waiting';

CREATE INDEX IF NOT EXISTS idx_waitlist_email 
ON race_waitlist(email);

CREATE INDEX IF NOT EXISTS idx_waitlist_notified 
ON race_waitlist(race_id, status, notified_at) 
WHERE status = 'notified';

-- ============================================================
-- 4. RLS SUR race_waitlist
-- ============================================================

ALTER TABLE race_waitlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view waitlist"
  ON race_waitlist FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can add to waitlist"
  ON race_waitlist FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Admins manage waitlist"
  ON race_waitlist FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM admin_users WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid()))
  );

-- ============================================================
-- 5. FONCTION: Vérifier la disponibilité
-- ============================================================

CREATE OR REPLACE FUNCTION check_race_availability(
  p_race_id uuid,
  p_quantity integer DEFAULT 1
)
RETURNS jsonb AS $$
DECLARE
  v_race record;
  v_total_occupied integer;
  v_available integer;
  v_waitlist_count integer;
BEGIN
  SELECT 
    max_participants,
    has_quota,
    reserved_spots,
    confirmed_entries
  INTO v_race
  FROM races
  WHERE id = p_race_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('available', false, 'error', 'Course non trouvée');
  END IF;
  
  IF NOT v_race.has_quota THEN
    RETURN jsonb_build_object('available', true, 'spots_remaining', 999999, 'has_waitlist', false);
  END IF;
  
  v_total_occupied := v_race.confirmed_entries + v_race.reserved_spots;
  v_available := v_race.max_participants - v_total_occupied;
  
  SELECT COUNT(*) INTO v_waitlist_count FROM race_waitlist
  WHERE race_id = p_race_id AND status = 'waiting';
  
  RETURN jsonb_build_object(
    'available', v_available >= p_quantity,
    'spots_remaining', GREATEST(0, v_available),
    'total_capacity', v_race.max_participants,
    'confirmed_entries', v_race.confirmed_entries,
    'reserved_spots', v_race.reserved_spots,
    'has_waitlist', v_waitlist_count > 0,
    'waitlist_count', v_waitlist_count
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================================
-- 6. FONCTION: Réserver une place dans le panier
-- ============================================================

CREATE OR REPLACE FUNCTION reserve_cart_spots(p_cart_id uuid)
RETURNS jsonb AS $$
DECLARE
  v_item record;
  v_availability jsonb;
  v_option record;
BEGIN
  FOR v_item IN
    SELECT race_id, id, selected_options
    FROM cart_items
    WHERE cart_id = p_cart_id
  LOOP
    v_availability := check_race_availability(v_item.race_id, 1);
    
    IF NOT (v_availability->>'available')::boolean THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'race_full',
        'message', 'La course est complète',
        'availability', v_availability
      );
    END IF;
    
    UPDATE races
    SET reserved_spots = reserved_spots + 1
    WHERE id = v_item.race_id;
    
    IF v_item.selected_options IS NOT NULL THEN
      FOR v_option IN
        SELECT key, value FROM jsonb_each(v_item.selected_options)
      LOOP
        UPDATE race_options
        SET reserved_quantity = reserved_quantity + 1
        WHERE id = (v_option.value->>'option_id')::uuid
        AND max_quantity IS NOT NULL
        AND reserved_quantity + confirmed_quantity < max_quantity;
      END LOOP;
    END IF;
  END LOOP;
  
  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 7. FONCTION: Libérer les places d'un panier expiré
-- ============================================================

CREATE OR REPLACE FUNCTION release_cart_spots(p_cart_id uuid)
RETURNS void AS $$
DECLARE
  v_item record;
  v_option record;
BEGIN
  FOR v_item IN
    SELECT race_id, selected_options
    FROM cart_items
    WHERE cart_id = p_cart_id
  LOOP
    UPDATE races
    SET reserved_spots = GREATEST(0, reserved_spots - 1)
    WHERE id = v_item.race_id;
    
    IF v_item.selected_options IS NOT NULL THEN
      FOR v_option IN
        SELECT key, value FROM jsonb_each(v_item.selected_options)
      LOOP
        UPDATE race_options
        SET reserved_quantity = GREATEST(0, reserved_quantity - 1)
        WHERE id = (v_option.value->>'option_id')::uuid;
      END LOOP;
    END IF;
    
    PERFORM notify_next_in_waitlist(v_item.race_id);
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 8. FONCTION: Notifier le prochain dans la file
-- ============================================================

CREATE OR REPLACE FUNCTION notify_next_in_waitlist(p_race_id uuid)
RETURNS void AS $$
DECLARE
  v_next_person record;
  v_availability jsonb;
BEGIN
  v_availability := check_race_availability(p_race_id, 1);
  
  IF NOT (v_availability->>'available')::boolean THEN
    RETURN;
  END IF;
  
  SELECT * INTO v_next_person
  FROM race_waitlist
  WHERE race_id = p_race_id
  AND status = 'waiting'
  ORDER BY position ASC
  LIMIT 1;
  
  IF FOUND THEN
    UPDATE race_waitlist
    SET 
      status = 'notified',
      notified_at = now(),
      expires_at = now() + interval '10 minutes'
    WHERE id = v_next_person.id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 9. FONCTION: Ajouter à la file d'attente
-- ============================================================

CREATE OR REPLACE FUNCTION add_to_waitlist(
  p_race_id uuid,
  p_event_id uuid,
  p_email text,
  p_first_name text,
  p_last_name text,
  p_phone text DEFAULT NULL,
  p_session_token text DEFAULT NULL,
  p_subscribe_to_bib_exchange boolean DEFAULT false
)
RETURNS jsonb AS $$
DECLARE
  v_position integer;
  v_estimated_wait integer;
  v_waitlist_id uuid;
BEGIN
  SELECT COALESCE(MAX(position), 0) + 1 INTO v_position
  FROM race_waitlist
  WHERE race_id = p_race_id
  AND status = 'waiting';
  
  v_estimated_wait := calculate_wait_time(p_race_id, v_position);
  
  INSERT INTO race_waitlist (
    race_id, event_id, email, first_name, last_name, phone,
    position, estimated_wait_minutes, session_token, subscribe_to_bib_exchange
  ) VALUES (
    p_race_id, p_event_id, p_email, p_first_name, p_last_name, p_phone,
    v_position, v_estimated_wait, COALESCE(p_session_token, gen_random_uuid()::text), p_subscribe_to_bib_exchange
  )
  RETURNING id INTO v_waitlist_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'waitlist_id', v_waitlist_id,
    'position', v_position,
    'estimated_wait_minutes', v_estimated_wait
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 10. FONCTION: Calculer le temps d'attente estimé
-- ============================================================

CREATE OR REPLACE FUNCTION calculate_wait_time(
  p_race_id uuid,
  p_position integer
)
RETURNS integer AS $$
DECLARE
  v_avg_transaction_time integer := 5;
  v_cart_timeout integer := 10;
  v_reserved_spots integer;
BEGIN
  SELECT reserved_spots INTO v_reserved_spots
  FROM races
  WHERE id = p_race_id;
  
  RETURN (COALESCE(v_reserved_spots, 0) * v_cart_timeout) + (p_position * v_avg_transaction_time);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================================
-- 11. TRIGGER: Mettre à jour les compteurs lors du paiement
-- ============================================================

CREATE OR REPLACE FUNCTION update_race_counters_on_payment()
RETURNS trigger AS $$
BEGIN
  IF OLD.status = 'pending' AND NEW.status = 'confirmed' THEN
    UPDATE races
    SET 
      reserved_spots = GREATEST(0, reserved_spots - 1),
      confirmed_entries = confirmed_entries + 1
    WHERE id = NEW.race_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_race_counters_trigger ON entries;
CREATE TRIGGER update_race_counters_trigger
  AFTER UPDATE ON entries
  FOR EACH ROW
  EXECUTE FUNCTION update_race_counters_on_payment();

-- ============================================================
-- 12. MODIFIER expire_old_carts pour libérer les places
-- ============================================================

CREATE OR REPLACE FUNCTION expire_old_carts()
RETURNS void AS $$
DECLARE
  v_cart_id uuid;
BEGIN
  FOR v_cart_id IN
    SELECT id FROM carts
    WHERE status = 'active'
    AND expires_at < now()
  LOOP
    PERFORM release_cart_spots(v_cart_id);
    
    DELETE FROM cart_items
    WHERE cart_id = v_cart_id;
    
    UPDATE carts
    SET status = 'expired', updated_at = now()
    WHERE id = v_cart_id;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
