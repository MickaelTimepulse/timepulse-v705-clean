/*
  # Move Extensions from Public Schema

  1. Changes
    - Move pg_trgm and unaccent extensions to extensions schema
    - This is a best practice to avoid cluttering the public schema

  2. Security
    - Extensions in public schema can cause security issues
    - Moving to separate schema improves organization

  Note: This migration may need to be run with elevated privileges
*/

-- Create extensions schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS extensions;

-- Move unaccent extension
DROP EXTENSION IF EXISTS unaccent CASCADE;
CREATE EXTENSION IF NOT EXISTS unaccent SCHEMA extensions;

-- Move pg_trgm extension
DROP EXTENSION IF EXISTS pg_trgm CASCADE;
CREATE EXTENSION IF NOT EXISTS pg_trgm SCHEMA extensions;

-- Grant usage on extensions schema
GRANT USAGE ON SCHEMA extensions TO authenticated;
GRANT USAGE ON SCHEMA extensions TO anon;