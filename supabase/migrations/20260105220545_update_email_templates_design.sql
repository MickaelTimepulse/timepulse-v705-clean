/*
  # Mise à jour du design des templates email

  1. Changements
    - Mise à jour de tous les templates email avec le nouveau design professionnel
    - Utilisation de la police Inter pour les titres
    - Images de fond variées depuis Pexels
    - Design cohérent avec le site web
    - Gradients modernes et boutons CTA stylisés

  2. Détails
    - Header avec image de fond et overlay sombre
    - Typographie soignée avec espacement des lettres
    - Boutons CTA avec bordure orange
    - Cartes avec gradients subtils
    - Design responsive pour mobile
*/

-- Template de confirmation d'inscription / Dossard confirmé
UPDATE email_templates
SET html_body = '<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    @import url(''https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap'');
    body { margin: 0; padding: 0; font-family: ''Inter'', ''SF Pro Display'', -apple-system, sans-serif; -webkit-font-smoothing: antialiased; background-color: #f5f5f5; }
    .email-wrapper { width: 100%; background-color: #f5f5f5; padding: 20px 0; }
    .email-container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08); }
    .email-header { position: relative; height: 280px; background-image: url(''https://images.pexels.com/photos/2402777/pexels-photo-2402777.jpeg?auto=compress&cs=tinysrgb&w=1920''); background-size: cover; background-position: center; }
    .header-overlay { position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: linear-gradient(135deg, rgba(15, 23, 42, 0.85) 0%, rgba(15, 23, 42, 0.75) 50%, rgba(15, 23, 42, 0.85) 100%); }
    .header-content { position: relative; z-index: 10; padding: 40px 30px; text-align: center; }
    .email-title { margin: 0; color: #ffffff; font-size: 36px; font-weight: 800; letter-spacing: 0.02em; line-height: 1.2; font-family: ''Inter'', sans-serif; text-shadow: 0 2px 12px rgba(0, 0, 0, 0.3); }
    .email-body { padding: 40px 35px; color: #1f2937; line-height: 1.7; font-size: 16px; }
    .cta-button { display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); color: #ffffff !important; text-decoration: none; border-radius: 12px; font-weight: 700; margin: 20px 0; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.3); border: 2px solid #fb923c; }
    .email-footer { background-color: #f9fafb; padding: 30px 35px; border-top: 1px solid #e5e7eb; text-align: center; }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="email-container">
      <div class="email-header">
        <div class="header-overlay"></div>
        <div class="header-content">
          <h1 class="email-title">Dossard confirmé</h1>
        </div>
      </div>
      <div class="email-body">
        <p style="font-size: 18px; margin: 0 0 25px 0;">Bonjour <strong>{{buyer_name}}</strong>,</p>
        <p>Félicitations ! Vous avez bien repris le dossard pour <strong>{{event_name}}</strong>.</p>

        <div style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border: 2px solid #10b981; border-radius: 12px; padding: 30px; margin: 30px 0; text-align: center;">
          <div style="font-size: 64px; margin: 0 0 20px 0;">✅</div>
          <h2 style="margin: 0 0 15px 0; color: #0f172a; font-size: 24px; font-weight: 800;">{{event_name}}</h2>
          <p style="margin: 0 0 20px 0; color: #065f46; font-size: 18px; font-weight: 600;">{{race_name}}</p>

          <div style="margin-top: 25px; padding-top: 25px; border-top: 2px dashed #10b981;">
            <p style="margin: 0 0 10px 0; color: #065f46; font-size: 14px; font-weight: 600; text-transform: uppercase;">Dossard</p>
            <p style="margin: 0; color: #0f172a; font-size: 36px; font-weight: 800;">#{{bib_number}}</p>
          </div>
        </div>

        <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 20px; margin: 30px 0; border-radius: 12px;">
          <table style="width: 100%;">
            <tr><td style="padding: 8px 0; color: #6b7280;">Montant payé</td><td style="text-align: right; color: #10b981; font-weight: 700;">{{price}} €</td></tr>
            <tr><td style="padding: 8px 0; color: #6b7280;">Date événement</td><td style="text-align: right; color: #0f172a; font-weight: 600;">{{event_date}}</td></tr>
            <tr><td style="padding: 8px 0; color: #6b7280;">Code de gestion</td><td style="text-align: right; color: #0f172a; font-weight: 600; font-family: monospace;">{{management_code}}</td></tr>
          </table>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="{{event_url}}" class="cta-button">Voir les détails</a>
        </div>

        <p>Bon entraînement et à bientôt sur la ligne de départ !</p>
        <p style="margin: 25px 0 0 0;">Sportivement,<br><strong>L''équipe Timepulse</strong></p>
      </div>
      <div class="email-footer">
        <p style="margin: 0; color: #1f2937; font-weight: 600;">Timepulse - Votre partenaire chronométrage</p>
        <p style="margin: 10px 0 0 0; color: #9ca3af; font-size: 12px;">© 2025 Timepulse - Tous droits réservés</p>
      </div>
    </div>
  </div>
</body>
</html>'
WHERE template_key = 'bib_exchange_buyer_confirmation';

-- Template de mise en vente de dossard
UPDATE email_templates
SET html_body = '<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    @import url(''https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap'');
    body { margin: 0; padding: 0; font-family: ''Inter'', sans-serif; background-color: #f5f5f5; }
    .email-wrapper { width: 100%; padding: 20px 0; }
    .email-container { max-width: 600px; margin: 0 auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08); }
    .email-header { position: relative; height: 280px; background-image: url(''https://images.pexels.com/photos/618612/pexels-photo-618612.jpeg?auto=compress&cs=tinysrgb&w=1920''); background-size: cover; background-position: center; }
    .header-overlay { position: absolute; inset: 0; background: linear-gradient(135deg, rgba(15, 23, 42, 0.85), rgba(15, 23, 42, 0.75)); }
    .header-content { position: relative; z-index: 10; padding: 40px 30px; text-align: center; }
    .email-title { margin: 0; color: #fff; font-size: 36px; font-weight: 800; letter-spacing: 0.02em; text-shadow: 0 2px 12px rgba(0, 0, 0, 0.3); }
    .email-body { padding: 40px 35px; }
    .cta-button { display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #0f172a, #1e293b); color: #fff !important; text-decoration: none; border-radius: 12px; font-weight: 700; border: 2px solid #fb923c; }
    .email-footer { background: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb; }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="email-container">
      <div class="email-header">
        <div class="header-overlay"></div>
        <div class="header-content">
          <h1 class="email-title">Dossard en vente</h1>
        </div>
      </div>
      <div class="email-body">
        <p style="font-size: 18px; margin: 0 0 25px 0;">Bonjour <strong>{{athlete_name}}</strong>,</p>
        <p>Votre dossard pour <strong>{{event_name}}</strong> a bien été mis en vente sur la bourse d''échange.</p>

        <div style="background: linear-gradient(135deg, #fffbeb, #fef3c7); border: 2px solid #f59e0b; border-radius: 12px; padding: 25px; margin: 30px 0;">
          <h3 style="margin: 0 0 20px 0; color: #d97706; font-weight: 700;">📋 Détails de votre annonce</h3>
          <table style="width: 100%;">
            <tr><td style="padding: 8px 0; color: #92400e;">Dossard</td><td style="text-align: right; font-weight: 700;">#{{bib_number}}</td></tr>
            <tr><td style="padding: 8px 0; color: #92400e;">Course</td><td style="text-align: right; font-weight: 600;">{{race_name}}</td></tr>
            <tr><td style="padding: 8px 0; color: #92400e;">Prix</td><td style="text-align: right; font-weight: 700; color: #f59e0b;">{{price}} €</td></tr>
            <tr><td style="padding: 8px 0; color: #92400e;">Code</td><td style="text-align: right; font-family: monospace; font-weight: 600;">{{management_code}}</td></tr>
          </table>
        </div>

        <p>Vous recevrez un email dès qu''un coureur reprendra votre dossard.</p>

        <div style="text-align: center; margin: 30px 0;">
          <a href="{{bib_exchange_url}}" class="cta-button">Gérer mon annonce</a>
        </div>

        <p>Sportivement,<br><strong>L''équipe Timepulse</strong></p>
      </div>
      <div class="email-footer">
        <p style="margin: 0; color: #1f2937; font-weight: 600;">Timepulse - Bourse d''échange</p>
        <p style="margin: 10px 0 0 0; color: #9ca3af; font-size: 12px;">© 2025 Timepulse</p>
      </div>
    </div>
  </div>
</body>
</html>'
WHERE template_key = 'bib_exchange_seller_listing';

-- Template de dossard vendu  
UPDATE email_templates
SET html_body = '<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    @import url(''https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap'');
    body { margin: 0; padding: 0; font-family: ''Inter'', sans-serif; background-color: #f5f5f5; }
    .email-wrapper { width: 100%; padding: 20px 0; }
    .email-container { max-width: 600px; margin: 0 auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08); }
    .email-header { position: relative; height: 280px; background-image: url(''https://images.pexels.com/photos/3764011/pexels-photo-3764011.jpeg?auto=compress&cs=tinysrgb&w=1920''); background-size: cover; background-position: center; }
    .header-overlay { position: absolute; inset: 0; background: linear-gradient(135deg, rgba(15, 23, 42, 0.85), rgba(15, 23, 42, 0.75)); }
    .header-content { position: relative; z-index: 10; padding: 40px 30px; text-align: center; }
    .email-title { margin: 0; color: #fff; font-size: 36px; font-weight: 800; letter-spacing: 0.02em; text-shadow: 0 2px 12px rgba(0, 0, 0, 0.3); }
    .email-body { padding: 40px 35px; }
    .email-footer { background: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb; }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="email-container">
      <div class="email-header">
        <div class="header-overlay"></div>
        <div class="header-content">
          <h1 class="email-title">Dossard vendu</h1>
        </div>
      </div>
      <div class="email-body">
        <p style="font-size: 18px;">Bonjour <strong>{{seller_name}}</strong>,</p>
        <div style="text-align: center; margin: 30px 0;"><div style="font-size: 64px;">🎉</div></div>
        <p>Bonne nouvelle ! Votre dossard pour <strong>{{event_name}}</strong> a été vendu.</p>

        <div style="background: linear-gradient(135deg, #f0fdf4, #dcfce7); border: 2px solid #10b981; border-radius: 12px; padding: 25px; margin: 30px 0;">
          <h3 style="margin: 0 0 20px 0; color: #065f46; font-weight: 700;">💰 Détails de la vente</h3>
          <table style="width: 100%;">
            <tr><td style="padding: 8px 0; color: #065f46;">Course</td><td style="text-align: right; font-weight: 600;">{{race_name}}</td></tr>
            <tr><td style="padding: 8px 0; color: #065f46;">Dossard</td><td style="text-align: right; font-weight: 700;">#{{bib_number}}</td></tr>
            <tr><td style="padding: 8px 0; color: #065f46;">Prix</td><td style="text-align: right; font-weight: 700; color: #10b981; font-size: 20px;">{{price}} €</td></tr>
            <tr><td style="padding: 8px 0; color: #065f46;">Date</td><td style="text-align: right;">{{sale_date}}</td></tr>
          </table>
        </div>

        <p>Le remboursement sera effectué selon les modalités de l''organisateur. Vous recevrez une confirmation dans les prochains jours.</p>
        <p style="margin: 25px 0 0 0;">Merci d''avoir utilisé Timepulse !<br><strong>L''équipe Timepulse</strong></p>
      </div>
      <div class="email-footer">
        <p style="margin: 0; color: #1f2937; font-weight: 600;">Timepulse</p>
        <p style="margin: 10px 0 0 0; color: #9ca3af; font-size: 12px;">© 2025 Timepulse</p>
      </div>
    </div>
  </div>
</body>
</html>'
WHERE template_key = 'bib_exchange_seller_sold';

-- Template de confirmation de remboursement
UPDATE email_templates
SET html_body = '<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    @import url(''https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap'');
    body { margin: 0; padding: 0; font-family: ''Inter'', sans-serif; background-color: #f5f5f5; }
    .email-wrapper { width: 100%; padding: 20px 0; }
    .email-container { max-width: 600px; margin: 0 auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08); }
    .email-header { position: relative; height: 280px; background-image: url(''https://images.pexels.com/photos/2803158/pexels-photo-2803158.jpeg?auto=compress&cs=tinysrgb&w=1920''); background-size: cover; background-position: center; }
    .header-overlay { position: absolute; inset: 0; background: linear-gradient(135deg, rgba(15, 23, 42, 0.85), rgba(15, 23, 42, 0.75)); }
    .header-content { position: relative; z-index: 10; padding: 40px 30px; text-align: center; }
    .email-title { margin: 0; color: #fff; font-size: 36px; font-weight: 800; letter-spacing: 0.02em; text-shadow: 0 2px 12px rgba(0, 0, 0, 0.3); }
    .email-body { padding: 40px 35px; }
    .email-footer { background: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb; }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="email-container">
      <div class="email-header">
        <div class="header-overlay"></div>
        <div class="header-content">
          <h1 class="email-title">Remboursement effectué</h1>
        </div>
      </div>
      <div class="email-body">
        <p style="font-size: 18px;">Bonjour <strong>{{athlete_name}}</strong>,</p>
        <p>Votre remboursement pour l''inscription à <strong>{{event_name}}</strong> a été traité.</p>

        <div style="background: linear-gradient(135deg, #eff6ff, #dbeafe); border: 2px solid #3b82f6; border-radius: 12px; padding: 25px; margin: 30px 0; text-align: center;">
          <div style="font-size: 48px; margin-bottom: 20px;">💰</div>
          <h2 style="margin: 0; color: #1e40af; font-size: 32px; font-weight: 800;">{{refund_amount}} €</h2>
          <p style="margin: 20px 0 0 0; color: #1e40af; font-weight: 600;">Remboursement confirmé</p>
        </div>

        <div style="background: #f9fafb; border-radius: 12px; padding: 20px; margin: 25px 0;">
          <table style="width: 100%;">
            <tr><td style="padding: 8px 0; color: #6b7280;">Date</td><td style="text-align: right; font-weight: 600;">{{refund_date}}</td></tr>
            <tr><td style="padding: 8px 0; color: #6b7280;">Méthode</td><td style="text-align: right; font-weight: 600;">{{payment_method}}</td></tr>
            <tr><td style="padding: 8px 0; color: #6b7280;">Transaction</td><td style="text-align: right; font-family: monospace;">{{transaction_id}}</td></tr>
          </table>
        </div>

        <p style="color: #6b7280; font-size: 14px;">Le montant apparaîtra sur votre compte dans 5-10 jours ouvrés.</p>
        <p style="margin: 25px 0 0 0;">Cordialement,<br><strong>L''équipe Timepulse</strong></p>
      </div>
      <div class="email-footer">
        <p style="margin: 0; color: #1f2937; font-weight: 600;">Timepulse</p>
        <p style="margin: 10px 0 0 0; color: #9ca3af; font-size: 12px;">© 2025 Timepulse</p>
      </div>
    </div>
  </div>
</body>
</html>'
WHERE template_key = 'refund_confirmation';

-- Template de notification organisateur
UPDATE email_templates
SET html_body = '<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    @import url(''https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap'');
    body { margin: 0; padding: 0; font-family: ''Inter'', sans-serif; background-color: #f5f5f5; }
    .email-wrapper { width: 100%; padding: 20px 0; }
    .email-container { max-width: 600px; margin: 0 auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08); }
    .email-header { position: relative; height: 280px; background-image: url(''https://images.pexels.com/photos/163403/runner-athlete-fitness-jogger-163403.jpeg?auto=compress&cs=tinysrgb&w=1920''); background-size: cover; background-position: center; }
    .header-overlay { position: absolute; inset: 0; background: linear-gradient(135deg, rgba(15, 23, 42, 0.85), rgba(15, 23, 42, 0.75)); }
    .header-content { position: relative; z-index: 10; padding: 40px 30px; text-align: center; }
    .email-title { margin: 0; color: #fff; font-size: 36px; font-weight: 800; letter-spacing: 0.02em; text-shadow: 0 2px 12px rgba(0, 0, 0, 0.3); }
    .email-body { padding: 40px 35px; }
    .cta-button { display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #0f172a, #1e293b); color: #fff !important; text-decoration: none; border-radius: 12px; font-weight: 700; border: 2px solid #fb923c; }
    .email-footer { background: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb; }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="email-container">
      <div class="email-header">
        <div class="header-overlay"></div>
        <div class="header-content">
          <h1 class="email-title">Échange de dossard</h1>
        </div>
      </div>
      <div class="email-body">
        <p style="font-size: 18px;">Bonjour <strong>{{organizer_name}}</strong>,</p>
        <p>Un échange de dossard vient d''être effectué pour <strong>{{event_name}}</strong>.</p>

        <div style="background: linear-gradient(135deg, #eef2ff, #e0e7ff); border: 2px solid #6366f1; border-radius: 12px; padding: 25px; margin: 30px 0;">
          <h3 style="margin: 0 0 20px 0; color: #4338ca; font-weight: 700;">📋 Détails de l''échange</h3>
          <table style="width: 100%;">
            <tr><td style="padding: 8px 0; color: #4338ca;">Vendeur</td><td style="text-align: right; font-weight: 600;">{{seller_name}}</td></tr>
            <tr><td style="padding: 8px 0; color: #4338ca;">Acheteur</td><td style="text-align: right; font-weight: 600;">{{buyer_name}}</td></tr>
            <tr><td style="padding: 8px 0; color: #4338ca;">Course</td><td style="text-align: right; font-weight: 600;">{{race_name}}</td></tr>
            <tr><td style="padding: 8px 0; color: #4338ca;">Dossard</td><td style="text-align: right; font-weight: 700;">#{{bib_number}}</td></tr>
            <tr><td style="padding: 8px 0; color: #4338ca;">Montant</td><td style="text-align: right; font-weight: 700;">{{price}} €</td></tr>
            <tr><td style="padding: 8px 0; color: #4338ca;">Date</td><td style="text-align: right;">{{exchange_date}}</td></tr>
          </table>
        </div>

        <p>La liste des inscrits a été mise à jour automatiquement.</p>

        <div style="text-align: center; margin: 30px 0;">
          <a href="{{entries_url}}" class="cta-button">Voir les inscriptions</a>
        </div>

        <p style="margin: 25px 0 0 0;">Cordialement,<br><strong>L''équipe Timepulse</strong></p>
      </div>
      <div class="email-footer">
        <p style="margin: 0; color: #1f2937; font-weight: 600;">Timepulse</p>
        <p style="margin: 10px 0 0 0; color: #9ca3af; font-size: 12px;">© 2025 Timepulse</p>
      </div>
    </div>
  </div>
</body>
</html>'
WHERE template_key = 'organizer_bib_exchange_notification';
