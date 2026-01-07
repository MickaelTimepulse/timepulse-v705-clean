/*
  # Add Header Image Selection to Email Templates

  1. Changes
    - Add header_image_url column to email_templates
    - This will allow selecting an image from Assets for each template
*/

-- Add header image URL column
ALTER TABLE email_templates 
ADD COLUMN IF NOT EXISTS header_image_url text;

-- Update existing templates to use local images
UPDATE email_templates 
SET header_image_url = '{{site_url}}/email_assets/marathon-runners.jpg'
WHERE template_key IN ('admin_welcome', 'event_reminder_7days', 'registration_confirmation');

UPDATE email_templates 
SET header_image_url = '{{site_url}}/email_assets/runner-victory.jpg'
WHERE template_key IN ('race_results_available', 'payment_confirmation', 'bib_exchange_seller_sold');

UPDATE email_templates 
SET header_image_url = '{{site_url}}/email_assets/starting-line.jpg'
WHERE template_key IN ('bib_exchange_buyer_confirmation', 'bib_number_assigned', 'organizer_bib_exchange_notification');

UPDATE email_templates 
SET header_image_url = '{{site_url}}/email_assets/running-outdoor.jpg'
WHERE template_key IN ('refund_confirmation', 'organizer_new_entry_notification');

UPDATE email_templates 
SET header_image_url = '{{site_url}}/email_assets/trail-running.jpg'
WHERE template_key IN ('organizer_account_deleted');

UPDATE email_templates 
SET header_image_url = '{{site_url}}/email_assets/athletics-track.jpg'
WHERE template_key IN ('bib_exchange_seller_listing', 'organizer_account_created', 'admin_credentials_reminder', 'organizer_password_changed');
