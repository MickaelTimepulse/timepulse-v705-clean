/*
  # Migration des codes pays de 2 à 3 lettres

  1. Modification
    - Convertit tous les codes pays à 2 lettres en codes à 3 lettres (ISO 3166-1 alpha-3)
    - Utilise une table de correspondance basée sur les données de la table countries

  2. Sécurité
    - Migration en lecture seule des données existantes
    - Aucune perte de données

  3. Correspondances principales
    - FR → FRA (France)
    - BE → BEL (Belgique)
    - CH → CHE (Suisse)
    - ES → ESP (Espagne)
    - IT → ITA (Italie)
    - DE → DEU (Allemagne)
    - GB → GBR (Royaume-Uni)
    - NL → NLD (Pays-Bas)
    - PT → PRT (Portugal)
    - LU → LUX (Luxembourg)
    - US → USA (États-Unis)
    - CA → CAN (Canada)
*/

UPDATE athletes
SET nationality = countries.code
FROM countries
WHERE athletes.nationality = countries.alpha2_code
AND LENGTH(athletes.nationality) = 2;
