/*
  # Fix dossards manquants en production

  Ce script :
  1. Vérifie la configuration des dossards
  2. Crée une configuration si elle n'existe pas
  3. Attribue des dossards aux inscriptions existantes
*/

-- 1. Vérifier quelle est la course concernée (Les Foulées du Beluga 2025)
DO $$
DECLARE
  v_race_id UUID;
  v_event_id UUID;
  v_config_exists BOOLEAN;
  v_entries_count INTEGER;
  v_bibs_count INTEGER;
BEGIN
  -- Trouver l'événement "Les Foulées du Beluga 2025"
  SELECT id INTO v_event_id
  FROM events
  WHERE slug = 'les-foulees-du-beluga-2025'
  LIMIT 1;

  IF v_event_id IS NULL THEN
    RAISE NOTICE 'Événement non trouvé avec slug: les-foulees-du-beluga-2025';
    RETURN;
  END IF;

  RAISE NOTICE 'Événement trouvé: %', v_event_id;

  -- Trouver la première course de cet événement
  SELECT id INTO v_race_id
  FROM races
  WHERE event_id = v_event_id
  LIMIT 1;

  IF v_race_id IS NULL THEN
    RAISE NOTICE 'Aucune course trouvée pour cet événement';
    RETURN;
  END IF;

  RAISE NOTICE 'Course trouvée: %', v_race_id;

  -- Vérifier si une configuration existe
  SELECT EXISTS(
    SELECT 1 FROM race_bib_config WHERE race_id = v_race_id
  ) INTO v_config_exists;

  -- Compter les inscriptions
  SELECT COUNT(*) INTO v_entries_count
  FROM entries
  WHERE race_id = v_race_id;

  -- Compter les inscriptions avec dossard
  SELECT COUNT(*) INTO v_bibs_count
  FROM entries
  WHERE race_id = v_race_id AND bib_number IS NOT NULL;

  RAISE NOTICE 'Configuration existe: %', v_config_exists;
  RAISE NOTICE 'Nombre d''inscriptions: %', v_entries_count;
  RAISE NOTICE 'Nombre avec dossard: %', v_bibs_count;

  -- Créer la configuration si elle n'existe pas
  IF NOT v_config_exists THEN
    RAISE NOTICE 'Création de la configuration des dossards...';

    INSERT INTO race_bib_config (
      race_id,
      mode,
      range_global_from,
      range_global_to,
      created_at,
      updated_at
    ) VALUES (
      v_race_id,
      'BATCH', -- Mode BATCH pour permettre l'auto-assignation
      1,
      9999,
      NOW(),
      NOW()
    );

    RAISE NOTICE 'Configuration créée en mode BATCH';
  END IF;

  -- Attribuer des dossards aux inscriptions existantes sans dossard
  RAISE NOTICE 'Attribution des dossards aux inscriptions existantes...';

  WITH numbered_entries AS (
    SELECT
      id,
      ROW_NUMBER() OVER (ORDER BY created_at) as new_bib
    FROM entries
    WHERE race_id = v_race_id
      AND bib_number IS NULL
  )
  UPDATE entries e
  SET bib_number = ne.new_bib
  FROM numbered_entries ne
  WHERE e.id = ne.id;

  GET DIAGNOSTICS v_bibs_count = ROW_COUNT;
  RAISE NOTICE 'Dossards attribués: %', v_bibs_count;

END $$;

-- Vérification finale
SELECT
  e.name as event_name,
  r.name as race_name,
  COUNT(en.id) as total_entries,
  COUNT(en.bib_number) as entries_with_bib,
  COUNT(CASE WHEN en.bib_number IS NULL THEN 1 END) as entries_without_bib
FROM events e
JOIN races r ON r.event_id = e.id
JOIN entries en ON en.race_id = r.id
WHERE e.slug = 'les-foulees-du-beluga-2025'
GROUP BY e.name, r.name;
