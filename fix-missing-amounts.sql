-- Script de correction des montants manquants et licences
-- À exécuter dans le SQL Editor de Supabase

-- 1. Afficher les inscriptions avec montant à 0€
SELECT
  e.id,
  e.bib_number as dossard,
  a.first_name as prénom,
  a.last_name as nom,
  e.amount as montant_actuel,
  e.race_id,
  r.name as course
FROM entries e
JOIN athletes a ON e.athlete_id = a.id
JOIN races r ON e.race_id = r.id
WHERE e.amount = 0 OR e.amount IS NULL
ORDER BY e.race_id, e.bib_number;

-- 2. Mettre à jour les montants à 0€ avec le tarif de base de la course
-- (Remplacer 'RACE_ID' par l'ID de votre course)
UPDATE entries e
SET amount = (
  SELECT COALESCE(rp.price_cents / 100.0, 25.0)
  FROM race_pricing rp
  WHERE rp.race_id = e.race_id
  AND rp.license_type_id IS NULL
  AND rp.start_date <= NOW()
  AND (rp.end_date IS NULL OR rp.end_date >= NOW())
  LIMIT 1
)
WHERE (e.amount = 0 OR e.amount IS NULL)
AND e.race_id = 'RACE_ID'; -- Remplacer par l'ID de la course

-- 3. Afficher les athlètes avec informations de licence
SELECT
  a.id,
  a.first_name,
  a.last_name,
  a.license_number as "N° licence",
  a.license_type as "Type licence",
  a.license_club as club
FROM athletes a
JOIN entries e ON e.athlete_id = a.id
WHERE e.race_id = 'RACE_ID' -- Remplacer par l'ID de la course
ORDER BY a.last_name, a.first_name;

-- 4. Si vous voulez mettre un montant fixe pour toutes les inscriptions d'une course :
-- UPDATE entries
-- SET amount = 25.00
-- WHERE race_id = 'RACE_ID'
-- AND (amount = 0 OR amount IS NULL);

-- 5. Vérification finale
SELECT
  r.name as course,
  COUNT(*) as total_inscriptions,
  COUNT(CASE WHEN e.amount = 0 OR e.amount IS NULL THEN 1 END) as montants_manquants,
  SUM(e.amount) as total_recette,
  AVG(e.amount) as montant_moyen
FROM entries e
JOIN races r ON e.race_id = r.id
GROUP BY r.id, r.name
ORDER BY r.name;
