/*
  # Modifier l'opacité par défaut à 20%

  1. Changement
    - Modifier la valeur par défaut de color_opacity de 50% à 20%
    - Cela s'appliquera à tous les nouveaux templates créés
    
  2. Note
    - Les templates existants conservent leur opacité actuelle
    - Seuls les nouveaux templates auront 20% par défaut
*/

-- Modifier la valeur par défaut de color_opacity
ALTER TABLE email_templates 
ALTER COLUMN color_opacity SET DEFAULT 20;

-- Message de confirmation
DO $$
BEGIN
  RAISE NOTICE 'Opacité par défaut modifiée à 20 pour cent';
END $$;