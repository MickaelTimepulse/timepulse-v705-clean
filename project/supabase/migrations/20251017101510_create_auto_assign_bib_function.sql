/*
  # Fonction d'attribution automatique des dossards

  1. Nouvelle fonction
    - `auto_assign_bib_number()` : Fonction trigger qui attribue automatiquement un dossard
      lors de la création d'une inscription si la configuration l'exige
    
  2. Logique
    - Vérifie si l'épreuve a une configuration de dossards en mode LIVE
    - Détermine le prochain numéro disponible selon le genre et la stratégie
    - Attribue le dossard à l'inscription
    
  3. Trigger
    - Se déclenche AVANT l'insertion d'une nouvelle inscription
    - Attribue automatiquement le dossard si configuré
*/

-- Fonction pour attribuer automatiquement un dossard
CREATE OR REPLACE FUNCTION auto_assign_bib_number()
RETURNS TRIGGER AS $$
DECLARE
  bib_config RECORD;
  next_bib INTEGER;
  athlete_gender TEXT;
BEGIN
  -- Récupérer la configuration des dossards pour cette épreuve
  SELECT * INTO bib_config
  FROM race_bib_config
  WHERE race_id = NEW.race_id;

  -- Si pas de configuration ou mode manuel, on ne fait rien
  IF bib_config IS NULL OR bib_config.mode = 'MANUAL' THEN
    RETURN NEW;
  END IF;

  -- Si le dossard est déjà attribué, on ne fait rien
  IF NEW.bib_number IS NOT NULL THEN
    RETURN NEW;
  END IF;

  -- Récupérer le genre de l'athlète
  SELECT gender INTO athlete_gender
  FROM athletes
  WHERE id = NEW.athlete_id;

  -- Déterminer le prochain numéro de dossard disponible
  IF athlete_gender = 'M' AND bib_config.range_male_from IS NOT NULL THEN
    -- Hommes : trouver le prochain numéro dans la plage masculine
    SELECT COALESCE(MAX(bib_number), bib_config.range_male_from - 1) + 1 INTO next_bib
    FROM entries
    WHERE race_id = NEW.race_id
      AND bib_number >= bib_config.range_male_from
      AND bib_number <= bib_config.range_male_to;
    
    -- Vérifier qu'on ne dépasse pas la plage
    IF next_bib > bib_config.range_male_to THEN
      RAISE EXCEPTION 'Plus de dossards disponibles pour les hommes dans cette épreuve';
    END IF;
    
  ELSIF athlete_gender = 'F' AND bib_config.range_female_from IS NOT NULL THEN
    -- Femmes : trouver le prochain numéro dans la plage féminine
    SELECT COALESCE(MAX(bib_number), bib_config.range_female_from - 1) + 1 INTO next_bib
    FROM entries
    WHERE race_id = NEW.race_id
      AND bib_number >= bib_config.range_female_from
      AND bib_number <= bib_config.range_female_to;
    
    -- Vérifier qu'on ne dépasse pas la plage
    IF next_bib > bib_config.range_female_to THEN
      RAISE EXCEPTION 'Plus de dossards disponibles pour les femmes dans cette épreuve';
    END IF;
    
  ELSIF bib_config.range_global_from IS NOT NULL THEN
    -- Plage globale : trouver le prochain numéro
    SELECT COALESCE(MAX(bib_number), bib_config.range_global_from - 1) + 1 INTO next_bib
    FROM entries
    WHERE race_id = NEW.race_id
      AND bib_number >= bib_config.range_global_from
      AND bib_number <= bib_config.range_global_to;
    
    -- Vérifier qu'on ne dépasse pas la plage
    IF next_bib > bib_config.range_global_to THEN
      RAISE EXCEPTION 'Plus de dossards disponibles dans cette épreuve';
    END IF;
  END IF;

  -- Attribuer le dossard
  NEW.bib_number := next_bib;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger
DROP TRIGGER IF EXISTS trigger_auto_assign_bib ON entries;
CREATE TRIGGER trigger_auto_assign_bib
  BEFORE INSERT ON entries
  FOR EACH ROW
  EXECUTE FUNCTION auto_assign_bib_number();
