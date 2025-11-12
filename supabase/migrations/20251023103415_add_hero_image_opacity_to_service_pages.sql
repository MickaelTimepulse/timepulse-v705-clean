/*
  # Add hero_image_opacity to service_pages

  1. Changes
    - Add `hero_image_opacity` column to control image opacity
    - Default value is 20 (20% opacity)
    - Used for homepage feature cards background images
*/

-- Add hero_image_opacity column
ALTER TABLE service_pages 
ADD COLUMN IF NOT EXISTS hero_image_opacity integer DEFAULT 20;

-- Ensure existing records have the default value
UPDATE service_pages 
SET hero_image_opacity = 20 
WHERE hero_image_opacity IS NULL;