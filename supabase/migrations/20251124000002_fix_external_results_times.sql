/*
  # Corriger les temps mal formatés dans external_results
  
  1. Fix
    - Recalcule tous les temps avec la nouvelle logique
    - 31:56 reste 00:31:56 (MM:SS valide)
    - 52:36 devient 00:52:36 (MM:SS valide)
    - 75:30 devient 01:15:30 (> 59 minutes donc HH:MM)
*/

-- Réappliquer la fonction normalize_time_format corrigée
CREATE OR REPLACE FUNCTION normalize_time_format(time_str text)
RETURNS text AS $$
DECLARE
  parts text[];
  hours int;
  minutes int;
  seconds int;
  first_part int;
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

  -- Si format en secondes uniquement
  IF time_str ~ '^\d+$' THEN
    seconds := time_str::int;
    hours := seconds / 3600;
    minutes := (seconds % 3600) / 60;
    seconds := seconds % 60;
    RETURN LPAD(hours::text, 2, '0') || ':' || LPAD(minutes::text, 2, '0') || ':' || LPAD(seconds::text, 2, '0');
  END IF;

  -- Sinon retourner tel quel
  RETURN time_str;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- NE PAS recalculer automatiquement car les données actuelles sont déjà au format HH:MM:SS
-- Il faut que l'admin réimporte ou corrige manuellement via l'interface
