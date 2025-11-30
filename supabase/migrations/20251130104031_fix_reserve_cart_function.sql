/*
  # Correction de la fonction reserve_cart

  1. Corrections
    - Permettre la réservation d'un panier déjà 'reserved' (renouveler le timer)
    - Corriger la boucle de vérification des quotas (utiliser record au lieu de jsonb)
    - Améliorer la gestion des erreurs

  2. Comportement
    - Réserve un panier 'active' ou 'reserved' pour 10 minutes
    - Vérifie les quotas disponibles avant de réserver
    - Retourne un JSON avec success, expires_at et message
*/

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
  v_cart_item record;
  v_race record;
  v_current_entries integer;
BEGIN
  -- Récupérer l'event_id
  SELECT event_id INTO v_event_id
  FROM carts
  WHERE id = p_cart_id AND status IN ('active', 'reserved');

  IF v_event_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Panier non trouvé ou déjà expiré');
  END IF;

  -- Vérifier les quotas pour chaque course
  FOR v_cart_item IN
    SELECT race_id, COUNT(*) as participant_count
    FROM cart_items
    WHERE cart_id = p_cart_id
    GROUP BY race_id
  LOOP
    -- Récupérer les infos de la course
    SELECT * INTO v_race
    FROM races
    WHERE id = v_cart_item.race_id;

    IF NOT FOUND THEN
      RETURN jsonb_build_object(
        'success', false, 
        'message', 'Course non trouvée'
      );
    END IF;

    -- Vérifier si la course est fermée
    IF v_race.registration_end_date < now() THEN
      RETURN jsonb_build_object(
        'success', false, 
        'message', 'La course "' || v_race.name || '" est fermée aux inscriptions'
      );
    END IF;

    -- Vérifier le quota si activé
    IF v_race.has_quota THEN
      -- Compter les inscriptions actuelles confirmées
      SELECT COUNT(*) INTO v_current_entries
      FROM entries
      WHERE race_id = v_race.id
        AND status IN ('confirmed', 'paid');

      -- Vérifier si l'ajout des participants du panier dépasse le quota
      IF v_current_entries + v_cart_item.participant_count > v_race.max_participants THEN
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
