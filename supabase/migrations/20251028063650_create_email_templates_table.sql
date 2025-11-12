/*
  # Create Email Templates Table

  1. New Tables
    - email_templates: Store customizable email templates
  
  2. Security
    - Enable RLS
    - Only admins can manage templates
*/

CREATE TABLE IF NOT EXISTS email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_key text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  subject text NOT NULL,
  html_body text NOT NULL,
  text_body text,
  available_variables jsonb DEFAULT '[]'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view email templates"
  ON email_templates
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

CREATE POLICY "Admins can manage email templates"
  ON email_templates
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

-- Insert default templates
INSERT INTO email_templates (template_key, name, description, subject, html_body, available_variables) VALUES
(
  'admin_welcome',
  'Email de bienvenue admin',
  'Envoyé automatiquement lors de la création d''un compte admin',
  'Bienvenue sur Timepulse Admin',
  '<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #fff; padding: 30px; border: 1px solid #e5e7eb; }
    .credentials { background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .button { display: inline-block; background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { text-align: center; color: #6b7280; padding: 20px; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Bienvenue sur Timepulse</h1>
    </div>
    <div class="content">
      <p>Bonjour <strong>{{name}}</strong>,</p>
      
      <p>Votre compte administrateur a été créé avec succès sur la plateforme Timepulse.</p>
      
      <div class="credentials">
        <h3>Vos identifiants de connexion :</h3>
        <p><strong>Email :</strong> {{email}}</p>
        <p><strong>Mot de passe :</strong> {{password}}</p>
      </div>
      
      <p><strong>⚠️ Important :</strong> Pour des raisons de sécurité, nous vous recommandons de modifier votre mot de passe lors de votre première connexion.</p>
      
      <div style="text-align: center;">
        <a href="{{loginUrl}}" class="button">Se connecter maintenant</a>
      </div>
      
      <p>Si vous avez des questions, n''hésitez pas à contacter l''équipe Timepulse.</p>
      
      <p>À bientôt,<br><strong>L''équipe Timepulse</strong></p>
    </div>
    <div class="footer">
      <p>© 2025 Timepulse - Chronométrage d''événements sportifs</p>
      <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
    </div>
  </div>
</body>
</html>',
  '["name", "email", "password", "loginUrl"]'::jsonb
),
(
  'admin_credentials_reminder',
  'Rappel des identifiants admin',
  'Envoyé pour rappeler les identifiants de connexion',
  'Rappel de vos identifiants Timepulse',
  '<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #fff; padding: 30px; border: 1px solid #e5e7eb; }
    .info-box { background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981; }
    .button { display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { text-align: center; color: #6b7280; padding: 20px; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔑 Rappel de vos identifiants</h1>
    </div>
    <div class="content">
      <p>Bonjour <strong>{{name}}</strong>,</p>
      
      <p>Vous recevez cet email suite à une demande de rappel de vos identifiants de connexion.</p>
      
      <div class="info-box">
        <h3>Vos identifiants :</h3>
        <p><strong>Email :</strong> {{email}}</p>
        <p><strong>Lien de connexion :</strong> <a href="{{loginUrl}}">{{loginUrl}}</a></p>
      </div>
      
      <p><strong>Note :</strong> Pour des raisons de sécurité, votre mot de passe n''est pas inclus dans cet email. Si vous l''avez oublié, contactez un administrateur pour le réinitialiser.</p>
      
      <div style="text-align: center;">
        <a href="{{loginUrl}}" class="button">Se connecter</a>
      </div>
      
      <p>Si vous n''avez pas demandé cet email, vous pouvez l''ignorer en toute sécurité.</p>
      
      <p>Cordialement,<br><strong>L''équipe Timepulse</strong></p>
    </div>
    <div class="footer">
      <p>© 2025 Timepulse - Chronométrage d''événements sportifs</p>
    </div>
  </div>
</body>
</html>',
  '["name", "email", "loginUrl"]'::jsonb
)
ON CONFLICT (template_key) DO NOTHING;
