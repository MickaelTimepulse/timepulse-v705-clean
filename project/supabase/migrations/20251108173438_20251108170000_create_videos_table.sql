/*
  # Create Videos Management System

  1. New Tables
    - `videos`
      - `id` (uuid, primary key)
      - `title` (text) - Title of the video
      - `description` (text) - Optional description
      - `youtube_url` (text) - Full YouTube URL
      - `youtube_id` (text) - Extracted YouTube video ID
      - `event_id` (uuid) - Optional link to event
      - `race_id` (uuid) - Optional link to specific race
      - `published_date` (date) - Date of the video
      - `is_featured` (boolean) - Highlight on homepage
      - `view_count` (integer) - Track views
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `videos` table
    - Public can read published videos
    - Only admins can create/update/delete videos

  3. Indexes
    - Index on event_id for filtering
    - Index on published_date for sorting
    - Index on is_featured for homepage
*/

CREATE TABLE IF NOT EXISTS videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  youtube_url text NOT NULL,
  youtube_id text NOT NULL,
  event_id uuid REFERENCES events(id) ON DELETE SET NULL,
  race_id uuid REFERENCES races(id) ON DELETE SET NULL,
  published_date date DEFAULT CURRENT_DATE,
  is_featured boolean DEFAULT false,
  view_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published videos"
  ON videos FOR SELECT
  USING (true);

CREATE POLICY "Super admins can insert videos"
  ON videos FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.role = 'super_admin'
    )
  );

CREATE POLICY "Super admins can update videos"
  ON videos FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.role = 'super_admin'
    )
  );

CREATE POLICY "Super admins can delete videos"
  ON videos FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.role = 'super_admin'
    )
  );

CREATE INDEX IF NOT EXISTS idx_videos_event_id ON videos(event_id);
CREATE INDEX IF NOT EXISTS idx_videos_published_date ON videos(published_date DESC);
CREATE INDEX IF NOT EXISTS idx_videos_featured ON videos(is_featured) WHERE is_featured = true;

CREATE OR REPLACE FUNCTION update_videos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER videos_updated_at
  BEFORE UPDATE ON videos
  FOR EACH ROW
  EXECUTE FUNCTION update_videos_updated_at();
