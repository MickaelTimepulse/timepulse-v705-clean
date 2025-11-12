/*
  # Gestion des restrictions de catégories FFA pour les épreuves

  1. Nouvelles tables
    - `ffa_categories` : Référentiel des catégories FFA officielles
      - `code` (text, primary key) : Code de la catégorie (ex: "SE", "M0", "CA")
      - `label` (text) : Libellé complet de la catégorie
      - `min_age` (integer) : Âge minimum
      - `max_age` (integer) : Âge maximum (null si pas de limite)
      - `gender` (text) : Genre (M/F/all)
      - `display_order` (integer) : Ordre d'affichage
    
    - `race_category_restrictions` : Restrictions de catégories par épreuve
      - `id` (uuid, primary key)
      - `race_id` (uuid, foreign key vers races)
      - `category_code` (text, foreign key vers ffa_categories)
      - `created_at` (timestamptz)

  2. Modifications
    - Ajout du champ `is_ffa_race` (boolean) à la table `races`
    - Ajout du champ `age_category` (text) à la table `athletes` pour stocker la catégorie calculée

  3. Sécurité
    - Enable RLS sur les nouvelles tables
    - Policies pour lecture publique des catégories FFA
    - Policies pour gestion par les organisateurs des restrictions
*/

-- Créer la table des catégories FFA
CREATE TABLE IF NOT EXISTS ffa_categories (
  code text PRIMARY KEY,
  label text NOT NULL,
  min_age integer NOT NULL,
  max_age integer,
  gender text NOT NULL CHECK (gender IN ('M', 'F', 'all')),
  display_order integer NOT NULL DEFAULT 0
);

-- Créer la table des restrictions de catégories par course
CREATE TABLE IF NOT EXISTS race_category_restrictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  race_id uuid NOT NULL REFERENCES races(id) ON DELETE CASCADE,
  category_code text NOT NULL REFERENCES ffa_categories(code) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(race_id, category_code)
);

-- Ajouter le champ is_ffa_race à la table races
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'races' AND column_name = 'is_ffa_race'
  ) THEN
    ALTER TABLE races ADD COLUMN is_ffa_race boolean DEFAULT false;
  END IF;
END $$;

-- Ajouter le champ age_category à la table athletes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'athletes' AND column_name = 'age_category'
  ) THEN
    ALTER TABLE athletes ADD COLUMN age_category text;
  END IF;
END $$;

-- Enable RLS
ALTER TABLE ffa_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE race_category_restrictions ENABLE ROW LEVEL SECURITY;

-- Policies pour ffa_categories (lecture publique)
CREATE POLICY "Anyone can view FFA categories"
  ON ffa_categories FOR SELECT
  TO public
  USING (true);

-- Policies pour race_category_restrictions
CREATE POLICY "Anyone can view race category restrictions"
  ON race_category_restrictions FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Organizers can insert race category restrictions"
  ON race_category_restrictions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM races r
      JOIN events e ON r.event_id = e.id
      WHERE r.id = race_id
      AND e.organizer_id = auth.uid()
    )
  );

CREATE POLICY "Organizers can delete race category restrictions"
  ON race_category_restrictions FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM races r
      JOIN events e ON r.event_id = e.id
      WHERE r.id = race_id
      AND e.organizer_id = auth.uid()
    )
  );

-- Insérer les catégories FFA 2025-2026
INSERT INTO ffa_categories (code, label, min_age, max_age, gender, display_order) VALUES
  ('EA', 'Eveil Athlétique (7-9 ans)', 7, 9, 'all', 1),
  ('PO', 'Poussins (10-11 ans)', 10, 11, 'all', 2),
  ('BE', 'Benjamins (12-13 ans)', 12, 13, 'all', 3),
  ('MI', 'Minimes (14-15 ans)', 14, 15, 'all', 4),
  ('CA', 'Cadets (16-17 ans)', 16, 17, 'all', 5),
  ('JU', 'Juniors (18-19 ans)', 18, 19, 'all', 6),
  ('ES', 'Espoirs (20-22 ans)', 20, 22, 'all', 7),
  ('SE', 'Seniors (23-39 ans)', 23, 39, 'all', 8),
  ('M0', 'Masters 0 (40-44 ans)', 40, 44, 'all', 9),
  ('M1', 'Masters 1 (45-49 ans)', 45, 49, 'all', 10),
  ('M2', 'Masters 2 (50-54 ans)', 50, 54, 'all', 11),
  ('M3', 'Masters 3 (55-59 ans)', 55, 59, 'all', 12),
  ('M4', 'Masters 4 (60-64 ans)', 60, 64, 'all', 13),
  ('M5', 'Masters 5 (65-69 ans)', 65, 69, 'all', 14),
  ('M6', 'Masters 6 (70-74 ans)', 70, 74, 'all', 15),
  ('M7', 'Masters 7 (75-79 ans)', 75, 79, 'all', 16),
  ('M8', 'Masters 8 (80-84 ans)', 80, 84, 'all', 17),
  ('M9', 'Masters 9 (85-89 ans)', 85, 89, 'all', 18),
  ('M10', 'Masters 10 (90 ans et +)', 90, NULL, 'all', 19)
ON CONFLICT (code) DO NOTHING;
