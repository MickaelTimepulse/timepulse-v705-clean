/*
  # Normalisation automatique des données externes

  1. Trigger
    - Normalise automatiquement les noms, prénoms et clubs
    - Convertit les temps au bon format (HH:MM:SS)
    
  2. Fonctions
    - capitalize_first: Première lettre en majuscule, reste en minuscule
    - normalize_time: Convertit les temps en format HH:MM:SS
*/

-- Fonction pour capitaliser la première lettre
CREATE OR REPLACE FUNCTION capitalize_first(text)
RETURNS text AS $$
BEGIN
  RETURN INITCAP($1);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Fonction pour normaliser le temps (gérer différents formats)
CREATE OR REPLACE FUNCTION normalize_time_format(time_str text)
RETURNS text AS $$
DECLARE
  parts text[];
  hours int;
  minutes int;
  seconds int;
  first_part int;
  total_seconds int;
BEGIN
  IF time_str IS NULL OR time_str = '' THEN
    RETURN NULL;
  END IF;

  -- Supprimer les espaces
  time_str := TRIM(time_str);

  -- Si format HH:MM:SS déjà OK
  IF time_str ~ '^\d{2}:\d{2}:\d{2}$' THEN
    RETURN time_str;
  END IF;

  -- Si format H:MM:SS (ajouter 0 devant)
  IF time_str ~ '^\d{1}:\d{2}:\d{2}$' THEN
    RETURN '0' || time_str;
  END IF;

  -- Si format MM:SS - vérifier si c'est vraiment MM:SS ou HH:MM mal formaté
  IF time_str ~ '^\d{2}:\d{2}$' THEN
    parts := string_to_array(time_str, ':');
    first_part := parts[1]::int;

    -- Si la première partie est > 59, c'est probablement HH:MM (pas MM:SS)
    -- Sinon si < 60, c'est MM:SS donc on ajoute 00: devant
    IF first_part > 59 THEN
      -- Format était HH:MM, ajouter :00 à la fin
      RETURN time_str || ':00';
    ELSE
      -- Format MM:SS, ajouter 00: devant
      RETURN '00:' || time_str;
    END IF;
  END IF;

  -- Si format M:SS (ajouter 00:0 devant)
  IF time_str ~ '^\d{1}:\d{2}$' THEN
    RETURN '00:0' || time_str;
  END IF;

  -- Si format compact MMSS ou HMMSS (ex: 3156 = 31:56, 13520 = 1:35:20)
  IF time_str ~ '^\d{3,6}$' THEN
    total_seconds := time_str::int;

    -- Si 3 ou 4 chiffres: format MMSS (ex: 3156 = 31min 56sec)
    IF LENGTH(time_str) <= 4 THEN
      minutes := total_seconds / 100;
      seconds := total_seconds % 100;
      hours := 0;

      -- Si les minutes sont > 59, c'est probablement des heures
      IF minutes > 59 THEN
        hours := minutes / 60;
        minutes := minutes % 60;
      END IF;

      RETURN LPAD(hours::text, 2, '0') || ':' || LPAD(minutes::text, 2, '0') || ':' || LPAD(seconds::text, 2, '0');
    END IF;

    -- Si 5 ou 6 chiffres: format HMMSS ou HHMMSS (ex: 13520 = 1:35:20)
    IF LENGTH(time_str) >= 5 THEN
      seconds := total_seconds % 100;
      minutes := (total_seconds / 100) % 100;
      hours := total_seconds / 10000;

      RETURN LPAD(hours::text, 2, '0') || ':' || LPAD(minutes::text, 2, '0') || ':' || LPAD(seconds::text, 2, '0');
    END IF;
  END IF;

  -- Sinon retourner tel quel
  RETURN time_str;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Trigger pour normaliser automatiquement les données
CREATE OR REPLACE FUNCTION normalize_external_result()
RETURNS TRIGGER AS $$
BEGIN
  -- Nom en MAJUSCULES
  IF NEW.last_name IS NOT NULL THEN
    NEW.last_name := UPPER(TRIM(NEW.last_name));
  END IF;
  
  -- Prénom: Première lettre en majuscule
  IF NEW.first_name IS NOT NULL THEN
    NEW.first_name := capitalize_first(TRIM(NEW.first_name));
  END IF;
  
  -- Club en MAJUSCULES
  IF NEW.club IS NOT NULL THEN
    NEW.club := UPPER(TRIM(NEW.club));
  END IF;
  
  -- Normaliser le temps
  IF NEW.finish_time_display IS NOT NULL THEN
    NEW.finish_time_display := normalize_time_format(NEW.finish_time_display);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger
DROP TRIGGER IF EXISTS normalize_external_result_trigger ON external_results;

CREATE TRIGGER normalize_external_result_trigger
  BEFORE INSERT OR UPDATE ON external_results
  FOR EACH ROW
  EXECUTE FUNCTION normalize_external_result();

-- Normaliser les données existantes
UPDATE external_results SET
  last_name = UPPER(TRIM(last_name)),
  first_name = capitalize_first(TRIM(first_name)),
  club = CASE WHEN club IS NOT NULL THEN UPPER(TRIM(club)) ELSE NULL END,
  finish_time_display = normalize_time_format(finish_time_display)
WHERE last_name IS NOT NULL OR first_name IS NOT NULL;
