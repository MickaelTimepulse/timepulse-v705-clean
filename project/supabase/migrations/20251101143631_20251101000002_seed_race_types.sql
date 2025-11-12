/*
  # Données de base - Types de courses

  Insertion des types de courses standards pour :
  - Running (route)
  - Trail
  - Triathlon
  - Autres disciplines (swimrun, duathlon, aquathlon)
*/

-- RUNNING (ROUTE)
INSERT INTO race_types (sport, name, slug, distance_km, display_order) VALUES
  ('running', '5 km', '5km', 5.0, 10),
  ('running', '10 km', '10km', 10.0, 20),
  ('running', '15 km', '15km', 15.0, 30),
  ('running', 'Semi-Marathon', 'semi-marathon', 21.097, 40),
  ('running', 'Marathon', 'marathon', 42.195, 50)
ON CONFLICT (slug) DO NOTHING;

-- TRAIL
INSERT INTO race_types (sport, name, slug, distance_km, display_order) VALUES
  ('trail', 'Trail Court (< 20 km)', 'trail-court', 15.0, 100),
  ('trail', 'Trail Moyen (20-42 km)', 'trail-moyen', 30.0, 110),
  ('trail', 'Trail Long (42-80 km)', 'trail-long', 60.0, 120),
  ('trail', 'Ultra Trail (> 80 km)', 'ultra-trail', 100.0, 130)
ON CONFLICT (slug) DO NOTHING;

-- TRIATHLON
INSERT INTO race_types (sport, name, slug, swim_distance_m, bike_distance_km, run_distance_km, display_order) VALUES
  ('triathlon', 'Triathlon XS', 'triathlon-xs', 400, 10.0, 2.5, 200),
  ('triathlon', 'Triathlon S (Sprint)', 'triathlon-s', 750, 20.0, 5.0, 210),
  ('triathlon', 'Triathlon M (Olympique)', 'triathlon-m', 1500, 40.0, 10.0, 220),
  ('triathlon', 'Triathlon L (Half Ironman)', 'triathlon-l', 1900, 90.0, 21.1, 230),
  ('triathlon', 'Triathlon XL (Ironman)', 'triathlon-xl', 3800, 180.0, 42.2, 240)
ON CONFLICT (slug) DO NOTHING;

-- SWIMRUN
INSERT INTO race_types (sport, name, slug, display_order) VALUES
  ('swimrun', 'Swimrun Court', 'swimrun-court', 300),
  ('swimrun', 'Swimrun Moyen', 'swimrun-moyen', 310),
  ('swimrun', 'Swimrun Long', 'swimrun-long', 320)
ON CONFLICT (slug) DO NOTHING;

-- DUATHLON
INSERT INTO race_types (sport, name, slug, bike_distance_km, run_distance_km, display_order) VALUES
  ('duathlon', 'Duathlon S', 'duathlon-s', 20.0, 10.0, 400),
  ('duathlon', 'Duathlon M', 'duathlon-m', 40.0, 15.0, 410),
  ('duathlon', 'Duathlon L', 'duathlon-l', 80.0, 20.0, 420)
ON CONFLICT (slug) DO NOTHING;

-- AQUATHLON
INSERT INTO race_types (sport, name, slug, swim_distance_m, run_distance_km, display_order) VALUES
  ('aquathlon', 'Aquathlon S', 'aquathlon-s', 750, 5.0, 500),
  ('aquathlon', 'Aquathlon M', 'aquathlon-m', 1500, 10.0, 510)
ON CONFLICT (slug) DO NOTHING;
