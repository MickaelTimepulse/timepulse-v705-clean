/*
  # Fix check_team_documents_status function

  1. Changes
    - Corrige la fonction check_team_documents_status pour utiliser ffa_verified au lieu de license_verified
    - La colonne license_verified n'existe pas dans la table entries
*/

-- Function: Check team documents status (fixed)
CREATE OR REPLACE FUNCTION check_team_documents_status(team_id_param uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
  total_members integer;
  members_with_complete_docs integer;
BEGIN
  SELECT COUNT(*) INTO total_members
  FROM team_members tm
  WHERE tm.team_id = team_id_param AND tm.status != 'removed';

  SELECT COUNT(DISTINCT tm.entry_id) INTO members_with_complete_docs
  FROM team_members tm
  INNER JOIN entries e ON e.id = tm.entry_id
  WHERE tm.team_id = team_id_param
    AND tm.status != 'removed'
    AND NOT EXISTS (
      SELECT 1
      FROM races r
      WHERE r.id = (SELECT race_id FROM teams WHERE id = team_id_param)
        AND r.requires_license = true
        AND (e.ffa_verified = false OR e.ffa_verified IS NULL)
    );

  result := jsonb_build_object(
    'total_members', total_members,
    'members_with_complete_docs', members_with_complete_docs,
    'all_complete', total_members > 0 AND total_members = members_with_complete_docs
  );

  RETURN result;
END;
$$;
