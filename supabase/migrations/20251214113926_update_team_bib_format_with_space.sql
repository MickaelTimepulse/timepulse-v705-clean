/*
  # Mise à jour du format des dossards d'équipe avec espace

  1. Modifications
    - Modifie la fonction `assign_team_bib_numbers` pour utiliser un espace au lieu d'un tiret
    - Format : "001 A" au lieu de "001-A"
*/

CREATE OR REPLACE FUNCTION assign_team_bib_numbers(
  team_id_param uuid,
  start_bib integer
)
RETURNS text[]
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  bib_array text[];
  member_record RECORD;
  suffix text;
  bib_with_suffix text;
BEGIN
  bib_array := ARRAY[]::text[];

  FOR member_record IN
    SELECT tm.entry_id, tm.position
    FROM team_members tm
    WHERE tm.team_id = team_id_param AND tm.status != 'removed'
    ORDER BY tm.position ASC NULLS LAST, tm.joined_at ASC
  LOOP
    -- Génère le suffixe alphabétique (A, B, C, etc.)
    suffix := chr(64 + (array_length(bib_array, 1) + 1));
    
    -- Format avec espace : "001 A"
    bib_with_suffix := lpad(start_bib::text, 3, '0') || ' ' || suffix;
    bib_array := array_append(bib_array, bib_with_suffix);

    -- Mise à jour du dossard de l'entrée
    UPDATE entries
    SET bib_number = bib_with_suffix
    WHERE id = member_record.entry_id;
  END LOOP;

  -- Mise à jour du tableau des dossards de l'équipe
  UPDATE teams
  SET bib_numbers = bib_array, updated_at = now()
  WHERE id = team_id_param;

  RETURN bib_array;
END;
$$;
