/*
  # Recalcul automatique des classements pour résultats externes

  1. Fonction
    - `recalculate_external_results_rankings(event_id)` : Recalcule tous les classements
    - Calcule les catégories selon la fédération (FFA, FFTri, etc.)
    - Recalcule classement général, par sexe et par catégorie
    
  2. Logique
    - Détecte la fédération depuis custom_fields de l'événement
    - Calcule la catégorie selon l'âge et la fédération
    - Trie les résultats par temps
    - Assigne les rangs par groupe (général, sexe, catégorie)
*/

CREATE OR REPLACE FUNCTION calculate_ffa_category(birth_year integer, gender text, event_date date)
RETURNS text AS $$
DECLARE
  age integer;
BEGIN
  IF birth_year IS NULL OR gender IS NULL THEN
    RETURN NULL;
  END IF;

  age := EXTRACT(YEAR FROM event_date) - birth_year;

  IF gender = 'M' THEN
    IF age < 16 THEN RETURN 'EA';
    ELSIF age < 18 THEN RETURN 'JU';
    ELSIF age < 20 THEN RETURN 'ES';
    ELSIF age < 23 THEN RETURN 'SE';
    ELSIF age < 40 THEN RETURN 'SE';
    ELSIF age < 50 THEN RETURN 'M0';
    ELSIF age < 55 THEN RETURN 'M1';
    ELSIF age < 60 THEN RETURN 'M2';
    ELSIF age < 65 THEN RETURN 'M3';
    ELSIF age < 70 THEN RETURN 'M4';
    ELSIF age < 75 THEN RETURN 'M5';
    ELSIF age < 80 THEN RETURN 'M6';
    ELSIF age < 85 THEN RETURN 'M7';
    ELSE RETURN 'M8';
    END IF;
  ELSE
    IF age < 16 THEN RETURN 'EA';
    ELSIF age < 18 THEN RETURN 'JU';
    ELSIF age < 20 THEN RETURN 'ES';
    ELSIF age < 23 THEN RETURN 'SE';
    ELSIF age < 40 THEN RETURN 'SE';
    ELSIF age < 50 THEN RETURN 'M0';
    ELSIF age < 55 THEN RETURN 'M1';
    ELSIF age < 60 THEN RETURN 'M2';
    ELSIF age < 65 THEN RETURN 'M3';
    ELSIF age < 70 THEN RETURN 'M4';
    ELSIF age < 75 THEN RETURN 'M5';
    ELSIF age < 80 THEN RETURN 'M6';
    ELSIF age < 85 THEN RETURN 'M7';
    ELSE RETURN 'M8';
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION calculate_fftri_category(birth_year integer, gender text, event_date date)
RETURNS text AS $$
DECLARE
  age integer;
BEGIN
  IF birth_year IS NULL OR gender IS NULL THEN
    RETURN NULL;
  END IF;

  age := EXTRACT(YEAR FROM event_date) - birth_year;

  IF gender = 'M' THEN
    IF age < 12 THEN RETURN 'PO';
    ELSIF age < 14 THEN RETURN 'PU';
    ELSIF age < 16 THEN RETURN 'BE';
    ELSIF age < 18 THEN RETURN 'MI';
    ELSIF age < 20 THEN RETURN 'CA';
    ELSIF age < 23 THEN RETURN 'JU';
    ELSIF age < 30 THEN RETURN 'S1';
    ELSIF age < 35 THEN RETURN 'S2';
    ELSIF age < 40 THEN RETURN 'S3';
    ELSIF age < 45 THEN RETURN 'S4';
    ELSIF age < 50 THEN RETURN 'V1';
    ELSIF age < 55 THEN RETURN 'V2';
    ELSIF age < 60 THEN RETURN 'V3';
    ELSIF age < 65 THEN RETURN 'V4';
    ELSIF age < 70 THEN RETURN 'V5';
    ELSIF age < 75 THEN RETURN 'V6';
    ELSE RETURN 'V7';
    END IF;
  ELSE
    IF age < 12 THEN RETURN 'PO';
    ELSIF age < 14 THEN RETURN 'PU';
    ELSIF age < 16 THEN RETURN 'BE';
    ELSIF age < 18 THEN RETURN 'MI';
    ELSIF age < 20 THEN RETURN 'CA';
    ELSIF age < 23 THEN RETURN 'JU';
    ELSIF age < 30 THEN RETURN 'S1';
    ELSIF age < 35 THEN RETURN 'S2';
    ELSIF age < 40 THEN RETURN 'S3';
    ELSIF age < 45 THEN RETURN 'S4';
    ELSIF age < 50 THEN RETURN 'V1';
    ELSIF age < 55 THEN RETURN 'V2';
    ELSIF age < 60 THEN RETURN 'V3';
    ELSIF age < 65 THEN RETURN 'V4';
    ELSIF age < 70 THEN RETURN 'V5';
    ELSIF age < 75 THEN RETURN 'V6';
    ELSE RETURN 'V7';
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

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

  RETURN jsonb_build_object(
    'success', true,
    'updated_count', v_updated_count,
    'federation_type', v_federation_type,
    'categories_found', jsonb_object_keys(v_category_ranks)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
