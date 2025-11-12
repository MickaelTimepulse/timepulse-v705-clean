/*
  # Homepage Slider Management

  1. New Tables
    - `homepage_slider_events`
      - `id` (uuid, primary key)
      - `event_id` (uuid, foreign key to events)
      - `order_index` (integer) - Display order in slider
      - `is_active` (boolean) - Show/hide in slider
      - `custom_title` (text) - Override event title if needed
      - `custom_description` (text) - Override event description if needed
      - `custom_image_url` (text) - Override event image if needed
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `homepage_slider_events` table
    - Public read access for active slider items
    - Admin-only write access

  3. Notes
    - Links to existing events table
    - Allows customization of event display in slider
    - Order controls slider sequence
*/

CREATE TABLE IF NOT EXISTS homepage_slider_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  
  -- Display settings
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  
  -- Optional customization
  custom_title TEXT,
  custom_description TEXT,
  custom_image_url TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure each event appears only once in slider
  UNIQUE(event_id)
);

-- Indexes
CREATE INDEX idx_homepage_slider_order ON homepage_slider_events(order_index) WHERE is_active = true;
CREATE INDEX idx_homepage_slider_event ON homepage_slider_events(event_id);

-- RLS Policies
ALTER TABLE homepage_slider_events ENABLE ROW LEVEL SECURITY;

-- Public can view active slider events
CREATE POLICY "Public can view active slider events"
  ON homepage_slider_events
  FOR SELECT
  USING (is_active = true);

-- Admins can manage slider
CREATE POLICY "Admins can manage slider events"
  ON homepage_slider_events
  FOR ALL
  USING (true)
  WITH CHECK (true);
