/*
  # Create Event Partners Module

  1. New Tables
    - `event_partners`
      - `id` (uuid, primary key)
      - `event_id` (uuid, foreign key to events)
      - `name` (text, optional partner name)
      - `logo_url` (text, URL to logo in storage)
      - `website_url` (text, optional website link)
      - `display_order` (integer, for ordering partners)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Storage
    - Create `event-partner-logos` bucket for storing partner logos
    - Set up RLS policies for organizers to manage their event partners

  3. Security
    - Enable RLS on `event_partners` table
    - Add policies for organizers to manage partners for their events
    - Add public read access for displaying partners on event pages
*/

-- Create event_partners table
CREATE TABLE IF NOT EXISTS event_partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name text,
  logo_url text NOT NULL,
  website_url text,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE event_partners ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_event_partners_event_id ON event_partners(event_id);
CREATE INDEX IF NOT EXISTS idx_event_partners_display_order ON event_partners(event_id, display_order);

-- RLS Policies

-- Public can view partners for published events
CREATE POLICY "Public can view event partners"
  ON event_partners FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_partners.event_id
      AND events.status = 'published'
    )
  );

-- Organizers can view their event partners
CREATE POLICY "Organizers can view own event partners"
  ON event_partners FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_partners.event_id
      AND events.organizer_id IN (
        SELECT id FROM organizers
        WHERE user_id = auth.uid()
      )
    )
  );

-- Organizers can insert partners for their events
CREATE POLICY "Organizers can insert event partners"
  ON event_partners FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_partners.event_id
      AND events.organizer_id IN (
        SELECT id FROM organizers
        WHERE user_id = auth.uid()
      )
    )
  );

-- Organizers can update their event partners
CREATE POLICY "Organizers can update own event partners"
  ON event_partners FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_partners.event_id
      AND events.organizer_id IN (
        SELECT id FROM organizers
        WHERE user_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_partners.event_id
      AND events.organizer_id IN (
        SELECT id FROM organizers
        WHERE user_id = auth.uid()
      )
    )
  );

-- Organizers can delete their event partners
CREATE POLICY "Organizers can delete own event partners"
  ON event_partners FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_partners.event_id
      AND events.organizer_id IN (
        SELECT id FROM organizers
        WHERE user_id = auth.uid()
      )
    )
  );

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_event_partners_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER event_partners_updated_at
  BEFORE UPDATE ON event_partners
  FOR EACH ROW
  EXECUTE FUNCTION update_event_partners_updated_at();
