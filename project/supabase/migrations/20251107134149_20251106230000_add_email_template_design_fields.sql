/*
  # Ajout des champs de design pour les templates d'emails
  
  1. Modifications
    - Ajout de background_image pour l'image de fond
    - Ajout de background_color pour la couleur de fond
    - Ajout de opacity pour l'opacité de l'arrière-plan
    - Ajout de category pour catégoriser les emails
    
  2. Seed Data
    - Insertion des templates d'emails par défaut pour les inscriptions
*/

-- Ajouter les colonnes si elles n'existent pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'email_templates' AND column_name = 'background_image'
  ) THEN
    ALTER TABLE email_templates ADD COLUMN background_image text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'email_templates' AND column_name = 'background_color'
  ) THEN
    ALTER TABLE email_templates ADD COLUMN background_color text DEFAULT '#ffffff';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'email_templates' AND column_name = 'opacity'
  ) THEN
    ALTER TABLE email_templates ADD COLUMN opacity integer DEFAULT 100;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'email_templates' AND column_name = 'category'
  ) THEN
    ALTER TABLE email_templates ADD COLUMN category text DEFAULT 'general';
  END IF;
END $$;

-- Créer un index sur la catégorie
CREATE INDEX IF NOT EXISTS idx_email_templates_category ON email_templates(category);

-- Seed des templates par défaut
INSERT INTO email_templates (
  template_key, name, description, category, subject, html_body, available_variables, is_active
) VALUES
(
  'registration_confirmation',
  'Confirmation d''inscription',
  'Email envoyé après une inscription réussie',
  'inscription',
  'Confirmation de votre inscription - {{event_name}}',
  '<h1 style="color: #1f2937; font-size: 24px; font-weight: bold; margin-bottom: 16px;">Inscription confirmée !</h1>
<p style="color: #4b5563; margin: 12px 0;">Bonjour {{athlete_name}},</p>
<p style="color: #4b5563; margin: 12px 0;">Votre inscription à <strong>{{event_name}}</strong> pour l''épreuve <strong>{{race_name}}</strong> a bien été enregistrée.</p>
<div style="background-color: #f3f4f6; border-left: 4px solid #2563eb; padding: 16px; margin: 16px 0;">
  <p style="margin: 4px 0;"><strong>Numéro de dossard :</strong> {{bib_number}}</p>
  <p style="margin: 4px 0;"><strong>Date d''inscription :</strong> {{registration_date}}</p>
  <p style="margin: 4px 0;"><strong>Code de gestion :</strong> {{management_code}}</p>
</div>
<p style="color: #4b5563; margin: 12px 0;">Conservez précieusement votre code de gestion pour toute modification ultérieure.</p>
<p style="color: #4b5563; margin: 12px 0;">À très bientôt sur la ligne de départ !</p>
<p style="color: #6b7280; margin: 16px 0 0 0; font-size: 14px;">L''équipe Timepulse</p>',
  '["athlete_name", "event_name", "race_name", "bib_number", "registration_date", "management_code"]'::jsonb,
  true
),
(
  'payment_confirmation',
  'Confirmation de paiement',
  'Email envoyé après un paiement réussi',
  'paiement',
  'Paiement confirmé - {{event_name}}',
  '<h1 style="color: #1f2937; font-size: 24px; font-weight: bold; margin-bottom: 16px;">Paiement confirmé ✓</h1>
<p style="color: #4b5563; margin: 12px 0;">Bonjour {{athlete_name}},</p>
<p style="color: #4b5563; margin: 12px 0;">Nous avons bien reçu votre paiement pour <strong>{{event_name}}</strong>.</p>
<div style="background-color: #f3f4f6; border-left: 4px solid #10b981; padding: 16px; margin: 16px 0;">
  <p style="margin: 4px 0;"><strong>Montant :</strong> {{amount}}</p>
  <p style="margin: 4px 0;"><strong>Date :</strong> {{payment_date}}</p>
  <p style="margin: 4px 0;"><strong>Transaction :</strong> {{transaction_id}}</p>
</div>
<p style="color: #4b5563; margin: 12px 0;">Votre inscription est maintenant complète et confirmée.</p>
<p style="color: #6b7280; margin: 16px 0 0 0; font-size: 14px;">L''équipe Timepulse</p>',
  '["athlete_name", "event_name", "amount", "payment_date", "transaction_id"]'::jsonb,
  true
),
(
  'event_reminder_7days',
  'Rappel J-7',
  'Rappel envoyé 7 jours avant l''événement',
  'rappel',
  'Plus que 7 jours avant {{event_name}} !',
  '<h1 style="color: #1f2937; font-size: 24px; font-weight: bold; margin-bottom: 16px;">C''est bientôt le jour J !</h1>
<p style="color: #4b5563; margin: 12px 0;">Bonjour {{athlete_name}},</p>
<p style="color: #4b5563; margin: 12px 0;">Plus que <strong style="color: #2563eb;">7 jours</strong> avant <strong>{{event_name}}</strong> !</p>
<div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 16px 0;">
  <p style="margin: 4px 0;"><strong>Date :</strong> {{event_date}}</p>
  <p style="margin: 4px 0;"><strong>Épreuve :</strong> {{race_name}}</p>
  <p style="margin: 4px 0;"><strong>Dossard :</strong> {{bib_number}}</p>
</div>
<p style="color: #4b5563; margin: 12px 0;">Pensez à vérifier :</p>
<ul style="color: #4b5563; margin: 12px 0; padding-left: 20px;">
  <li>Votre équipement</li>
  <li>Votre certificat médical</li>
  <li>Votre ravitaillement</li>
</ul>
<p style="color: #4b5563; margin: 12px 0;">Bon courage pour vos derniers entraînements !</p>
<p style="color: #6b7280; margin: 16px 0 0 0; font-size: 14px;">L''équipe Timepulse</p>',
  '["athlete_name", "event_name", "event_date", "race_name", "bib_number", "race_info"]'::jsonb,
  true
),
(
  'bib_number_assigned',
  'Attribution du dossard',
  'Email envoyé quand un dossard est attribué',
  'confirmation',
  'Votre dossard pour {{event_name}}',
  '<h1 style="color: #1f2937; font-size: 24px; font-weight: bold; margin-bottom: 16px;">Votre dossard est prêt !</h1>
<p style="color: #4b5563; margin: 12px 0;">Bonjour {{athlete_name}},</p>
<p style="color: #4b5563; margin: 12px 0;">Votre numéro de dossard pour <strong>{{event_name}}</strong> vous a été attribué.</p>
<div style="background-color: #dbeafe; border: 3px solid #2563eb; padding: 24px; margin: 16px 0; text-align: center; border-radius: 8px;">
  <p style="margin: 4px 0; font-size: 14px; color: #1e40af;">Épreuve : {{race_name}}</p>
  <p style="margin: 16px 0; font-size: 48px; font-weight: bold; color: #2563eb;">{{bib_number}}</p>
  <p style="margin: 4px 0; font-size: 14px; color: #1e40af;">Votre numéro de dossard</p>
</div>
<p style="color: #4b5563; margin: 12px 0;">Retirez-le lors du retrait des dossards avec votre pièce d''identité.</p>
<p style="color: #6b7280; margin: 16px 0 0 0; font-size: 14px;">L''équipe Timepulse</p>',
  '["athlete_name", "event_name", "bib_number", "race_name"]'::jsonb,
  true
),
(
  'race_results_available',
  'Résultats disponibles',
  'Email envoyé quand les résultats sont en ligne',
  'confirmation',
  'Vos résultats sont disponibles - {{event_name}}',
  '<h1 style="color: #1f2937; font-size: 24px; font-weight: bold; margin-bottom: 16px;">Bravo pour votre course !</h1>
<p style="color: #4b5563; margin: 12px 0;">Bonjour {{athlete_name}},</p>
<p style="color: #4b5563; margin: 12px 0;">Vos résultats pour <strong>{{event_name}}</strong> sont maintenant en ligne.</p>
<div style="background-color: #dcfce7; border-left: 4px solid #10b981; padding: 16px; margin: 16px 0;">
  <p style="margin: 4px 0;"><strong>Épreuve :</strong> {{race_name}}</p>
  <p style="margin: 4px 0;"><strong>Temps :</strong> {{finish_time}}</p>
  <p style="margin: 4px 0;"><strong>Classement :</strong> {{rank}}</p>
</div>
<a href="{{results_link}}" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 500; margin: 16px 0;">
  Voir mes résultats complets
</a>
<p style="color: #4b5563; margin: 12px 0;">Félicitations pour votre performance !</p>
<p style="color: #6b7280; margin: 16px 0 0 0; font-size: 14px;">L''équipe Timepulse</p>',
  '["athlete_name", "event_name", "race_name", "finish_time", "rank", "results_link"]'::jsonb,
  true
)
ON CONFLICT (template_key) DO NOTHING;
