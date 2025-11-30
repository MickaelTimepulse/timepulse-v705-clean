/*
  # Ajouter la restriction de genre aux épreuves

  1. Modifications
    - Ajout du champ `gender_restriction` (text) à la table `races`
      - Valeurs possibles : 'all' (mixte), 'M' (hommes seulement), 'F' (femmes seulement)
      - Valeur par défaut : 'all' (pas de restriction)

  2. Notes
    - Ce champ permet aux organisateurs de créer des épreuves réservées aux hommes ou aux femmes
    - Le formulaire d'inscription adaptera les options de genre selon cette restriction
*/

-- Ajouter le champ gender_restriction à la table races
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'races' AND column_name = 'gender_restriction'
  ) THEN
    ALTER TABLE races ADD COLUMN gender_restriction text DEFAULT 'all' CHECK (gender_restriction IN ('all', 'M', 'F'));
  END IF;
END $$;

-- Mettre à jour les épreuves existantes avec la valeur par défaut
UPDATE races
SET gender_restriction = 'all'
WHERE gender_restriction IS NULL;
