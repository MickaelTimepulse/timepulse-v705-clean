/*
  # Add Relay and Ekiden Characteristics

  1. Changes
    - Add "Course en relais" certification characteristic
    - Add "Ekiden Officiel" certification characteristic

  2. Details
    - Both added to 'certification' category
    - Using appropriate icons and colors
    - Proper display order after existing certifications
*/

-- Add new certification characteristics
INSERT INTO event_characteristic_types (code, name, category, icon, color, description, display_order) VALUES
  ('relay_race', 'Course en relais', 'certification', 'Users', '#06b6d4', 'Course disputée en équipe avec passage de relais', 3),
  ('ekiden_official', 'Ekiden Officiel', 'certification', 'Flag', '#d946ef', 'Ekiden officiel (relais marathon 42,195 km)', 4)
ON CONFLICT (code) DO NOTHING;