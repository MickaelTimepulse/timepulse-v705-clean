/*
  # Réattribution des dossards par ordre alphabétique pour Les Foulées du Béluga

  1. Problème
    - Les dossards sont actuellement attribués par ordre chronologique
    - L'utilisateur veut un ordre alphabétique (nom, prénom)
    - Il manque aussi 73 participants (1299 attendus vs 1226 actuels)

  2. Solution
    - Réattribuer tous les dossards par ordre alphabétique (nom puis prénom)
    - Configurer la stratégie en mode ALPHABETICAL pour les futures inscriptions

  3. Notes
    - Les doublons d'email ne sont pas un problème (un parent peut inscrire plusieurs enfants)
    - Le tri se fait sur nom puis prénom
*/

-- Mettre à jour la configuration des dossards en mode ALPHABETICAL
UPDATE race_bib_config
SET 
  strategy = 'ALPHABETICAL',
  updated_at = NOW()
WHERE race_id IN (
  SELECT r.id
  FROM races r
  JOIN events e ON r.event_id = e.id
  WHERE e.slug = 'les-foulees-du-beluga-2025'
);

-- Réattribuer tous les dossards par ordre alphabétique
WITH ranked_entries AS (
  SELECT
    en.id,
    ROW_NUMBER() OVER (
      ORDER BY 
        a.last_name COLLATE "fr-FR-x-icu",
        a.first_name COLLATE "fr-FR-x-icu"
    ) as new_bib
  FROM entries en
  JOIN athletes a ON en.athlete_id = a.id
  JOIN races r ON en.race_id = r.id
  JOIN events e ON r.event_id = e.id
  WHERE e.slug = 'les-foulees-du-beluga-2025'
)
UPDATE entries e
SET bib_number = re.new_bib
FROM ranked_entries re
WHERE e.id = re.id;

-- Afficher un résumé
DO $$
DECLARE
  total_count INTEGER;
  with_bib_count INTEGER;
  event_name TEXT;
BEGIN
  SELECT 
    e.name,
    COUNT(en.id),
    COUNT(en.bib_number)
  INTO event_name, total_count, with_bib_count
  FROM events e
  JOIN races r ON r.event_id = e.id
  JOIN entries en ON en.race_id = r.id
  WHERE e.slug = 'les-foulees-du-beluga-2025'
  GROUP BY e.name;

  RAISE NOTICE '✅ Dossards réattribués par ordre alphabétique';
  RAISE NOTICE 'Événement: %', event_name;
  RAISE NOTICE 'Total inscriptions: %', total_count;
  RAISE NOTICE 'Avec dossard: %', with_bib_count;
END $$;
