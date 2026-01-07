/*
  # Extend Email Templates System

  1. Changes
    - Add recipient_type to define who receives the email (runners, organizers, admins, volunteers)
    - Add trigger_event to define when the email is sent
    - Add cc_emails for carbon copy addresses
    - Add category for email classification
    - Add plain_text_body for simple text editor
    - Add template_type to differentiate system vs custom templates

  2. Security
    - Maintain existing RLS policies
    - Add admin functions to manage templates
*/

-- Add new columns to email_templates
ALTER TABLE email_templates
  ADD COLUMN IF NOT EXISTS recipient_type text DEFAULT 'runners' CHECK (recipient_type IN ('runners', 'organizers', 'admins', 'volunteers', 'speakers', 'all')),
  ADD COLUMN IF NOT EXISTS trigger_event text,
  ADD COLUMN IF NOT EXISTS cc_emails jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS category text DEFAULT 'general' CHECK (category IN ('inscription', 'paiement', 'rappel', 'confirmation', 'modification', 'bourse_dossard', 'covoiturage', 'benevolat', 'resultats', 'general')),
  ADD COLUMN IF NOT EXISTS plain_text_body text,
  ADD COLUMN IF NOT EXISTS template_type text DEFAULT 'system' CHECK (template_type IN ('system', 'custom')),
  ADD COLUMN IF NOT EXISTS background_image text,
  ADD COLUMN IF NOT EXISTS background_color text DEFAULT '#ffffff',
  ADD COLUMN IF NOT EXISTS opacity int DEFAULT 100 CHECK (opacity >= 0 AND opacity <= 100);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_email_templates_category ON email_templates(category);
CREATE INDEX IF NOT EXISTS idx_email_templates_recipient_type ON email_templates(recipient_type);
CREATE INDEX IF NOT EXISTS idx_email_templates_trigger_event ON email_templates(trigger_event);
CREATE INDEX IF NOT EXISTS idx_email_templates_is_active ON email_templates(is_active);

-- Function to get all email templates (admin)
CREATE OR REPLACE FUNCTION admin_get_email_templates()
RETURNS SETOF email_templates
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user is admin
  IF NOT EXISTS (
    SELECT 1 FROM admin_users
    WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
  ) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN QUERY
  SELECT * FROM email_templates
  ORDER BY category, name;
END;
$$;

-- Function to update email template (admin)
CREATE OR REPLACE FUNCTION admin_update_email_template(
  p_id uuid,
  p_subject text,
  p_html_body text,
  p_text_body text DEFAULT NULL,
  p_plain_text_body text DEFAULT NULL,
  p_is_active boolean DEFAULT true,
  p_recipient_type text DEFAULT 'runners',
  p_trigger_event text DEFAULT NULL,
  p_cc_emails jsonb DEFAULT '[]'::jsonb,
  p_background_image text DEFAULT NULL,
  p_background_color text DEFAULT '#ffffff',
  p_opacity int DEFAULT 100
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user is admin
  IF NOT EXISTS (
    SELECT 1 FROM admin_users
    WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
  ) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  UPDATE email_templates
  SET
    subject = p_subject,
    html_body = p_html_body,
    text_body = p_text_body,
    plain_text_body = p_plain_text_body,
    is_active = p_is_active,
    recipient_type = p_recipient_type,
    trigger_event = p_trigger_event,
    cc_emails = p_cc_emails,
    background_image = p_background_image,
    background_color = p_background_color,
    opacity = p_opacity,
    updated_at = now()
  WHERE id = p_id;

  RETURN FOUND;
END;
$$;

-- Function to create custom email template
CREATE OR REPLACE FUNCTION admin_create_email_template(
  p_template_key text,
  p_name text,
  p_description text,
  p_subject text,
  p_html_body text,
  p_category text DEFAULT 'general',
  p_recipient_type text DEFAULT 'runners',
  p_trigger_event text DEFAULT NULL,
  p_available_variables jsonb DEFAULT '[]'::jsonb,
  p_cc_emails jsonb DEFAULT '[]'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_template_id uuid;
BEGIN
  -- Check if user is admin
  IF NOT EXISTS (
    SELECT 1 FROM admin_users
    WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
  ) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  INSERT INTO email_templates (
    template_key,
    name,
    description,
    subject,
    html_body,
    category,
    recipient_type,
    trigger_event,
    available_variables,
    cc_emails,
    template_type
  ) VALUES (
    p_template_key,
    p_name,
    p_description,
    p_subject,
    p_html_body,
    p_category,
    p_recipient_type,
    p_trigger_event,
    p_available_variables,
    p_cc_emails,
    'custom'
  )
  RETURNING id INTO v_template_id;

  RETURN v_template_id;
END;
$$;

-- Function to duplicate email template
CREATE OR REPLACE FUNCTION admin_duplicate_email_template(p_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_id uuid;
  v_template email_templates;
BEGIN
  -- Check if user is admin
  IF NOT EXISTS (
    SELECT 1 FROM admin_users
    WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
  ) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Get the template to duplicate
  SELECT * INTO v_template FROM email_templates WHERE id = p_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Template not found';
  END IF;

  -- Insert duplicate with new key
  INSERT INTO email_templates (
    template_key,
    name,
    description,
    subject,
    html_body,
    text_body,
    plain_text_body,
    available_variables,
    is_active,
    category,
    recipient_type,
    trigger_event,
    cc_emails,
    template_type,
    background_image,
    background_color,
    opacity
  ) VALUES (
    v_template.template_key || '_copy_' || gen_random_uuid()::text,
    v_template.name || ' (Copie)',
    v_template.description,
    v_template.subject,
    v_template.html_body,
    v_template.text_body,
    v_template.plain_text_body,
    v_template.available_variables,
    false,
    v_template.category,
    v_template.recipient_type,
    v_template.trigger_event,
    v_template.cc_emails,
    'custom',
    v_template.background_image,
    v_template.background_color,
    v_template.opacity
  )
  RETURNING id INTO v_new_id;

  RETURN v_new_id;
END;
$$;

-- Insert new email templates for bib exchange and other events
INSERT INTO email_templates (template_key, name, description, category, recipient_type, trigger_event, subject, html_body, available_variables) VALUES
(
  'bib_exchange_seller_listing',
  'Mise en vente de dossard',
  'Email envoyé au vendeur lors de la mise en vente de son dossard',
  'bourse_dossard',
  'runners',
  'bib_listed_for_sale',
  'Votre dossard est en vente - {{event_name}}',
  '<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #fff; padding: 30px; border: 1px solid #e5e7eb; }
    .info-box { background: #fffbeb; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b; }
    .button { display: inline-block; background: #f59e0b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { text-align: center; color: #6b7280; padding: 20px; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🏷️ Dossard en vente</h1>
    </div>
    <div class="content">
      <p>Bonjour <strong>{{athlete_name}}</strong>,</p>

      <p>Votre dossard pour <strong>{{event_name}}</strong> ({{race_name}}) a bien été mis en vente sur la bourse d''échange.</p>

      <div class="info-box">
        <h3>Détails de votre annonce :</h3>
        <p><strong>Numéro de dossard :</strong> {{bib_number}}</p>
        <p><strong>Course :</strong> {{race_name}}</p>
        <p><strong>Prix demandé :</strong> {{price}} €</p>
        <p><strong>Code de gestion :</strong> {{management_code}}</p>
      </div>

      <p>Vous recevrez un email automatique dès qu''un coureur reprendra votre dossard.</p>

      <p><strong>Important :</strong> Vous pouvez retirer votre annonce à tout moment depuis votre espace personnel.</p>

      <div style="text-align: center;">
        <a href="{{bib_exchange_url}}" class="button">Gérer mon annonce</a>
      </div>

      <p>Sportivement,<br><strong>L''équipe Timepulse</strong></p>
    </div>
    <div class="footer">
      <p>© 2025 Timepulse - Bourse d''échange de dossards</p>
    </div>
  </div>
</body>
</html>',
  '["athlete_name", "event_name", "race_name", "bib_number", "price", "management_code", "bib_exchange_url"]'::jsonb
),
(
  'bib_exchange_buyer_confirmation',
  'Confirmation reprise de dossard',
  'Email envoyé à l''acheteur lors de la reprise d''un dossard',
  'bourse_dossard',
  'runners',
  'bib_purchased',
  'Confirmation de reprise de dossard - {{event_name}}',
  '<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #fff; padding: 30px; border: 1px solid #e5e7eb; }
    .info-box { background: #ecfdf5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981; }
    .button { display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { text-align: center; color: #6b7280; padding: 20px; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✅ Dossard confirmé</h1>
    </div>
    <div class="content">
      <p>Bonjour <strong>{{buyer_name}}</strong>,</p>

      <p>Félicitations ! Vous avez bien repris le dossard pour <strong>{{event_name}}</strong>.</p>

      <div class="info-box">
        <h3>Détails de votre inscription :</h3>
        <p><strong>Numéro de dossard :</strong> {{bib_number}}</p>
        <p><strong>Course :</strong> {{race_name}}</p>
        <p><strong>Montant payé :</strong> {{price}} €</p>
        <p><strong>Date de l''événement :</strong> {{event_date}}</p>
        <p><strong>Code de gestion :</strong> {{management_code}}</p>
      </div>

      <p><strong>Important :</strong> Votre inscription est maintenant active. Vous pouvez consulter tous les détails de l''événement dans votre espace personnel.</p>

      <div style="text-align: center;">
        <a href="{{event_url}}" class="button">Voir les détails de l''événement</a>
      </div>

      <p>Bon entraînement et à bientôt sur la ligne de départ !<br><strong>L''équipe Timepulse</strong></p>
    </div>
    <div class="footer">
      <p>© 2025 Timepulse - Bourse d''échange de dossards</p>
    </div>
  </div>
</body>
</html>',
  '["buyer_name", "event_name", "race_name", "bib_number", "price", "event_date", "management_code", "event_url"]'::jsonb
),
(
  'bib_exchange_seller_sold',
  'Dossard vendu',
  'Email envoyé au vendeur quand son dossard est vendu',
  'bourse_dossard',
  'runners',
  'bib_sold',
  'Votre dossard a été vendu - {{event_name}}',
  '<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #fff; padding: 30px; border: 1px solid #e5e7eb; }
    .info-box { background: #ecfdf5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981; }
    .button { display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { text-align: center; color: #6b7280; padding: 20px; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Dossard vendu</h1>
    </div>
    <div class="content">
      <p>Bonjour <strong>{{seller_name}}</strong>,</p>

      <p>Bonne nouvelle ! Votre dossard pour <strong>{{event_name}}</strong> a été vendu.</p>

      <div class="info-box">
        <h3>Détails de la vente :</h3>
        <p><strong>Course :</strong> {{race_name}}</p>
        <p><strong>Numéro de dossard :</strong> {{bib_number}}</p>
        <p><strong>Prix de vente :</strong> {{price}} €</p>
        <p><strong>Date de vente :</strong> {{sale_date}}</p>
      </div>

      <p>Le remboursement sera effectué selon les modalités définies par l''organisateur. Vous recevrez un email de confirmation du remboursement dans les prochains jours.</p>

      <p>Merci d''avoir utilisé la bourse d''échange Timepulse !<br><strong>L''équipe Timepulse</strong></p>
    </div>
    <div class="footer">
      <p>© 2025 Timepulse - Bourse d''échange de dossards</p>
    </div>
  </div>
</body>
</html>',
  '["seller_name", "event_name", "race_name", "bib_number", "price", "sale_date"]'::jsonb
),
(
  'refund_confirmation',
  'Confirmation de remboursement',
  'Email envoyé lors du remboursement d''une inscription',
  'paiement',
  'runners',
  'refund_processed',
  'Remboursement confirmé - {{event_name}}',
  '<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #fff; padding: 30px; border: 1px solid #e5e7eb; }
    .info-box { background: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb; }
    .footer { text-align: center; color: #6b7280; padding: 20px; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>💰 Remboursement effectué</h1>
    </div>
    <div class="content">
      <p>Bonjour <strong>{{athlete_name}}</strong>,</p>

      <p>Votre remboursement pour l''inscription à <strong>{{event_name}}</strong> a bien été traité.</p>

      <div class="info-box">
        <h3>Détails du remboursement :</h3>
        <p><strong>Montant remboursé :</strong> {{refund_amount}} €</p>
        <p><strong>Date du remboursement :</strong> {{refund_date}}</p>
        <p><strong>Méthode de paiement :</strong> {{payment_method}}</p>
        <p><strong>N° de transaction :</strong> {{transaction_id}}</p>
      </div>

      <p>Le montant apparaîtra sur votre compte dans un délai de 5 à 10 jours ouvrés selon votre établissement bancaire.</p>

      <p>Si vous avez des questions, n''hésitez pas à nous contacter.</p>

      <p>Cordialement,<br><strong>L''équipe Timepulse</strong></p>
    </div>
    <div class="footer">
      <p>© 2025 Timepulse - Chronométrage d''événements sportifs</p>
    </div>
  </div>
</body>
</html>',
  '["athlete_name", "event_name", "refund_amount", "refund_date", "payment_method", "transaction_id"]'::jsonb
),
(
  'organizer_bib_exchange_notification',
  'Notification organisateur - Échange dossard',
  'Email envoyé à l''organisateur lors d''un échange de dossard',
  'bourse_dossard',
  'organizers',
  'bib_exchange_completed',
  'Échange de dossard - {{event_name}}',
  '<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #fff; padding: 30px; border: 1px solid #e5e7eb; }
    .info-box { background: #eef2ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #6366f1; }
    .button { display: inline-block; background: #6366f1; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { text-align: center; color: #6b7280; padding: 20px; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📢 Échange de dossard</h1>
    </div>
    <div class="content">
      <p>Bonjour <strong>{{organizer_name}}</strong>,</p>

      <p>Un échange de dossard vient d''être effectué pour votre événement <strong>{{event_name}}</strong>.</p>

      <div class="info-box">
        <h3>Détails de l''échange :</h3>
        <p><strong>Vendeur :</strong> {{seller_name}}</p>
        <p><strong>Acheteur :</strong> {{buyer_name}}</p>
        <p><strong>Course :</strong> {{race_name}}</p>
        <p><strong>Dossard :</strong> {{bib_number}}</p>
        <p><strong>Montant :</strong> {{price}} €</p>
        <p><strong>Date :</strong> {{exchange_date}}</p>
      </div>

      <p>La liste des inscrits a été mise à jour automatiquement.</p>

      <div style="text-align: center;">
        <a href="{{entries_url}}" class="button">Voir les inscriptions</a>
      </div>

      <p>Cordialement,<br><strong>L''équipe Timepulse</strong></p>
    </div>
    <div class="footer">
      <p>© 2025 Timepulse - Bourse d''échange de dossards</p>
    </div>
  </div>
</body>
</html>',
  '["organizer_name", "event_name", "seller_name", "buyer_name", "race_name", "bib_number", "price", "exchange_date", "entries_url"]'::jsonb
)
ON CONFLICT (template_key) DO NOTHING;