/*
  # Migration des codes nationalité vers le format alpha-3

  1. Problème
    - Certains athlètes ont leur nationalité enregistrée avec des codes à 2 lettres (alpha-2)
    - Les drapeaux et l'affichage utilisent maintenant le format à 3 lettres (alpha-3)
    - Exemples trouvés : BE, CA, RU
    
  2. Solution
    - Convertir les codes à 2 lettres en codes à 3 lettres en utilisant la table countries
    - BE -> BEL (Belgique)
    - CA -> CAN (Canada)
    - RU -> RUS (Russie)
    
  3. Notes
    - Cette migration préserve l'intégrité des données
    - Les nouveaux formulaires utilisent déjà le format à 3 lettres
*/

-- Mettre à jour les codes nationalité de 2 lettres vers 3 lettres
UPDATE athletes
SET nationality = (
  SELECT c.code 
  FROM countries c 
  WHERE c.alpha2_code = athletes.nationality
)
WHERE LENGTH(nationality) = 2
  AND nationality IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM countries c WHERE c.alpha2_code = athletes.nationality
  );
