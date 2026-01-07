/*
  # Correction de la migration des équipes relais existantes v3

  1. Objectif
    - Corriger la structure des équipes créées par la migration précédente
    - Utiliser les valeurs correctes pour le status ('validated' au lieu de 'active')

  2. Actions
    - Supprimer les équipes créées avec la mauvaise structure
    - Recréer les équipes avec la structure correcte
*/

-- Fonction pour corriger les équipes relais existantes
CREATE OR REPLACE FUNCTION fix_migrate_existing_relay_teams_v3()
RETURNS TABLE (
  races_processed integer,
  teams_created integer,
  members_linked integer
) AS $$
DECLARE
  v_race_record RECORD;
  v_team_id uuid;
  v_team_name text;
  v_team_type text;
  v_men_count integer;
  v_women_count integer;
  v_member_count integer;
  v_races_processed integer := 0;
  v_teams_created integer := 0;
  v_members_linked integer := 0;
  v_entries_for_race uuid[];
  v_entry_id uuid;
  v_position integer;
  v_role text;
  v_event_id uuid;
  v_organizer_id uuid;
BEGIN
  -- Supprimer d'abord les équipes créées avec la mauvaise structure
  DELETE FROM team_members WHERE team_id IN (SELECT id FROM teams WHERE metadata->>'registration_source' IS NULL);
  DELETE FROM teams WHERE metadata->>'registration_source' IS NULL;

  -- Pour chaque course ayant des segments de relais
  FOR v_race_record IN
    SELECT DISTINCT r.id as race_id, r.name as race_name, e.id as event_id, e.organizer_id
    FROM races r
    INNER JOIN relay_segments rs ON rs.race_id = r.id
    INNER JOIN events e ON e.id = r.event_id
    WHERE NOT EXISTS (
      SELECT 1 FROM teams t WHERE t.race_id = r.id
    )
  LOOP
    v_races_processed := v_races_processed + 1;
    v_event_id := v_race_record.event_id;
    v_organizer_id := v_race_record.organizer_id;

    -- Récupérer toutes les inscriptions pour cette course qui n'ont pas encore d'équipe
    SELECT array_agg(e.id ORDER BY e.bib_number, e.created_at)
    INTO v_entries_for_race
    FROM entries e
    WHERE e.race_id = v_race_record.race_id
      AND e.status = 'confirmed'
      AND NOT EXISTS (
        SELECT 1 FROM team_members tm WHERE tm.entry_id = e.id
      );

    -- Si on a des inscriptions sans équipe
    IF array_length(v_entries_for_race, 1) > 0 THEN

      -- Récupérer le nombre de segments
      SELECT COUNT(*) INTO v_member_count
      FROM relay_segments
      WHERE race_id = v_race_record.race_id;

      IF v_member_count = 0 THEN
        v_member_count := 4;
      END IF;

      -- Grouper les inscriptions par équipes
      FOR i IN 1..array_length(v_entries_for_race, 1) BY v_member_count LOOP

        IF i + v_member_count - 1 <= array_length(v_entries_for_race, 1) THEN

          -- Compter les hommes et femmes
          SELECT
            COUNT(*) FILTER (WHERE a.gender = 'M'),
            COUNT(*) FILTER (WHERE a.gender = 'F')
          INTO v_men_count, v_women_count
          FROM unnest(v_entries_for_race[i:i+v_member_count-1]) AS entry_id
          JOIN entries e ON e.id = entry_id
          JOIN athletes a ON a.id = e.athlete_id;

          -- Déterminer le type d'équipe
          IF v_women_count = 0 THEN
            v_team_type := 'homme';
          ELSIF v_men_count = 0 THEN
            v_team_type := 'femme';
          ELSE
            v_team_type := 'mixte';
          END IF;

          -- Générer un nom d'équipe
          SELECT CONCAT('Équipe ', a.last_name)
          INTO v_team_name
          FROM entries e
          JOIN athletes a ON a.id = e.athlete_id
          WHERE e.id = v_entries_for_race[i]
          LIMIT 1;

          -- Créer l'équipe avec la structure correcte
          INSERT INTO teams (
            name,
            race_id,
            team_type,
            status,
            payment_mode,
            min_members,
            max_members,
            current_members_count,
            payment_status,
            metadata
          ) VALUES (
            v_team_name,
            v_race_record.race_id,
            v_team_type,
            'complete',
            'team',
            v_member_count,
            v_member_count,
            v_member_count,
            'paid',
            jsonb_build_object(
              'registration_source', 'migration',
              'event_id', v_event_id,
              'organizer_id', v_organizer_id
            )
          )
          RETURNING id INTO v_team_id;

          v_teams_created := v_teams_created + 1;

          -- Créer les liens team_members
          v_position := 1;
          FOREACH v_entry_id IN ARRAY v_entries_for_race[i:i+v_member_count-1] LOOP
            -- Le premier membre est le capitaine
            IF v_position = 1 THEN
              v_role := 'captain';
            ELSE
              v_role := 'member';
            END IF;

            INSERT INTO team_members (
              team_id,
              entry_id,
              role,
              position,
              status
            ) VALUES (
              v_team_id,
              v_entry_id,
              v_role,
              v_position,
              'validated'
            );

            v_members_linked := v_members_linked + 1;
            v_position := v_position + 1;
          END LOOP;

        END IF;
      END LOOP;
    END IF;
  END LOOP;

  RETURN QUERY SELECT v_races_processed, v_teams_created, v_members_linked;
END;
$$ LANGUAGE plpgsql;

-- Exécuter la migration
SELECT * FROM fix_migrate_existing_relay_teams_v3();

-- Supprimer la fonction temporaire
DROP FUNCTION IF EXISTS fix_migrate_existing_relay_teams_v3();
