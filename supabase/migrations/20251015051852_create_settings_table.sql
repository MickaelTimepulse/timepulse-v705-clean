/*
  # Create Settings Table

  1. New Tables
    - `settings`
      - `id` (uuid, primary key) - Unique identifier
      - `key` (text, unique) - Setting key (e.g., 'openai_api_key')
      - `value` (text) - Setting value (encrypted for sensitive data)
      - `category` (text) - Setting category (e.g., 'api', 'general', 'seo')
      - `description` (text) - Human-readable description
      - `is_sensitive` (boolean) - Flag for sensitive data
      - `created_at` (timestamptz) - Creation timestamp
      - `updated_at` (timestamptz) - Last update timestamp

  2. Security
    - Enable RLS on `settings` table
    - Full access only for development (will be restricted later)
*/

CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value TEXT,
  category TEXT DEFAULT 'general',
  description TEXT,
  is_sensitive BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_settings_key ON settings(key);
CREATE INDEX IF NOT EXISTS idx_settings_category ON settings(category);

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations for development"
  ON settings
  FOR ALL
  USING (true)
  WITH CHECK (true);

INSERT INTO settings (key, value, category, description, is_sensitive) VALUES
  ('openai_api_key', '', 'api', 'Clé API OpenAI pour la génération de contenu IA', true),
  ('site_name', 'Timepulse', 'general', 'Nom du site', false),
  ('seo_auto_generate', 'true', 'seo', 'Activer la génération automatique SEO', false)
ON CONFLICT (key) DO NOTHING;
