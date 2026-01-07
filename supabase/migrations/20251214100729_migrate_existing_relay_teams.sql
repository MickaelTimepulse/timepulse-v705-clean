/*
  # Migration des équipes relais/ekiden existantes

  1. Objectif
    - Identifier les inscriptions d'équipes relais existantes
    - Créer les entités teams pour ces équipes
    - Créer les liens team_members
    - Déterminer automatiquement le type d'équipe (homme/femme/mixte)

  2. Processus
    - Recherche des courses avec segments de relais
    - Regroupement des inscriptions par course
    - Création des équipes avec nom généré
    - Attribution du type d'équipe selon la composition

  3. Notes
    - Les équipes existantes sans nom recevront un nom auto-généré
    - Les numéros de dossard sont préservés
    - Les contacts d'urgence ne sont pas migrés (non disponibles dans les anciennes inscriptions)
*/

-- Fonction temporaire pour migrer les équipes relais existantes
CREATE OR REPLACE FUNCTION migrate_existing_relay_teams()
RETURNS TABLE (
  races_processed integer,
  teams_created integer,
  members_linked integer
) AS $$
DECLARE
  v_race_record RECORD;
  v_entry_record RECORD;
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
  v_segment_order integer;
  v_organizer_id uuid;
BEGIN
  -- Pour chaque course ayant des segments de relais
  FOR v_race_record IN
    SELECT DISTINCT r.id as race_id, r.name as race_name, r.event_id, e.organizer_id
    FROM races r
    INNER JOIN relay_segments rs ON rs.race_id = r.id
    INNER JOIN events e ON e.id = r.event_id
    WHERE NOT EXISTS (
      -- Éviter de traiter les courses qui ont déjà des équipes
      SELECT 1 FROM teams t WHERE t.race_id = r.id
    )
  LOOP
    v_races_processed := v_races_processed + 1;
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

      -- Récupérer le nombre de segments pour savoir combien de membres par équipe
      SELECT COUNT(*) INTO v_member_count
      FROM relay_segments
      WHERE race_id = v_race_record.race_id;

      -- Si on ne trouve pas de segments, on considère que c'est une équipe de 4 par défaut
      IF v_member_count = 0 THEN
        v_member_count := 4;
      END IF;

      -- Grouper les inscriptions par équipes de v_member_count membres
      FOR i IN 1..array_length(v_entries_for_race, 1) BY v_member_count LOOP

        -- S'assurer qu'on a assez de membres pour former une équipe complète
        IF i + v_member_count - 1 <= array_length(v_entries_for_race, 1) THEN

          -- Compter les hommes et femmes dans cette équipe
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

          -- Générer un nom d'équipe basé sur le premier membre
          SELECT CONCAT('Équipe ', a.last_name)
          INTO v_team_name
          FROM entries e
          JOIN athletes a ON a.id = e.athlete_id
          WHERE e.id = v_entries_for_race[i]
          LIMIT 1;

          -- Créer l'équipe
          INSERT INTO teams (
            name,
            race_id,
            event_id,
            organizer_id,
            team_type,
            required_members_count,
            current_members_count,
            registration_status
          ) VALUES (
            v_team_name,
            v_race_record.race_id,
            v_race_record.event_id,
            v_organizer_id,
            v_team_type,
            v_member_count,
            v_member_count,
            'confirmed'
          )
          RETURNING id INTO v_team_id;

          v_teams_created := v_teams_created + 1;

          -- Créer les liens team_members pour chaque membre
          v_segment_order := 1;
          FOREACH v_entry_id IN ARRAY v_entries_for_race[i:i+v_member_count-1] LOOP
            INSERT INTO team_members (
              team_id,
              entry_id,
              athlete_id,
              segment_order
            )
            SELECT
              v_team_id,
              v_entry_id,
              e.athlete_id,
              v_segment_order
            FROM entries e
            WHERE e.id = v_entry_id;

            v_members_linked := v_members_linked + 1;
            v_segment_order := v_segment_order + 1;
          END LOOP;

        END IF;
      END LOOP;
    END IF;
  END LOOP;

  RETURN QUERY SELECT v_races_processed, v_teams_created, v_members_linked;
END;
$$ LANGUAGE plpgsql;

-- Exécuter la migration
SELECT * FROM migrate_existing_relay_teams();

-- Supprimer la fonction temporaire
DROP FUNCTION IF EXISTS migrate_existing_relay_teams();
