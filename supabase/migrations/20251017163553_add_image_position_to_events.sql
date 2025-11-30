/*
  # Ajout du positionnement d'image pour les événements

  1. Nouvelles colonnes
    - `image_position_x` (numeric) : Position horizontale de l'image en pourcentage (0-100)
    - `image_position_y` (numeric) : Position verticale de l'image en pourcentage (0-100)
  
  2. Valeurs par défaut
    - Par défaut, l'image est centrée (50%, 50%)
  
  3. Notes
    - Ces valeurs permettent de contrôler quelle partie de l'image est visible
    - Utilisé pour le positionnement avec object-position CSS
*/

-- Ajout des colonnes de position d'image
ALTER TABLE events 
  ADD COLUMN IF NOT EXISTS image_position_x numeric DEFAULT 50,
  ADD COLUMN IF NOT EXISTS image_position_y numeric DEFAULT 50;

-- Mise à jour des événements existants avec la position centrée par défaut
UPDATE events 
SET image_position_x = 50, image_position_y = 50 
WHERE image_position_x IS NULL OR image_position_y IS NULL;
