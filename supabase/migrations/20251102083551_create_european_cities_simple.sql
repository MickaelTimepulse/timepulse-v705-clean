/*
  # Create European Cities Database
  
  1. New Table
    - `european_cities`
      - `id` (uuid, primary key)
      - `city_name` (text) - Nom de la ville
      - `postal_code` (text) - Code postal
      - `country_code` (text) - Code pays ISO (FR, ES, IT, etc.)
      - `country_name` (text) - Nom du pays
      - `region` (text) - Région/Province
      - `latitude` (numeric) - Latitude
      - `longitude` (numeric) - Longitude
      - `created_at` (timestamptz)
  
  2. Indexes
    - Index sur city_name pour recherche rapide
    - Index sur postal_code
    - Index sur country_code
    - Index full-text search
  
  3. Security
    - RLS activé
    - Lecture publique pour tous
*/

-- Enable trigram extension for fuzzy search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create table
CREATE TABLE IF NOT EXISTS european_cities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  city_name text NOT NULL,
  postal_code text NOT NULL,
  country_code text NOT NULL,
  country_name text NOT NULL,
  region text,
  latitude numeric(10, 7),
  longitude numeric(10, 7),
  created_at timestamptz DEFAULT now()
);

-- Create indexes for fast search
CREATE INDEX IF NOT EXISTS idx_european_cities_name 
  ON european_cities(city_name);

CREATE INDEX IF NOT EXISTS idx_european_cities_postal 
  ON european_cities(postal_code);

CREATE INDEX IF NOT EXISTS idx_european_cities_country 
  ON european_cities(country_code);

-- Create full-text search index with trigram
CREATE INDEX IF NOT EXISTS idx_european_cities_name_trgm 
  ON european_cities USING gin(city_name gin_trgm_ops);

-- Composite index for city + country search
CREATE INDEX IF NOT EXISTS idx_european_cities_name_country 
  ON european_cities(city_name, country_code);

-- Enable RLS
ALTER TABLE european_cities ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Public can read cities"
  ON european_cities
  FOR SELECT
  TO anon, authenticated
  USING (true);

COMMENT ON TABLE european_cities IS 
  'Database of European cities with postal codes and country information for autocomplete';
