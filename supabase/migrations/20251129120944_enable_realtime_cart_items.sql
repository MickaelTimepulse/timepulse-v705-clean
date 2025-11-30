/*
  # Activer Realtime sur cart_items
  
  1. Modifications
    - Active les notifications Realtime sur la table cart_items
    - Permet la mise à jour en temps réel du compteur du panier
*/

-- Activer Realtime sur cart_items
ALTER PUBLICATION supabase_realtime ADD TABLE cart_items;
