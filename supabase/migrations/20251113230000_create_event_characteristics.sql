/*
  # Create Event Characteristics System

  1. New Tables
    - `event_characteristic_types`
      - Stores available characteristic types with icons and categories
    - `event_characteristics`
      - Many-to-many relationship between events and characteristics
  
  2. Categories
    - Certification: Official distance, qualifying race
    - Terrain: Road, nature, mountain, circuit
    - Style: Festive, elimination
    - Trail Distance: XXS to XXL categories
  
  3. Security
    - Enable RLS on all tables
    - Organizers can manage their event characteristics
    - Public can read all characteristics
*/

-- Create characteristic types table
CREATE TABLE IF NOT EXISTS event_characteristic_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  category text NOT NULL CHECK (category IN ('certification', 'terrain', 'style', 'trail_distance')),
  icon text NOT NULL, -- Lucide icon name
  color text NOT NULL DEFAULT '#3b82f6', -- Tailwind color for the badge
  description text,
  display_order integer NOT NULL DEFAULT 0,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create event characteristics junction table
CREATE TABLE IF NOT EXISTS event_characteristics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  characteristic_type_id uuid NOT NULL REFERENCES event_characteristic_types(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(event_id, characteristic_type_id)
);

-- Enable RLS
ALTER TABLE event_characteristic_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_characteristics ENABLE ROW LEVEL SECURITY;

-- Policies for event_characteristic_types
CREATE POLICY "Anyone can view characteristic types"
  ON event_characteristic_types FOR SELECT
  TO public
  USING (active = true);

CREATE POLICY "Admins can manage characteristic types"
  ON event_characteristic_types FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.email = current_setting('request.jwt.claims')::json->>'email'
    )
  );

-- Policies for event_characteristics
CREATE POLICY "Anyone can view event characteristics"
  ON event_characteristics FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Organizers can add characteristics to their events"
  ON event_characteristics FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_characteristics.event_id
        AND events.organizer_id IN (
          SELECT id FROM organizers
          WHERE organizers.user_id = auth.uid()
        )
    )
  );

CREATE POLICY "Organizers can remove characteristics from their events"
  ON event_characteristics FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_characteristics.event_id
        AND events.organizer_id IN (
          SELECT id FROM organizers
          WHERE organizers.user_id = auth.uid()
        )
    )
  );

-- Create indexes
CREATE INDEX idx_event_characteristics_event_id ON event_characteristics(event_id);
CREATE INDEX idx_event_characteristics_type_id ON event_characteristics(characteristic_type_id);
CREATE INDEX idx_characteristic_types_category ON event_characteristic_types(category);
CREATE INDEX idx_characteristic_types_active ON event_characteristic_types(active);

-- Seed characteristic types
INSERT INTO event_characteristic_types (code, name, category, icon, color, description, display_order) VALUES
  -- Certification
  ('official_distance', 'Distance officielle', 'certification', 'Award', '#10b981', 'Course avec distance certifiée et mesurée', 1),
  ('qualifying_race', 'Course qualificative', 'certification', 'Trophy', '#f59e0b', 'Course permettant une qualification pour une autre épreuve', 2),
  
  -- Terrain
  ('line_course', 'Course en ligne', 'terrain', 'TrendingUp', '#3b82f6', 'Départ et arrivée à des endroits différents', 10),
  ('circuit_course', 'Course sur circuit', 'terrain', 'RefreshCw', '#8b5cf6', 'Course en boucle(s)', 11),
  ('road_race', 'Course sur route', 'terrain', 'RouteIcon', '#6366f1', 'Course majoritairement sur route goudronnée', 12),
  ('nature_race', 'Course nature', 'terrain', 'Trees', '#22c55e', 'Course en milieu naturel (chemins, sentiers)', 13),
  ('mountain_race', 'Course en montagne', 'terrain', 'Mountain', '#0ea5e9', 'Course avec dénivelé important en zone montagneuse', 14),
  
  -- Style
  ('festive_race', 'Course festive', 'style', 'PartyPopper', '#ec4899', 'Ambiance festive, déguisements encouragés', 20),
  ('elimination_race', 'Course à élimination', 'style', 'Zap', '#ef4444', 'Les derniers sont éliminés progressivement', 21),
  
  -- Trail Distance Categories
  ('trail_xxs', 'Trail XXS (0-24 km)', 'trail_distance', 'Footprints', '#84cc16', 'Trail très courte distance', 30),
  ('trail_xs', 'Trail XS (25-44 km)', 'trail_distance', 'Footprints', '#22c55e', 'Trail courte distance', 31),
  ('trail_s', 'Trail S (45-74 km)', 'trail_distance', 'Footprints', '#10b981', 'Trail distance moyenne', 32),
  ('trail_m', 'Trail M (75-114 km)', 'trail_distance', 'Footprints', '#0ea5e9', 'Trail longue distance', 33),
  ('trail_l', 'Trail L (115-154 km)', 'trail_distance', 'Footprints', '#3b82f6', 'Trail très longue distance', 34),
  ('trail_xl', 'Trail XL (155-209 km)', 'trail_distance', 'Footprints', '#8b5cf6', 'Trail ultra distance', 35),
  ('trail_xxl', 'Trail XXL (210+ km)', 'trail_distance', 'Footprints', '#a855f7', 'Trail extreme distance', 36)
ON CONFLICT (code) DO NOTHING;

-- Add helpful comment
COMMENT ON TABLE event_characteristic_types IS 'Types de caractéristiques pour catégoriser les événements sportifs';
COMMENT ON TABLE event_characteristics IS 'Association entre événements et leurs caractéristiques';
