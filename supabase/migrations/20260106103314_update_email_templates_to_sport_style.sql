/*
  # Update Email Templates to Sport Style

  1. Changes
    - Replace all colored header blocks with sport image backgrounds
    - Apply orange gradient overlay on all templates
    - Remove ugly colored blocks (violet, green, pink, red, yellow)
    - Use elegant card design for information boxes

  2. Templates Updated
    - organizer_account_created (violet → sport image)
    - organizer_password_changed (orange → sport image)
    - organizer_account_deleted (red → sport image)
    - organizer_new_entry_notification (green → sport image)
*/

-- Update organizer_account_created template
UPDATE email_templates
SET html_body = '<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: ''Inter'', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; background: #f5f5f5; }
    .header { position: relative; height: 220px; background-image: url(''https://images.pexels.com/photos/2422462/pexels-photo-2422462.jpeg?auto=compress&cs=tinysrgb&w=1200''); background-size: cover; background-position: center; }
    .header-overlay { position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: linear-gradient(135deg, rgba(234, 88, 12, 0.85) 0%, rgba(249, 115, 22, 0.85) 100%); }
    .header-content { position: relative; z-index: 10; padding: 30px; text-align: center; height: 100%; display: flex; flex-direction: column; justify-content: center; }
    .header h1 { margin: 0; color: white; font-size: 28px; font-weight: 700; text-shadow: 0 2px 8px rgba(0, 0, 0, 0.2); }
    .content { background: #fff; padding: 35px; }
    .info-card { background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%); border: 2px solid #e5e7eb; border-radius: 10px; padding: 20px; margin: 20px 0; }
    .info-card h3 { margin: 0 0 15px 0; color: #1f2937; font-size: 16px; }
    .info-card p { margin: 8px 0; color: #374151; }
    .button { display: inline-block; background: #ea580c; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: 600; }
    .footer { text-align: center; color: #6b7280; padding: 25px; font-size: 13px; background: #f9fafb; border-top: 1px solid #e5e7eb; }
    ul { padding-left: 20px; color: #374151; }
    li { margin: 10px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="header-overlay"></div>
      <div class="header-content">
        <h1>🎉 Bienvenue sur Timepulse</h1>
      </div>
    </div>
    <div class="content">
      <p>Bonjour <strong>{{organizer_name}}</strong>,</p>

      <p>Votre compte organisateur a été créé avec succès sur la plateforme Timepulse !</p>

      <div class="info-card">
        <h3>Informations de votre compte</h3>
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
</html>'
WHERE template_key = 'organizer_account_created';

-- Update organizer_password_changed template
UPDATE email_templates
SET html_body = '<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: ''Inter'', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; background: #f5f5f5; }
    .header { position: relative; height: 220px; background-image: url(''https://images.pexels.com/photos/1566837/pexels-photo-1566837.jpeg?auto=compress&cs=tinysrgb&w=1200''); background-size: cover; background-position: center; }
    .header-overlay { position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: linear-gradient(135deg, rgba(234, 88, 12, 0.85) 0%, rgba(249, 115, 22, 0.85) 100%); }
    .header-content { position: relative; z-index: 10; padding: 30px; text-align: center; height: 100%; display: flex; flex-direction: column; justify-content: center; }
    .header h1 { margin: 0; color: white; font-size: 28px; font-weight: 700; text-shadow: 0 2px 8px rgba(0, 0, 0, 0.2); }
    .content { background: #fff; padding: 35px; }
    .warning-box { background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b; }
    .warning-box h3 { margin: 0 0 10px 0; color: #d97706; font-size: 16px; }
    .warning-box p { margin: 8px 0; color: #92400e; }
    .warning-box ul { color: #92400e; }
    .button { display: inline-block; background: #ea580c; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: 600; }
    .footer { text-align: center; color: #6b7280; padding: 25px; font-size: 13px; background: #f9fafb; border-top: 1px solid #e5e7eb; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="header-overlay"></div>
      <div class="header-content">
        <h1>🔐 Mot de passe modifié</h1>
      </div>
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
</html>'
WHERE template_key = 'organizer_password_changed';

-- Update organizer_account_deleted template
UPDATE email_templates
SET html_body = '<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: ''Inter'', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; background: #f5f5f5; }
    .header { position: relative; height: 220px; background-image: url(''https://images.pexels.com/photos/235922/pexels-photo-235922.jpeg?auto=compress&cs=tinysrgb&w=1200''); background-size: cover; background-position: center; }
    .header-overlay { position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: linear-gradient(135deg, rgba(234, 88, 12, 0.85) 0%, rgba(249, 115, 22, 0.85) 100%); }
    .header-content { position: relative; z-index: 10; padding: 30px; text-align: center; height: 100%; display: flex; flex-direction: column; justify-content: center; }
    .header h1 { margin: 0; color: white; font-size: 28px; font-weight: 700; text-shadow: 0 2px 8px rgba(0, 0, 0, 0.2); }
    .content { background: #fff; padding: 35px; }
    .info-card { background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%); border: 2px solid #e5e7eb; border-radius: 10px; padding: 20px; margin: 20px 0; }
    .info-card h3 { margin: 0 0 15px 0; color: #1f2937; font-size: 16px; }
    .info-card p { margin: 8px 0; color: #374151; }
    .footer { text-align: center; color: #6b7280; padding: 25px; font-size: 13px; background: #f9fafb; border-top: 1px solid #e5e7eb; }
    ul { padding-left: 20px; color: #374151; }
    li { margin: 10px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="header-overlay"></div>
      <div class="header-content">
        <h1>👋 Compte supprimé</h1>
      </div>
    </div>
    <div class="content">
      <p>Bonjour <strong>{{organizer_name}}</strong>,</p>

      <p>Votre compte organisateur Timepulse a été supprimé conformément à votre demande le <strong>{{deleted_at}}</strong>.</p>

      <div class="info-card">
        <h3>Données supprimées</h3>
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
</html>'
WHERE template_key = 'organizer_account_deleted';

-- Update organizer_new_entry_notification template
UPDATE email_templates
SET html_body = '<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: ''Inter'', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; background: #f5f5f5; }
    .header { position: relative; height: 220px; background-image: url(''https://images.pexels.com/photos/57574/pexels-photo-57574.jpeg?auto=compress&cs=tinysrgb&w=1200''); background-size: cover; background-position: center; }
    .header-overlay { position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: linear-gradient(135deg, rgba(234, 88, 12, 0.85) 0%, rgba(249, 115, 22, 0.85) 100%); }
    .header-content { position: relative; z-index: 10; padding: 30px; text-align: center; height: 100%; display: flex; flex-direction: column; justify-content: center; }
    .header h1 { margin: 0; color: white; font-size: 28px; font-weight: 700; text-shadow: 0 2px 8px rgba(0, 0, 0, 0.2); }
    .content { background: #fff; padding: 35px; }
    .info-card { background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%); border: 2px solid #e5e7eb; border-radius: 10px; padding: 20px; margin: 20px 0; }
    .info-card h3 { margin: 0 0 15px 0; color: #1f2937; font-size: 16px; }
    .info-card p { margin: 8px 0; color: #374151; }
    .stats-box { background: #f0fdf4; border: 2px solid #86efac; border-radius: 10px; padding: 20px; margin: 20px 0; }
    .stats-box h3 { margin: 0 0 15px 0; color: #166534; font-size: 16px; }
    .stats-box p { margin: 8px 0; color: #166534; }
    .button { display: inline-block; background: #ea580c; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: 600; }
    .footer { text-align: center; color: #6b7280; padding: 25px; font-size: 13px; background: #f9fafb; border-top: 1px solid #e5e7eb; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="header-overlay"></div>
      <div class="header-content">
        <h1>🎉 Nouvelle inscription</h1>
      </div>
    </div>
    <div class="content">
      <p>Bonjour <strong>{{organizer_name}}</strong>,</p>

      <p>Une nouvelle inscription vient d''être enregistrée pour votre événement <strong>{{event_name}}</strong> !</p>

      <div class="info-card">
        <h3>Détails du participant</h3>
        <p><strong>Nom :</strong> {{athlete_first_name}} {{athlete_last_name}}</p>
        <p><strong>Email :</strong> {{athlete_email}}</p>
        <p><strong>Course :</strong> {{race_name}}</p>
        <p><strong>Catégorie :</strong> {{category}}</p>
        <p><strong>N° de dossard :</strong> {{bib_number}}</p>
        <p><strong>Montant payé :</strong> {{amount}} €</p>
        <p><strong>Date d''inscription :</strong> {{registration_date}}</p>
      </div>

      <div class="stats-box">
        <h3>📊 État des inscriptions</h3>
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
</html>'
WHERE template_key = 'organizer_new_entry_notification';