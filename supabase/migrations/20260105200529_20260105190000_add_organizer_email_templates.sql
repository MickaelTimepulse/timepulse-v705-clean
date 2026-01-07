/*
  # Add Organizer Email Templates

  1. Changes
    - Add email notification preferences to organizers table
    - Add new email templates for organizers:
      * Account creation confirmation
      * Password change confirmation
      * Account deletion confirmation
      * Entry registration notification (optional per organizer)

  2. Security
    - Maintain existing RLS policies
    - Email templates follow system template standards
*/

-- Add email notification preferences to organizers table
ALTER TABLE organizers
  ADD COLUMN IF NOT EXISTS receive_entry_notifications boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS notification_email text;

-- Add comment to clarify the new fields
COMMENT ON COLUMN organizers.receive_entry_notifications IS 'Si true, l''organisateur reçoit un email à chaque nouvelle inscription';
COMMENT ON COLUMN organizers.notification_email IS 'Email de notification (si différent de l''email principal)';

-- Insert new email templates for organizers
INSERT INTO email_templates (template_key, name, description, category, recipient_type, trigger_event, subject, html_body, text_body, available_variables, is_active) VALUES
(
  'organizer_account_created',
  'Création de compte organisateur',
  'Email de confirmation envoyé lors de la création d''un compte organisateur',
  'confirmation',
  'organizers',
  'organizer_registered',
  'Bienvenue sur Timepulse - Votre compte organisateur',
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
    ul { padding-left: 20px; }
    li { margin: 10px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Bienvenue sur Timepulse</h1>
    </div>
    <div class="content">
      <p>Bonjour <strong>{{organizer_name}}</strong>,</p>

      <p>Votre compte organisateur a été créé avec succès sur la plateforme Timepulse !</p>

      <div class="info-box">
        <h3>Informations de votre compte :</h3>
        <p><strong>Organisation :</strong> {{company_name}}</p>
        <p><strong>Email :</strong> {{email}}</p>
        <p><strong>Date de création :</strong> {{created_at}}</p>
      </div>

      <p>Vous pouvez maintenant profiter de toutes les fonctionnalités de notre plateforme :</p>

      <ul>
        <li>Créer et gérer vos événements sportifs</li>
        <li>Gérer les inscriptions en ligne</li>
        <li>Suivre les paiements et commissions</li>
        <li>Consulter les statistiques en temps réel</li>
        <li>Communiquer avec vos participants</li>
        <li>Exporter les données et listes de départ</li>
      </ul>

      <div style="text-align: center;">
        <a href="{{dashboard_url}}" class="button">Accéder à mon tableau de bord</a>
      </div>

      <p><strong>Besoin d''aide ?</strong> Notre équipe est à votre disposition pour vous accompagner dans la prise en main de la plateforme.</p>

      <p>Sportivement,<br><strong>L''équipe Timepulse</strong></p>
    </div>
    <div class="footer">
      <p>© 2025 Timepulse - Plateforme de gestion d''événements sportifs</p>
    </div>
  </div>
</body>
</html>',
  'Bonjour {{organizer_name}},

Votre compte organisateur a été créé avec succès sur la plateforme Timepulse !

Informations de votre compte :
- Organisation : {{company_name}}
- Email : {{email}}
- Date de création : {{created_at}}

Vous pouvez maintenant accéder à votre tableau de bord : {{dashboard_url}}

Sportivement,
L''équipe Timepulse',
  '["organizer_name", "company_name", "email", "created_at", "dashboard_url"]'::jsonb,
  true
),
(
  'organizer_password_changed',
  'Changement de mot de passe organisateur',
  'Email de confirmation envoyé après un changement de mot de passe',
  'confirmation',
  'organizers',
  'password_changed',
  'Votre mot de passe a été modifié',
  '<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #fff; padding: 30px; border: 1px solid #e5e7eb; }
    .warning-box { background: #fffbeb; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b; }
    .button { display: inline-block; background: #f59e0b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { text-align: center; color: #6b7280; padding: 20px; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔐 Mot de passe modifié</h1>
    </div>
    <div class="content">
      <p>Bonjour <strong>{{organizer_name}}</strong>,</p>

      <p>Votre mot de passe a été modifié avec succès le <strong>{{changed_at}}</strong>.</p>

      <div class="warning-box">
        <h3>⚠️ Vous n''êtes pas à l''origine de ce changement ?</h3>
        <p>Si vous n''avez pas demandé cette modification, votre compte a peut-être été compromis.</p>
        <p><strong>Action immédiate requise :</strong></p>
        <ul>
          <li>Changez immédiatement votre mot de passe</li>
          <li>Contactez notre équipe support</li>
          <li>Vérifiez les activités récentes sur votre compte</li>
        </ul>
      </div>

      <p>Si vous êtes à l''origine de ce changement, vous n''avez rien à faire. Votre compte reste pleinement accessible avec votre nouveau mot de passe.</p>

      <div style="text-align: center;">
        <a href="{{login_url}}" class="button">Se connecter</a>
      </div>

      <p><strong>Informations de connexion :</strong></p>
      <p>Email : {{email}}<br>
      Adresse IP : {{ip_address}}<br>
      Navigateur : {{user_agent}}</p>

      <p>Cordialement,<br><strong>L''équipe Timepulse</strong></p>
    </div>
    <div class="footer">
      <p>© 2025 Timepulse - Sécurité des comptes</p>
    </div>
  </div>
</body>
</html>',
  'Bonjour {{organizer_name}},

Votre mot de passe a été modifié avec succès le {{changed_at}}.

Si vous n''êtes pas à l''origine de ce changement, contactez immédiatement notre équipe support.

Informations de connexion :
- Email : {{email}}
- Adresse IP : {{ip_address}}

Cordialement,
L''équipe Timepulse',
  '["organizer_name", "email", "changed_at", "login_url", "ip_address", "user_agent"]'::jsonb,
  true
),
(
  'organizer_account_deleted',
  'Suppression de compte organisateur',
  'Email de confirmation envoyé lors de la suppression d''un compte organisateur',
  'confirmation',
  'organizers',
  'account_deleted',
  'Confirmation de suppression de votre compte Timepulse',
  '<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #fff; padding: 30px; border: 1px solid #e5e7eb; }
    .info-box { background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444; }
    .footer { text-align: center; color: #6b7280; padding: 20px; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>👋 Compte supprimé</h1>
    </div>
    <div class="content">
      <p>Bonjour <strong>{{organizer_name}}</strong>,</p>

      <p>Votre compte organisateur Timepulse a été supprimé conformément à votre demande le <strong>{{deleted_at}}</strong>.</p>

      <div class="info-box">
        <h3>Données supprimées :</h3>
        <p><strong>Organisation :</strong> {{company_name}}</p>
        <p><strong>Email :</strong> {{email}}</p>
        <p><strong>Nombre d''événements :</strong> {{events_count}}</p>
        <p><strong>Nombre d''inscriptions gérées :</strong> {{entries_count}}</p>
      </div>

      <p><strong>Qu''est-ce qui a été supprimé ?</strong></p>
      <ul>
        <li>Vos informations de compte et de connexion</li>
        <li>Vos préférences et paramètres</li>
        <li>Votre accès à la plateforme organisateur</li>
      </ul>

      <p><strong>Qu''est-ce qui a été conservé ?</strong></p>
      <ul>
        <li>Les événements passés (pour l''historique des participants)</li>
        <li>Les résultats et classements publiés</li>
        <li>Les transactions financières (obligations légales)</li>
      </ul>

      <p>Si vous souhaitez revenir sur Timepulse dans le futur, vous devrez créer un nouveau compte.</p>

      <p><strong>Cette suppression n''était pas voulue ?</strong> Contactez-nous dans les 30 jours pour une éventuelle restauration.</p>

      <p>Nous vous remercions pour votre confiance et espérons vous revoir bientôt.</p>

      <p>Sportivement,<br><strong>L''équipe Timepulse</strong></p>
    </div>
    <div class="footer">
      <p>© 2025 Timepulse - Gestion des comptes</p>
    </div>
  </div>
</body>
</html>',
  'Bonjour {{organizer_name}},

Votre compte organisateur Timepulse a été supprimé le {{deleted_at}}.

Organisation : {{company_name}}
Email : {{email}}
Événements : {{events_count}}
Inscriptions gérées : {{entries_count}}

Si cette suppression n''était pas voulue, contactez-nous dans les 30 jours.

Merci pour votre confiance,
L''équipe Timepulse',
  '["organizer_name", "company_name", "email", "deleted_at", "events_count", "entries_count"]'::jsonb,
  true
),
(
  'organizer_new_entry_notification',
  'Notification organisateur - Nouvelle inscription',
  'Email envoyé à l''organisateur lors d''une nouvelle inscription (si activé)',
  'inscription',
  'organizers',
  'new_entry_registered',
  'Nouvelle inscription - {{event_name}}',
  '<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #fff; padding: 30px; border: 1px solid #e5e7eb; }
    .info-box { background: #ecfdf5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981; }
    .stats-box { background: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0; }
    .button { display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { text-align: center; color: #6b7280; padding: 20px; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Nouvelle inscription</h1>
    </div>
    <div class="content">
      <p>Bonjour <strong>{{organizer_name}}</strong>,</p>

      <p>Une nouvelle inscription vient d''être enregistrée pour votre événement <strong>{{event_name}}</strong> !</p>

      <div class="info-box">
        <h3>Détails du participant :</h3>
        <p><strong>Nom :</strong> {{athlete_first_name}} {{athlete_last_name}}</p>
        <p><strong>Email :</strong> {{athlete_email}}</p>
        <p><strong>Course :</strong> {{race_name}}</p>
        <p><strong>Catégorie :</strong> {{category}}</p>
        <p><strong>N° de dossard :</strong> {{bib_number}}</p>
        <p><strong>Montant payé :</strong> {{amount}} €</p>
        <p><strong>Date d''inscription :</strong> {{registration_date}}</p>
      </div>

      <div class="stats-box">
        <h3>📊 État des inscriptions :</h3>
        <p><strong>Total inscriptions :</strong> {{total_entries}} / {{max_entries}}</p>
        <p><strong>Places restantes :</strong> {{remaining_places}}</p>
        <p><strong>Taux de remplissage :</strong> {{fill_rate}}%</p>
      </div>

      <div style="text-align: center;">
        <a href="{{entries_url}}" class="button">Voir toutes les inscriptions</a>
      </div>

      <p><small>💡 <strong>Astuce :</strong> Vous pouvez désactiver ces notifications dans les paramètres de votre compte.</small></p>

      <p>Cordialement,<br><strong>L''équipe Timepulse</strong></p>
    </div>
    <div class="footer">
      <p>© 2025 Timepulse - Notifications d''inscription</p>
    </div>
  </div>
</body>
</html>',
  'Bonjour {{organizer_name}},

Nouvelle inscription pour {{event_name}} !

Participant :
- Nom : {{athlete_first_name}} {{athlete_last_name}}
- Course : {{race_name}}
- Catégorie : {{category}}
- Dossard : {{bib_number}}
- Montant : {{amount}} €

État des inscriptions :
- Total : {{total_entries}} / {{max_entries}}
- Places restantes : {{remaining_places}}

Voir les inscriptions : {{entries_url}}

L''équipe Timepulse',
  '["organizer_name", "event_name", "athlete_first_name", "athlete_last_name", "athlete_email", "race_name", "category", "bib_number", "amount", "registration_date", "license_number", "club", "total_entries", "max_entries", "remaining_places", "fill_rate", "entries_url"]'::jsonb,
  true
)
ON CONFLICT (template_key) DO NOTHING;

-- Create index for faster queries on notification preferences
CREATE INDEX IF NOT EXISTS idx_organizers_receive_notifications
  ON organizers(receive_entry_notifications)
  WHERE receive_entry_notifications = true;