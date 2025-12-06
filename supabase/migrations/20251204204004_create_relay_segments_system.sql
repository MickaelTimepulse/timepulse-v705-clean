/*
  # Create Relay Segments System
  
  1. New Tables
    - `relay_segments` - Configuration des segments de relais
    - Permet de définir chaque segment avec nom, distance et discipline
  
  2. Disciplines Supportées
    - Course à pied (running)
    - Vélo (cycling)
    - Natation (swimming)
    - Canoë (canoe)
    - Champ personnalisé (custom)
  
  3. Structure
    - Chaque segment a un ordre (position)
    - Distance en km
    - Icône et couleur pour affichage public
    - Champ personnalisé pour disciplines spéciales
  
  4. Security
    - Enable RLS
    - Public read pour affichage des segments
    - Organizers can manage their race segments
*/

-- Create relay segments table
CREATE TABLE IF NOT EXISTS relay_segments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  race_id uuid REFERENCES races(id) ON DELETE CASCADE NOT NULL,
  segment_order integer NOT NULL CHECK (segment_order >= 1),
  name text NOT NULL, -- ex: "Relais 1", "Segment Natation"
  distance numeric(10,3) NOT NULL CHECK (distance > 0), -- en km
  discipline text NOT NULL CHECK (discipline IN ('running', 'cycling', 'swimming', 'canoe', 'custom')),
  custom_discipline text, -- utilisé si discipline = 'custom'
  icon text NOT NULL DEFAULT 'Flag', -- icône Lucide
  color text NOT NULL DEFAULT '#3b82f6', -- couleur du badge
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(race_id, segment_order)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_relay_segments_race_id ON relay_segments(race_id);
CREATE INDEX IF NOT EXISTS idx_relay_segments_order ON relay_segments(race_id, segment_order);

-- Function to calculate total relay distance
CREATE OR REPLACE FUNCTION calculate_relay_total_distance(race_id_param uuid)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total_distance numeric;
BEGIN
  SELECT COALESCE(SUM(distance), 0)
  INTO total_distance
  FROM relay_segments
  WHERE race_id = race_id_param;
  
  RETURN total_distance;
END;
$$;

-- Function to get discipline icon and color
CREATE OR REPLACE FUNCTION get_discipline_display(discipline_param text, custom_param text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  RETURN CASE discipline_param
    WHEN 'running' THEN jsonb_build_object('icon', 'PersonStanding', 'color', '#10b981', 'label', 'Course à pied')
    WHEN 'cycling' THEN jsonb_build_object('icon', 'Bike', 'color', '#f59e0b', 'label', 'Vélo')
    WHEN 'swimming' THEN jsonb_build_object('icon', 'Waves', 'color', '#0ea5e9', 'label', 'Natation')
    WHEN 'canoe' THEN jsonb_build_object('icon', 'Sailboat', 'color', '#8b5cf6', 'label', 'Canoë')
    WHEN 'custom' THEN jsonb_build_object('icon', 'Star', 'color', '#ec4899', 'label', COALESCE(custom_param, 'Autre'))
    ELSE jsonb_build_object('icon', 'Flag', 'color', '#6366f1', 'label', 'Relais')
  END;
END;
$$;

-- Trigger to update timestamps
CREATE OR REPLACE FUNCTION update_relay_segments_timestamp()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_relay_segments_updated_at
BEFORE UPDATE ON relay_segments
FOR EACH ROW
EXECUTE FUNCTION update_relay_segments_timestamp();

-- Enable RLS
ALTER TABLE relay_segments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for relay_segments
CREATE POLICY "Public can view relay segments"
  ON relay_segments FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Organizers can manage their race segments"
  ON relay_segments FOR ALL
  TO authenticated
  USING (
    race_id IN (
      SELECT r.id FROM races r
      INNER JOIN events e ON e.id = r.event_id
      INNER JOIN organizers o ON o.id = e.organizer_id
      WHERE o.user_id = auth.uid()
    )
  )
  WITH CHECK (
    race_id IN (
      SELECT r.id FROM races r
      INNER JOIN events e ON e.id = r.event_id
      INNER JOIN organizers o ON o.id = e.organizer_id
      WHERE o.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all relay segments"
  ON relay_segments FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );

-- Add helpful comments
COMMENT ON TABLE relay_segments IS 'Configuration des segments pour les courses en relais (ex: Ekiden)';
COMMENT ON COLUMN relay_segments.segment_order IS 'Ordre du segment dans le relais (1, 2, 3, etc.)';
COMMENT ON COLUMN relay_segments.distance IS 'Distance du segment en kilomètres';
COMMENT ON COLUMN relay_segments.discipline IS 'Type de discipline: running, cycling, swimming, canoe, ou custom';
COMMENT ON COLUMN relay_segments.custom_discipline IS 'Nom de la discipline personnalisée si discipline=custom';

-- Seed example for Ekiden race
-- Example: Un Ekiden classique (42.195 km réparti sur 6 relais)
-- Uncomment to use as template
/*
INSERT INTO relay_segments (race_id, segment_order, name, distance, discipline, icon, color) VALUES
  ('YOUR_RACE_ID', 1, 'Relais 1', 5.0, 'running', 'PersonStanding', '#10b981'),
  ('YOUR_RACE_ID', 2, 'Relais 2', 10.0, 'running', 'PersonStanding', '#10b981'),
  ('YOUR_RACE_ID', 3, 'Relais 3', 5.0, 'running', 'PersonStanding', '#10b981'),
  ('YOUR_RACE_ID', 4, 'Relais 4', 10.0, 'running', 'PersonStanding', '#10b981'),
  ('YOUR_RACE_ID', 5, 'Relais 5', 5.0, 'running', 'PersonStanding', '#10b981'),
  ('YOUR_RACE_ID', 6, 'Relais 6', 7.195, 'running', 'PersonStanding', '#10b981');
*/
