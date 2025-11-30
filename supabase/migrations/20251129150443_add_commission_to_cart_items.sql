/*
  # Ajouter la commission Timepulse aux cart_items

  1. Modifications
    - Ajoute `timepulse_commission_cents` à la table cart_items
    - Ajoute `total_with_commission_cents` pour le prix final incluant la commission
    
  2. Notes
    - La commission sera calculée côté frontend lors de l'ajout au panier
    - Le total du cart devra inclure toutes les commissions des items
*/

-- Ajouter les colonnes de commission
ALTER TABLE cart_items
ADD COLUMN IF NOT EXISTS timepulse_commission_cents INTEGER DEFAULT 0 NOT NULL,
ADD COLUMN IF NOT EXISTS total_with_commission_cents INTEGER GENERATED ALWAYS AS (total_price_cents + timepulse_commission_cents) STORED;

-- Ajouter un index pour les requêtes de somme
CREATE INDEX IF NOT EXISTS idx_cart_items_commission ON cart_items(cart_id, total_with_commission_cents);
