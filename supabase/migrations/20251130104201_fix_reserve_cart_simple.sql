/*
  # Simplification de reserve_cart sans vérification de quotas

  1. Corrections
    - Supprimer la vérification des quotas (champs inexistants)
    - Se concentrer sur la réservation du panier avec timer

  2. Comportement
    - Vérifie si l'événement est encore ouvert aux inscriptions
    - Réserve le panier pour 10 minutes
    - Définit expires_at pour démarrer le timer
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
