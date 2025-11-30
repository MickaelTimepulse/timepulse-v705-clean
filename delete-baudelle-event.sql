-- Supprimer l'événement St Baudelle et tous ses résultats
-- À exécuter dans l'éditeur SQL de Supabase

-- Étape 1 : Trouver l'événement
SELECT id, name, slug, event_date
FROM external_events
WHERE name ILIKE '%baudelle%' OR slug ILIKE '%baudelle%';

-- Étape 2 : Supprimer les résultats d'abord (si nécessaire)
-- DELETE FROM external_results
-- WHERE external_event_id IN (
--   SELECT id FROM external_events WHERE name ILIKE '%baudelle%'
-- );

-- Étape 3 : Supprimer l'événement
DELETE FROM external_events
WHERE name ILIKE '%baudelle%' OR slug ILIKE '%baudelle%';

-- Vérification
SELECT COUNT(*) as events_restants FROM external_events;
