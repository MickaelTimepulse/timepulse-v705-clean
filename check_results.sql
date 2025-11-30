-- Vérifier les données d'un événement externe
SELECT 
  overall_rank,
  bib_number,
  first_name,
  last_name,
  gender,
  category,
  finish_time_display,
  gender_rank,
  category_rank
FROM external_results
WHERE external_event_id IN (
  SELECT id FROM external_events 
  WHERE slug LIKE '%varades%' OR name LIKE '%Varades%'
  LIMIT 1
)
ORDER BY overall_rank
LIMIT 10;
