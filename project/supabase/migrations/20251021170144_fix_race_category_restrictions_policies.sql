/*
  # Correction des politiques RLS pour race_category_restrictions

  1. Changements
    - Suppression des anciennes policies
    - Création de nouvelles policies plus simples et robustes
    - Utilisation d'une fonction helper pour vérifier la propriété

  2. Sécurité
    - Les organisateurs peuvent gérer les restrictions de leurs propres épreuves
    - Lecture publique des restrictions
*/

-- Supprimer les anciennes policies
DROP POLICY IF EXISTS "Organizers can insert race category restrictions" ON race_category_restrictions;
DROP POLICY IF EXISTS "Organizers can delete race category restrictions" ON race_category_restrictions;

-- Créer une fonction helper pour vérifier si l'utilisateur possède l'événement de la course
CREATE OR REPLACE FUNCTION user_owns_race(race_uuid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM races r
    INNER JOIN events e ON r.event_id = e.id
    WHERE r.id = race_uuid
    AND e.organizer_id = auth.uid()
  );
$$;

-- Créer les nouvelles policies
CREATE POLICY "Organizers can insert race category restrictions"
  ON race_category_restrictions FOR INSERT
  TO authenticated
  WITH CHECK (user_owns_race(race_id));

CREATE POLICY "Organizers can delete race category restrictions"
  ON race_category_restrictions FOR DELETE
  TO authenticated
  USING (user_owns_race(race_id));

CREATE POLICY "Organizers can update race category restrictions"
  ON race_category_restrictions FOR UPDATE
  TO authenticated
  USING (user_owns_race(race_id))
  WITH CHECK (user_owns_race(race_id));
