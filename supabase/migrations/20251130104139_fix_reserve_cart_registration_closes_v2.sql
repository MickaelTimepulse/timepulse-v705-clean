/*
  # Correction de reserve_cart : utiliser registration_closes de events

  1. Corrections
    - Vérifier registration_closes depuis la table events, pas races
    - Utiliser des variables scalaires pour registration_closes

  2. Comportement
    - Vérifie si l'événement est encore ouvert aux inscriptions
    - Vérifie les quotas disponibles par course
    - Réserve le panier pour 10 minutes
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
  v_registration_closes timestamptz;
  v_cart_item record;
  v_race record;
  v_current_entries integer;
BEGIN
  -- Récupérer l'event_id et la date de clôture des inscriptions
  SELECT c.event_id, e.registration_closes
  INTO v_event_id, v_registration_closes
  FROM carts c
  JOIN events e ON e.id = c.event_id
  WHERE c.id = p_cart_id AND c.status IN ('active', 'reserved');

  IF v_event_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Panier non trouvé ou déjà expiré');
  END IF;

  -- Vérifier si les inscriptions sont fermées pour cet événement
  IF v_registration_closes IS NOT NULL AND v_registration_closes < now() THEN
    RETURN jsonb_build_object(
      'success', false, 
      'message', 'Les inscriptions sont fermées pour cet événement'
    );
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
