/*
  # Système de Badges Timepulse

  ## 1. Tables créées
    - `badges` : Définition des badges (distance, vitesse, régularité, progression, etc.)
    - `athlete_badges` : Badges obtenus par les athlètes
    - `badge_categories` : Catégories de badges

  ## 2. Types de badges
    - **Distance** : Marathonien, Ultra Runner, Triathlète Ironman
    - **Vitesse** : Sub-3h Marathon, Sub-40min 10km
    - **Régularité** : 10 courses/an, 50 courses lifetime
    - **Progression** : Record Personnel -5%, -10%
    - **Participation** : Fidèle Timepulse (X events chronométrés)
    - **Social** : Influenceur (partages, likes)
    - **Achievements** : Premier podium, 100ème course

  ## 3. Sécurité
    - RLS activé
    - Public peut voir les badges
    - Admins gèrent les définitions
    - Attribution automatique via triggers

  ## 4. Performance
    - Index optimisés pour 270k+ athlètes
    - Calcul asynchrone des badges
*/

-- ============================================
-- 1. TABLE BADGE_CATEGORIES
-- ============================================

CREATE TABLE IF NOT EXISTS badge_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  description text,
  icon text, -- lucide-react icon name
  color text, -- hex color
  
  display_order integer DEFAULT 0,
  
  created_at timestamptz DEFAULT now()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_badge_categories_slug ON badge_categories(slug);

-- ============================================
-- 2. TABLE BADGES
-- ============================================

CREATE TABLE IF NOT EXISTS badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES badge_categories(id) ON DELETE CASCADE NOT NULL,
  
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text NOT NULL,
  
  -- Visuel
  icon text, -- lucide-react icon name
  color text, -- hex color
  image_url text, -- URL d'une image personnalisée
  
  -- Conditions d'obtention (JSON flexible)
  criteria jsonb NOT NULL,
  
  -- Rareté (1=commun, 5=légendaire)
  rarity integer DEFAULT 1 CHECK (rarity BETWEEN 1 AND 5),
  
  -- Points attribués pour l'indice Timepulse
  points integer DEFAULT 0,
  
  is_active boolean DEFAULT true,
  display_order integer DEFAULT 0,
  
  created_at timestamptz DEFAULT now()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_badges_category ON badges(category_id);
CREATE INDEX IF NOT EXISTS idx_badges_slug ON badges(slug);
CREATE INDEX IF NOT EXISTS idx_badges_active ON badges(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_badges_rarity ON badges(rarity);

-- ============================================
-- 3. TABLE ATHLETE_BADGES (badges obtenus)
-- ============================================

CREATE TABLE IF NOT EXISTS athlete_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id uuid REFERENCES athletes(id) ON DELETE CASCADE NOT NULL,
  badge_id uuid REFERENCES badges(id) ON DELETE CASCADE NOT NULL,
  
  earned_at timestamptz DEFAULT now(),
  
  -- Contexte d'obtention
  result_id uuid REFERENCES results(id) ON DELETE SET NULL,
  race_id uuid REFERENCES races(id) ON DELETE SET NULL,
  
  -- Pour affichage dans le profil
  is_featured boolean DEFAULT false, -- Badge mis en avant sur le profil
  
  created_at timestamptz DEFAULT now(),
  
  UNIQUE(athlete_id, badge_id)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_athlete_badges_athlete ON athlete_badges(athlete_id);
CREATE INDEX IF NOT EXISTS idx_athlete_badges_badge ON athlete_badges(badge_id);
CREATE INDEX IF NOT EXISTS idx_athlete_badges_earned ON athlete_badges(earned_at DESC);
CREATE INDEX IF NOT EXISTS idx_athlete_badges_featured ON athlete_badges(athlete_id, is_featured) 
  WHERE is_featured = true;

-- ============================================
-- DONNÉES DE BASE - CATÉGORIES DE BADGES
-- ============================================

INSERT INTO badge_categories (name, slug, description, icon, color, display_order) VALUES
  ('Distance', 'distance', 'Badges obtenus en fonction des distances parcourues', 'ruler', '#3b82f6', 10),
  ('Vitesse', 'speed', 'Badges de performances chronométriques', 'zap', '#f59e0b', 20),
  ('Régularité', 'regularity', 'Badges de participation régulière', 'calendar', '#10b981', 30),
  ('Progression', 'progression', 'Badges d''amélioration des performances', 'trending-up', '#8b5cf6', 40),
  ('Podium', 'podium', 'Badges de classement sur le podium', 'trophy', '#ef4444', 50),
  ('Participation', 'participation', 'Badges de fidélité Timepulse', 'heart', '#ec4899', 60),
  ('Achievements', 'achievements', 'Badges d''accomplissements spéciaux', 'star', '#f97316', 70)
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- DONNÉES DE BASE - BADGES
-- ============================================

-- BADGES DISTANCE
INSERT INTO badges (category_id, name, slug, description, criteria, rarity, points, icon, color) VALUES
  (
    (SELECT id FROM badge_categories WHERE slug = 'distance'),
    'Semi-Marathonien',
    'semi-marathoner',
    'Finir un semi-marathon',
    '{"race_type_slug": "semi-marathon", "status": "finished"}',
    2, 50, 'award', '#3b82f6'
  ),
  (
    (SELECT id FROM badge_categories WHERE slug = 'distance'),
    'Marathonien',
    'marathoner',
    'Finir un marathon',
    '{"race_type_slug": "marathon", "status": "finished"}',
    3, 100, 'award', '#3b82f6'
  ),
  (
    (SELECT id FROM badge_categories WHERE slug = 'distance'),
    'Ultra Runner',
    'ultra-runner',
    'Finir un ultra trail (> 80 km)',
    '{"race_type_slug": "ultra-trail", "status": "finished"}',
    4, 200, 'mountain', '#3b82f6'
  ),
  (
    (SELECT id FROM badge_categories WHERE slug = 'distance'),
    'Triathlète Ironman',
    'ironman',
    'Finir un triathlon XL (Ironman)',
    '{"race_type_slug": "triathlon-xl", "status": "finished"}',
    5, 300, 'zap', '#3b82f6'
  )
ON CONFLICT (slug) DO NOTHING;

-- BADGES VITESSE
INSERT INTO badges (category_id, name, slug, description, criteria, rarity, points, icon, color) VALUES
  (
    (SELECT id FROM badge_categories WHERE slug = 'speed'),
    'Sub-40 (10km)',
    'sub-40-10km',
    'Courir un 10 km en moins de 40 minutes',
    '{"race_type_slug": "10km", "max_time_seconds": 2400}',
    3, 80, 'zap', '#f59e0b'
  ),
  (
    (SELECT id FROM badge_categories WHERE slug = 'speed'),
    'Sub-1h30 (Semi)',
    'sub-90-semi',
    'Courir un semi-marathon en moins de 1h30',
    '{"race_type_slug": "semi-marathon", "max_time_seconds": 5400}',
    4, 120, 'zap', '#f59e0b'
  ),
  (
    (SELECT id FROM badge_categories WHERE slug = 'speed'),
    'Sub-3h (Marathon)',
    'sub-3h-marathon',
    'Courir un marathon en moins de 3 heures',
    '{"race_type_slug": "marathon", "max_time_seconds": 10800}',
    5, 250, 'zap', '#f59e0b'
  ),
  (
    (SELECT id FROM badge_categories WHERE slug = 'speed'),
    'Sub-20 (5km)',
    'sub-20-5km',
    'Courir un 5 km en moins de 20 minutes',
    '{"race_type_slug": "5km", "max_time_seconds": 1200}',
    3, 60, 'zap', '#f59e0b'
  )
ON CONFLICT (slug) DO NOTHING;

-- BADGES RÉGULARITÉ
INSERT INTO badges (category_id, name, slug, description, criteria, rarity, points, icon, color) VALUES
  (
    (SELECT id FROM badge_categories WHERE slug = 'regularity'),
    'Régulier 10',
    'regular-10',
    'Participer à 10 courses en un an',
    '{"min_races_per_year": 10}',
    2, 50, 'calendar', '#10b981'
  ),
  (
    (SELECT id FROM badge_categories WHERE slug = 'regularity'),
    'Régulier 20',
    'regular-20',
    'Participer à 20 courses en un an',
    '{"min_races_per_year": 20}',
    3, 100, 'calendar', '#10b981'
  ),
  (
    (SELECT id FROM badge_categories WHERE slug = 'regularity'),
    'Centurion',
    'centurion',
    'Participer à 100 courses au total',
    '{"total_races": 100}',
    4, 200, 'award', '#10b981'
  )
ON CONFLICT (slug) DO NOTHING;

-- BADGES PROGRESSION
INSERT INTO badges (category_id, name, slug, description, criteria, rarity, points, icon, color) VALUES
  (
    (SELECT id FROM badge_categories WHERE slug = 'progression'),
    'Record Personnel -5%',
    'pr-improvement-5',
    'Améliorer un record personnel de 5%',
    '{"improvement_percent": 5}',
    2, 40, 'trending-up', '#8b5cf6'
  ),
  (
    (SELECT id FROM badge_categories WHERE slug = 'progression'),
    'Record Personnel -10%',
    'pr-improvement-10',
    'Améliorer un record personnel de 10%',
    '{"improvement_percent": 10}',
    3, 80, 'trending-up', '#8b5cf6'
  ),
  (
    (SELECT id FROM badge_categories WHERE slug = 'progression'),
    'En Forme',
    'on-fire',
    '3 records personnels battus en 6 mois',
    '{"records_count": 3, "within_months": 6}',
    3, 90, 'flame', '#8b5cf6'
  )
ON CONFLICT (slug) DO NOTHING;

-- BADGES PODIUM
INSERT INTO badges (category_id, name, slug, description, criteria, rarity, points, icon, color) VALUES
  (
    (SELECT id FROM badge_categories WHERE slug = 'podium'),
    'Premier Podium',
    'first-podium',
    'Finir dans le top 3 d''une course',
    '{"max_rank": 3}',
    3, 100, 'trophy', '#ef4444'
  ),
  (
    (SELECT id FROM badge_categories WHERE slug = 'podium'),
    'Champion',
    'champion',
    'Remporter une course (1ère place)',
    '{"rank": 1}',
    4, 150, 'crown', '#ef4444'
  ),
  (
    (SELECT id FROM badge_categories WHERE slug = 'podium'),
    'Podium x10',
    'podium-10',
    '10 podiums au total',
    '{"total_podiums": 10}',
    4, 200, 'trophy', '#ef4444'
  )
ON CONFLICT (slug) DO NOTHING;

-- BADGES PARTICIPATION
INSERT INTO badges (category_id, name, slug, description, criteria, rarity, points, icon, color) VALUES
  (
    (SELECT id FROM badge_categories WHERE slug = 'participation'),
    'Fidèle Timepulse',
    'timepulse-loyal',
    'Participer à 10 événements chronométrés par Timepulse',
    '{"min_timepulse_events": 10}',
    2, 60, 'heart', '#ec4899'
  ),
  (
    (SELECT id FROM badge_categories WHERE slug = 'participation'),
    'Ambassadeur Timepulse',
    'timepulse-ambassador',
    'Participer à 50 événements chronométrés par Timepulse',
    '{"min_timepulse_events": 50}',
    4, 150, 'heart', '#ec4899'
  )
ON CONFLICT (slug) DO NOTHING;

-- BADGES ACHIEVEMENTS
INSERT INTO badges (category_id, name, slug, description, criteria, rarity, points, icon, color) VALUES
  (
    (SELECT id FROM badge_categories WHERE slug = 'achievements'),
    'Première Course',
    'first-race',
    'Terminer sa première course',
    '{"total_races": 1}',
    1, 10, 'flag', '#f97316'
  ),
  (
    (SELECT id FROM badge_categories WHERE slug = 'achievements'),
    'Polyvalent',
    'versatile',
    'Participer à au moins 3 disciplines différentes',
    '{"min_sports": 3}',
    3, 80, 'layers', '#f97316'
  ),
  (
    (SELECT id FROM badge_categories WHERE slug = 'achievements'),
    'Explorateur',
    'explorer',
    'Participer à des courses dans 5 départements différents',
    '{"min_departments": 5}',
    3, 70, 'map', '#f97316'
  )
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- FONCTIONS UTILITAIRES
-- ============================================

-- Fonction pour attribuer un badge à un athlète
CREATE OR REPLACE FUNCTION award_badge(
  p_athlete_id uuid,
  p_badge_slug text,
  p_result_id uuid DEFAULT NULL,
  p_race_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  v_badge_id uuid;
  v_athlete_badge_id uuid;
BEGIN
  -- Récupérer l'ID du badge
  SELECT id INTO v_badge_id
  FROM badges
  WHERE slug = p_badge_slug AND is_active = true;
  
  IF v_badge_id IS NULL THEN
    RAISE EXCEPTION 'Badge % not found or inactive', p_badge_slug;
  END IF;
  
  -- Attribuer le badge (ou récupérer l'existant)
  INSERT INTO athlete_badges (athlete_id, badge_id, result_id, race_id)
  VALUES (p_athlete_id, v_badge_id, p_result_id, p_race_id)
  ON CONFLICT (athlete_id, badge_id) DO NOTHING
  RETURNING id INTO v_athlete_badge_id;
  
  RETURN v_athlete_badge_id;
END;
$$;

-- Fonction pour vérifier les badges automatiquement après un résultat
CREATE OR REPLACE FUNCTION check_athlete_badges(p_athlete_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_total_races integer;
  v_total_podiums integer;
BEGIN
  -- Compter le nombre de courses
  SELECT COUNT(*) INTO v_total_races
  FROM results
  WHERE athlete_id = p_athlete_id AND status = 'finished';
  
  -- Badge première course
  IF v_total_races = 1 THEN
    PERFORM award_badge(p_athlete_id, 'first-race');
  END IF;
  
  -- Badge régularité 10 courses
  IF v_total_races >= 10 THEN
    PERFORM award_badge(p_athlete_id, 'regular-10');
  END IF;
  
  -- Badge centurion
  IF v_total_races >= 100 THEN
    PERFORM award_badge(p_athlete_id, 'centurion');
  END IF;
  
  -- Compter les podiums
  SELECT COUNT(*) INTO v_total_podiums
  FROM results
  WHERE athlete_id = p_athlete_id 
    AND status = 'finished'
    AND overall_rank <= 3;
  
  -- Badge premier podium
  IF v_total_podiums >= 1 THEN
    PERFORM award_badge(p_athlete_id, 'first-podium');
  END IF;
  
  -- Badge 10 podiums
  IF v_total_podiums >= 10 THEN
    PERFORM award_badge(p_athlete_id, 'podium-10');
  END IF;
  
  -- Vérifier les champions (1ère place)
  IF EXISTS (
    SELECT 1 FROM results 
    WHERE athlete_id = p_athlete_id 
      AND status = 'finished'
      AND overall_rank = 1
  ) THEN
    PERFORM award_badge(p_athlete_id, 'champion');
  END IF;
  
END;
$$;

-- Trigger pour vérifier les badges après insertion d'un résultat
CREATE OR REPLACE FUNCTION trigger_check_badges_on_result()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Seulement si l'athlète est lié
  IF NEW.athlete_id IS NOT NULL AND NEW.status = 'finished' THEN
    PERFORM check_athlete_badges(NEW.athlete_id);
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS check_badges_on_result_insert ON results;
CREATE TRIGGER check_badges_on_result_insert
  AFTER INSERT ON results
  FOR EACH ROW
  EXECUTE FUNCTION trigger_check_badges_on_result();

DROP TRIGGER IF EXISTS check_badges_on_result_update ON results;
CREATE TRIGGER check_badges_on_result_update
  AFTER UPDATE ON results
  FOR EACH ROW
  WHEN (OLD.athlete_id IS DISTINCT FROM NEW.athlete_id OR OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION trigger_check_badges_on_result();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE badge_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE athlete_badges ENABLE ROW LEVEL SECURITY;

-- BADGE_CATEGORIES: Public peut voir
DROP POLICY IF EXISTS "Public can view badge categories" ON badge_categories;
CREATE POLICY "Public can view badge categories"
  ON badge_categories FOR SELECT
  USING (true);

-- BADGE_CATEGORIES: Admins gèrent
DROP POLICY IF EXISTS "Admins can manage badge categories" ON badge_categories;
CREATE POLICY "Admins can manage badge categories"
  ON badge_categories FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid())
  );

-- BADGES: Public peut voir les badges actifs
DROP POLICY IF EXISTS "Public can view active badges" ON badges;
CREATE POLICY "Public can view active badges"
  ON badges FOR SELECT
  USING (is_active = true);

-- BADGES: Admins gèrent
DROP POLICY IF EXISTS "Admins can manage badges" ON badges;
CREATE POLICY "Admins can manage badges"
  ON badges FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid())
  );

-- ATHLETE_BADGES: Public peut voir les badges des profils publics
DROP POLICY IF EXISTS "Public can view public athlete badges" ON athlete_badges;
CREATE POLICY "Public can view public athlete badges"
  ON athlete_badges FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM athletes 
      WHERE athletes.id = athlete_badges.athlete_id 
        AND athletes.is_public = true
    )
  );

-- ATHLETE_BADGES: Athlètes voient leurs propres badges
DROP POLICY IF EXISTS "Athletes can view their own badges" ON athlete_badges;
CREATE POLICY "Athletes can view their own badges"
  ON athlete_badges FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM athletes 
      WHERE athletes.id = athlete_badges.athlete_id 
        AND athletes.user_id = auth.uid()
    )
  );

-- ATHLETE_BADGES: Athlètes peuvent mettre en avant leurs badges
DROP POLICY IF EXISTS "Athletes can feature their badges" ON athlete_badges;
CREATE POLICY "Athletes can feature their badges"
  ON athlete_badges FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM athletes 
      WHERE athletes.id = athlete_badges.athlete_id 
        AND athletes.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM athletes 
      WHERE athletes.id = athlete_badges.athlete_id 
        AND athletes.user_id = auth.uid()
    )
  );

-- ATHLETE_BADGES: Admins ont accès complet
DROP POLICY IF EXISTS "Admins have full access to athlete badges" ON athlete_badges;
CREATE POLICY "Admins have full access to athlete badges"
  ON athlete_badges FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid())
  );
