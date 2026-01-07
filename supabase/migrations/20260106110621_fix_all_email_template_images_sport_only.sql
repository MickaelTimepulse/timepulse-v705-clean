/*
  # Fix All Email Template Images - Sport Only

  1. Changes
    - Replace ALL non-sport images with sport images
    - Remove pizza, money, tech images
    - Use only running, cycling, swimming, athletics images
*/

-- 1. Payment confirmation - remplacer par image de finish line
UPDATE email_templates
SET html_body = REPLACE(
  html_body,
  'https://images.pexels.com/photos/2524368/pexels-photo-2524368.jpeg?auto=compress&cs=tinysrgb&w=1200',
  'https://images.pexels.com/photos/2803158/pexels-photo-2803158.jpeg?auto=compress&cs=tinysrgb&w=1200'
)
WHERE template_key = 'payment_confirmation';

-- 2. Admin welcome - remplacer par image de stade/événement sportif
UPDATE email_templates
SET html_body = REPLACE(
  html_body,
  'https://images.pexels.com/photos/3937174/pexels-photo-3937174.jpeg?auto=compress&cs=tinysrgb&w=1200',
  'https://images.pexels.com/photos/2881224/pexels-photo-2881224.jpeg?auto=compress&cs=tinysrgb&w=1200'
)
WHERE template_key = 'admin_welcome';

-- 3. Admin credentials reminder - remplacer par image de chronométrage
UPDATE email_templates
SET html_body = REPLACE(
  html_body,
  'https://images.pexels.com/photos/669615/pexels-photo-669615.jpeg?auto=compress&cs=tinysrgb&w=1200',
  'https://images.pexels.com/photos/618612/pexels-photo-618612.jpeg?auto=compress&cs=tinysrgb&w=1200'
)
WHERE template_key = 'admin_credentials_reminder';

-- 4. Refund confirmation - remplacer par image de running
UPDATE email_templates
SET html_body = REPLACE(
  html_body,
  'https://images.pexels.com/photos/259209/pexels-photo-259209.jpeg?auto=compress&cs=tinysrgb&w=1200',
  'https://images.pexels.com/photos/2422461/pexels-photo-2422461.jpeg?auto=compress&cs=tinysrgb&w=1200'
)
WHERE template_key = 'refund_confirmation';

-- 5. Race results available - remplacer par image de finish/victoire
UPDATE email_templates
SET html_body = REPLACE(
  html_body,
  'https://images.pexels.com/photos/2524368/pexels-photo-2524368.jpeg?auto=compress&cs=tinysrgb&w=1200',
  'https://images.pexels.com/photos/235922/pexels-photo-235922.jpeg?auto=compress&cs=tinysrgb&w=1200'
)
WHERE template_key = 'race_results_available';

-- 6. Bib exchange (all 3) - remplacer par image de dossards/préparation
UPDATE email_templates
SET html_body = REPLACE(
  html_body,
  'https://images.pexels.com/photos/136739/pexels-photo-136739.jpeg?auto=compress&cs=tinysrgb&w=1200',
  'https://images.pexels.com/photos/1566837/pexels-photo-1566837.jpeg?auto=compress&cs=tinysrgb&w=1200'
)
WHERE template_key IN ('bib_exchange_seller_listing', 'bib_exchange_seller_sold', 'bib_exchange_buyer_confirmation');