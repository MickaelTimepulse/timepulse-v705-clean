/*
  # Ajout du système d'expiration automatique des paniers

  1. Modifications
    - Ajouter un trigger pour définir expires_at automatiquement à 10 minutes lors de la création
    - Ajouter une fonction pour vider les paniers expirés
    - Ajouter un trigger pour supprimer automatiquement les cart_items des paniers expirés

  2. Sécurité
    - Les paniers expirent automatiquement après 10 minutes d'inactivité
    - Les items sont supprimés automatiquement des paniers expirés
*/

-- Fonction pour définir expires_at à 10 minutes lors de la création du panier
CREATE OR REPLACE FUNCTION set_cart_expiration()
RETURNS trigger AS $$
BEGIN
  -- Définir expires_at à 10 minutes dans le futur si non défini
  IF NEW.expires_at IS NULL AND NEW.status = 'active' THEN
    NEW.expires_at := now() + INTERVAL '10 minutes';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour définir expires_at automatiquement
DROP TRIGGER IF EXISTS set_cart_expiration_trigger ON carts;
CREATE TRIGGER set_cart_expiration_trigger
  BEFORE INSERT ON carts
  FOR EACH ROW
  EXECUTE FUNCTION set_cart_expiration();

-- Fonction pour marquer les paniers comme expirés et supprimer leurs items
CREATE OR REPLACE FUNCTION expire_old_carts()
RETURNS void AS $$
BEGIN
  -- Supprimer les items des paniers expirés
  DELETE FROM cart_items
  WHERE cart_id IN (
    SELECT id FROM carts
    WHERE status = 'active'
    AND expires_at < now()
  );

  -- Marquer les paniers comme expirés
  UPDATE carts
  SET status = 'expired',
      updated_at = now()
  WHERE status = 'active'
    AND expires_at < now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour étendre la durée de vie du panier (appelée lors de modifications)
CREATE OR REPLACE FUNCTION extend_cart_expiration(p_cart_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE carts
  SET expires_at = now() + INTERVAL '10 minutes',
      updated_at = now()
  WHERE id = p_cart_id
    AND status = 'active';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;