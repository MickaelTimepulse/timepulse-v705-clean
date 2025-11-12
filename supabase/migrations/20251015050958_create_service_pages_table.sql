/*
  # Create Service Pages Table

  1. New Tables
    - `service_pages`
      - `id` (uuid, primary key) - Unique identifier
      - `slug` (text, unique) - URL slug (e.g., "chronometrage")
      - `title` (text) - Page title
      - `icon` (text) - Lucide icon name
      - `short_description` (text) - Description shown in card
      - `card_image_url` (text) - Image for homepage card
      - `hero_title` (text) - Hero section title
      - `hero_subtitle` (text) - Hero section subtitle
      - `hero_image_url` (text) - Hero image URL
      - `content` (jsonb) - Page content sections
      - `seo_title` (text) - SEO title
      - `seo_description` (text) - SEO description
      - `is_published` (boolean) - Published status
      - `order_index` (integer) - Display order on homepage
      - `created_at` (timestamptz) - Creation timestamp
      - `updated_at` (timestamptz) - Last update timestamp

  2. Security
    - Enable RLS on `service_pages` table
    - Public read access for published pages
    - No restrictions on insert/update for development
*/

CREATE TABLE IF NOT EXISTS service_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9-]+$'),
  title TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'Circle',
  short_description TEXT DEFAULT '',
  card_image_url TEXT DEFAULT '',
  hero_title TEXT NOT NULL,
  hero_subtitle TEXT DEFAULT '',
  hero_image_url TEXT DEFAULT '',
  content JSONB DEFAULT '[]'::jsonb,
  seo_title TEXT DEFAULT '',
  seo_description TEXT DEFAULT '',
  is_published BOOLEAN DEFAULT false,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_service_pages_slug ON service_pages(slug);
CREATE INDEX IF NOT EXISTS idx_service_pages_published ON service_pages(is_published) WHERE is_published = true;
CREATE INDEX IF NOT EXISTS idx_service_pages_order ON service_pages(order_index);

ALTER TABLE service_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view published service pages"
  ON service_pages
  FOR SELECT
  USING (is_published = true);

CREATE POLICY "Allow all operations for development"
  ON service_pages
  FOR ALL
  USING (true)
  WITH CHECK (true);
