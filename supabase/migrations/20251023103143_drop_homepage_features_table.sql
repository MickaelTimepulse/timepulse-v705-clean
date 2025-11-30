/*
  # Drop homepage_features table

  1. Changes
    - Drop the `homepage_features` table (no longer needed)
    - All homepage features now managed through `service_pages` table
    - The `show_on_homepage` column in service_pages controls homepage display
  
  2. Cleanup
    - Remove obsolete table and policies
*/

-- Drop the homepage_features table
DROP TABLE IF EXISTS homepage_features CASCADE;