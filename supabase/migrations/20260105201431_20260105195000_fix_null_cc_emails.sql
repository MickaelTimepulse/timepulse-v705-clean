/*
  # Fix NULL cc_emails in existing templates

  1. Changes
    - Update all templates with NULL cc_emails to have an empty array []
    - Ensures backward compatibility with existing templates

  2. Security
    - No RLS changes, just data cleanup
*/

-- Update all existing templates that have NULL cc_emails
UPDATE email_templates
SET cc_emails = '[]'::jsonb
WHERE cc_emails IS NULL;

-- Ensure all templates have the cc_emails field as an array
UPDATE email_templates
SET cc_emails = '[]'::jsonb
WHERE cc_emails::text = 'null';