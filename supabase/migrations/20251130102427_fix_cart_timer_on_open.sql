/*
  # Correction du timer de panier : démarre uniquement à l'ouverture

  1. Modifications
    - Supprimer le trigger qui définit expires_at automatiquement à la création
    - Le timer démarrera uniquement quand on appelle reserve_cart()
    - Les paniers 'active' n'ont plus de limite de temps
    - Les paniers 'reserved' ont 10 minutes pour payer

  2. Comportement
    - Ajout au panier → status='active', expires_at=NULL (pas de timer)
    - Ouverture du panier pour payer → appel reserve_cart() → status='reserved', expires_at=now()+10min
    - Timer visible dans l'UI seulement après ouverture du panier
*/

-- Supprimer le trigger qui définit expires_at automatiquement
DROP TRIGGER IF EXISTS set_cart_expiration_trigger ON carts;
DROP FUNCTION IF EXISTS set_cart_expiration();

-- Mettre à jour la fonction expire_old_carts pour ne gérer que les paniers 'reserved'
CREATE OR REPLACE FUNCTION expire_old_carts()
RETURNS void AS $$
BEGIN
  -- Supprimer les items des paniers réservés expirés
  DELETE FROM cart_items
  WHERE cart_id IN (
    SELECT id FROM carts
    WHERE status = 'reserved'
    AND expires_at < now()
  );

  -- Marquer les paniers réservés comme expirés
  UPDATE carts
  SET status = 'expired',
      updated_at = now()
  WHERE status = 'reserved'
    AND expires_at < now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: la fonction reserve_cart() existe déjà et gère la réservation avec timer
