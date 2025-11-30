/*
  # Corriger les temps compacts existants

  1. Problème
    - Les événements importés peuvent avoir des temps au format compact non converti
    - Exemple : "3156" au lieu de "00:31:56"

  2. Solution
    - Réappliquer la normalisation sur tous les temps existants
*/

-- Mettre à jour tous les temps qui sont encore au format compact (3-6 chiffres sans ":")
UPDATE external_results
SET finish_time_display = normalize_time_format(finish_time_display)
WHERE finish_time_display IS NOT NULL
  AND finish_time_display ~ '^\d{3,6}$';
