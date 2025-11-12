/*
  # Media Library for Timepulse

  1. New Tables
    - `media_files`
      - `id` (uuid, primary key)
      - `filename` (text) - Original filename
      - `file_path` (text) - Path in storage
      - `file_url` (text) - Public URL
      - `file_type` (text) - MIME type
      - `file_size` (bigint) - Size in bytes
      - `width` (integer) - Image width (if image)
      - `height` (integer) - Image height (if image)
      - `alt_text` (text) - Alt text for accessibility
      - `category` (text) - Category (hero, icon, content, etc.)
      - `uploaded_by` (uuid) - User who uploaded
      - `created_at` (timestamptz)

  2. Storage
    - Create storage bucket for media files
    - Public read access
    - Authenticated write access

  3. Security
    - Enable RLS on `media_files` table
    - Admins can manage all files
    - Public can view file records
*/

-- Create media_files table
CREATE TABLE IF NOT EXISTS media_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- File info
  filename TEXT NOT NULL,
  file_path TEXT NOT NULL UNIQUE,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT NOT NULL,

  -- Image dimensions (if applicable)
  width INTEGER,
  height INTEGER,

  -- Metadata
  alt_text TEXT,
  category TEXT DEFAULT 'general' CHECK (
    category IN ('hero', 'icon', 'content', 'thumbnail', 'general')
  ),

  -- User tracking
  uploaded_by UUID NOT NULL REFERENCES admin_users(id),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_media_files_category ON media_files(category);
CREATE INDEX idx_media_files_type ON media_files(file_type);
CREATE INDEX idx_media_files_uploaded_by ON media_files(uploaded_by);
CREATE INDEX idx_media_files_created ON media_files(created_at DESC);

-- RLS Policies
ALTER TABLE media_files ENABLE ROW LEVEL SECURITY;

-- Public can view media records
CREATE POLICY "Public can view media files"
  ON media_files
  FOR SELECT
  USING (true);

-- Admins can manage all media
CREATE POLICY "Admins can manage media files"
  ON media_files
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.role IN ('admin', 'super_admin')
    )
  );

-- Create storage bucket for media (via Supabase dashboard or CLI)
-- This SQL creates the table structure; storage bucket is managed separately
INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Public can view media"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'media');

CREATE POLICY "Authenticated admins can upload media"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'media' AND
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Authenticated admins can update media"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'media' AND
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Authenticated admins can delete media"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'media' AND
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.role IN ('admin', 'super_admin')
    )
  );
