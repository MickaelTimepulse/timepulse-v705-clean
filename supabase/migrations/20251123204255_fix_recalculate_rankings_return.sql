/*
  # Fix recalculate rankings function return value

  1. Changes
    - Fix jsonb_object_keys error that returns multiple rows
    - Return array of category keys instead

  2. Notes
    - Keeps all existing functionality
    - Only fixes the return statement
*/

CREATE OR REPLACE FUNCTION recalculate_external_results_rankings(p_event_id uuid)
RETURNS jsonb AS $$
DECLARE
  v_event external_events;
  v_federation_type text;
  v_updated_count integer := 0;
  v_result_record RECORD;
  v_general_rank integer := 0;
  v_male_rank integer := 0;
  v_female_rank integer := 0;
  v_category_ranks jsonb := '{}'::jsonb;
  v_calculated_category text;
  v_categories_array text[];
BEGIN
  SELECT * INTO v_event FROM external_events WHERE id = p_event_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Event not found');
  END IF;

  v_federation_type := COALESCE(v_event.custom_fields->>'federation_type', 'none');

  FOR v_result_record IN
    SELECT * FROM external_results
    WHERE external_event_id = p_event_id
      AND status = 'finished'
      AND finish_time IS NOT NULL
    ORDER BY finish_time ASC
  LOOP
    v_general_rank := v_general_rank + 1;

    IF v_result_record.gender = 'M' THEN
      v_male_rank := v_male_rank + 1;
    ELSIF v_result_record.gender = 'F' THEN
      v_female_rank := v_female_rank + 1;
    END IF;

    IF v_federation_type = 'FFA' THEN
      v_calculated_category := calculate_ffa_category(
        v_result_record.birth_year,
        v_result_record.gender,
        v_event.event_date
      );
    ELSIF v_federation_type = 'FFTRI' THEN
      v_calculated_category := calculate_fftri_category(
        v_result_record.birth_year,
        v_result_record.gender,
        v_event.event_date
      );
    ELSE
      v_calculated_category := v_result_record.category;
    END IF;

    IF v_calculated_category IS NOT NULL THEN
      v_category_ranks := jsonb_set(
        v_category_ranks,
        ARRAY[v_calculated_category],
        to_jsonb(COALESCE((v_category_ranks->>v_calculated_category)::integer, 0) + 1)
      );
    END IF;

    UPDATE external_results
    SET
      overall_rank = v_general_rank,
      gender_rank = CASE
        WHEN gender = 'M' THEN v_male_rank
        WHEN gender = 'F' THEN v_female_rank
        ELSE NULL
      END,
      category = COALESCE(v_calculated_category, category),
      category_rank = CASE
        WHEN v_calculated_category IS NOT NULL
        THEN (v_category_ranks->>v_calculated_category)::integer
        ELSE category_rank
      END,
      updated_at = now()
    WHERE id = v_result_record.id;

    v_updated_count := v_updated_count + 1;
  END LOOP;

  -- Convert category keys to array
  SELECT array_agg(key) INTO v_categories_array
  FROM jsonb_object_keys(v_category_ranks) AS key;

  RETURN jsonb_build_object(
    'success', true,
    'updated_count', v_updated_count,
    'federation_type', v_federation_type,
    'categories_found', v_categories_array
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
