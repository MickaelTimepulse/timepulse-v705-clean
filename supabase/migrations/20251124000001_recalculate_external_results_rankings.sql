/*
  # Recalculer les rangs pour les résultats externes
  
  1. Fonction
    - Recalcule gender_rank et category_rank pour un événement
    - Utilisé après import ou modification des résultats
*/

-- Fonction pour recalculer les rangs d'un événement externe
CREATE OR REPLACE FUNCTION recalculate_external_event_rankings(event_id uuid)
RETURNS void AS $$
BEGIN
  -- Recalculer gender_rank
  WITH ranked_by_gender AS (
    SELECT 
      id,
      ROW_NUMBER() OVER (
        PARTITION BY gender 
        ORDER BY overall_rank
      ) as new_gender_rank
    FROM external_results
    WHERE external_event_id = event_id
      AND status = 'finished'
      AND gender IS NOT NULL
  )
  UPDATE external_results er
  SET gender_rank = rbg.new_gender_rank
  FROM ranked_by_gender rbg
  WHERE er.id = rbg.id;
  
  -- Recalculer category_rank
  WITH ranked_by_category AS (
    SELECT 
      id,
      ROW_NUMBER() OVER (
        PARTITION BY category 
        ORDER BY overall_rank
      ) as new_category_rank
    FROM external_results
    WHERE external_event_id = event_id
      AND status = 'finished'
      AND category IS NOT NULL
  )
  UPDATE external_results er
  SET category_rank = rbc.new_category_rank
  FROM ranked_by_category rbc
  WHERE er.id = rbc.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour recalculer automatiquement après insert/update
CREATE OR REPLACE FUNCTION trigger_recalculate_rankings()
RETURNS TRIGGER AS $$
BEGIN
  -- Recalculer les rangs pour l'événement concerné
  PERFORM recalculate_external_event_rankings(NEW.external_event_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS recalculate_rankings_trigger ON external_results;

CREATE TRIGGER recalculate_rankings_trigger
  AFTER INSERT OR UPDATE ON external_results
  FOR EACH STATEMENT
  EXECUTE FUNCTION trigger_recalculate_rankings();

-- Recalculer les rangs pour tous les événements existants
DO $$
DECLARE
  event_record RECORD;
BEGIN
  FOR event_record IN 
    SELECT DISTINCT external_event_id 
    FROM external_results 
    WHERE external_event_id IS NOT NULL
  LOOP
    PERFORM recalculate_external_event_rankings(event_record.external_event_id);
  END LOOP;
END $$;
