/*
  # Fix Email Templates - Use Local Sport Images Only

  1. Changes
    - Replace ALL external Pexels URLs with local image paths
    - Use {{site_url}}/email_assets/ for all images
    - Remove cat, pizza, and all non-sport images
    
  2. Images to Upload
    You need to upload these sport images to /public/email_assets/:
    - marathon-runners.jpg (for event reminders, welcome emails)
    - runner-victory.jpg (for results, confirmations)
    - running-outdoor.jpg (for refunds, general emails)
    - starting-line.jpg (for bib exchange, race info)
    - trail-running.jpg (for account deletion, farewells)
    - athletics-track.jpg (for registration confirmations)
*/

-- Use local images instead of Pexels
-- Image: Marathon runners in action
UPDATE email_templates
SET html_body = REPLACE(
  html_body, 
  'https://images.pexels.com/photos/3757376/pexels-photo-3757376.jpeg?auto=compress&cs=tinysrgb&w=1200',
  '{{site_url}}/email_assets/marathon-runners.jpg'
)
WHERE html_body LIKE '%pexels.com%';

-- Replace ALL remaining Pexels images with appropriate local images
UPDATE email_templates
SET html_body = REPLACE(html_body, 'https://images.pexels.com/photos/3621187/pexels-photo-3621187.jpeg?auto=compress&cs=tinysrgb&w=1200', '{{site_url}}/email_assets/running-outdoor.jpg')
WHERE html_body LIKE '%3621187%';

UPDATE email_templates
SET html_body = REPLACE(html_body, 'https://images.pexels.com/photos/40751/running-runner-long-distance-fitness-40751.jpeg?auto=compress&cs=tinysrgb&w=1200', '{{site_url}}/email_assets/marathon-runners.jpg')
WHERE html_body LIKE '%40751%';

UPDATE email_templates
SET html_body = REPLACE(html_body, 'https://images.pexels.com/photos/2803160/pexels-photo-2803160.jpeg?auto=compress&cs=tinysrgb&w=1200', '{{site_url}}/email_assets/trail-running.jpg')
WHERE html_body LIKE '%2803160%';

UPDATE email_templates
SET html_body = REPLACE(html_body, 'https://images.pexels.com/photos/2361952/pexels-photo-2361952.jpeg?auto=compress&cs=tinysrgb&w=1200', '{{site_url}}/email_assets/runner-victory.jpg')
WHERE html_body LIKE '%2361952%';

UPDATE email_templates
SET html_body = REPLACE(html_body, 'https://images.pexels.com/photos/221210/pexels-photo-221210.jpeg?auto=compress&cs=tinysrgb&w=1200', '{{site_url}}/email_assets/starting-line.jpg')
WHERE html_body LIKE '%221210%';

UPDATE email_templates
SET html_body = REPLACE(html_body, 'https://images.pexels.com/photos/2254107/pexels-photo-2254107.jpeg?auto=compress&cs=tinysrgb&w=1200', '{{site_url}}/email_assets/athletics-track.jpg')
WHERE html_body LIKE '%2254107%';

-- Verification: Show templates that still have external URLs (should be none)
-- SELECT template_key, 
--   CASE 
--     WHEN html_body LIKE '%pexels%' THEN 'Still has Pexels ❌'
--     WHEN html_body LIKE '%{{site_url}}%' THEN 'Uses local images ✅'
--     ELSE 'Unknown'
--   END as image_source
-- FROM email_templates;