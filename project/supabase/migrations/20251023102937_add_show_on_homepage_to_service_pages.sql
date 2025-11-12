/*
  # Add show_on_homepage column to service_pages

  1. Changes
    - Add `show_on_homepage` boolean column to service_pages table
    - Default value is true for published pages
    - This replaces the separate homepage_features table
  
  2. Migration
    - Add column with default true
    - Update existing records to show on homepage if published
*/

-- Add show_on_homepage column
ALTER TABLE service_pages 
ADD COLUMN IF NOT EXISTS show_on_homepage boolean DEFAULT true;

-- Update existing published pages to show on homepage
UPDATE service_pages 
SET show_on_homepage = true 
WHERE is_published = true;