/*
  # Update All Remaining Email Templates to Sport Style

  1. Changes
    - Update all remaining email templates with sport images
    - Replace all colored blocks (green, blue, pink, red, yellow) with elegant cards
    - Apply consistent orange gradient overlay on all headers
    
  2. Templates Updated (11 templates)
    - event_reminder_7days
    - payment_confirmation  
    - admin_welcome
    - admin_credentials_reminder
    - race_results_available
    - bib_exchange_seller_listing
    - bib_exchange_seller_sold
    - bib_exchange_buyer_confirmation
    - registration_confirmation
    - bib_number_assigned
    - refund_confirmation
*/

-- 1. Update event_reminder_7days template (Rappel J-7)
UPDATE email_templates
SET html_body = '<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: ''Inter'', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; background: #f5f5f5; }
    .header { position: relative; height: 220px; background-image: url(''https://images.pexels.com/photos/2803158/pexels-photo-2803158.jpeg?auto=compress&cs=tinysrgb&w=1200''); background-size: cover; background-position: center; }
    .header-overlay { position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: linear-gradient(135deg, rgba(234, 88, 12, 0.85) 0%, rgba(249, 115, 22, 0.85) 100%); }
    .header-content { position: relative; z-index: 10; padding: 30px; text-align: center; height: 100%; display: flex; flex-direction: column; justify-content: center; }
    .header h1 { margin: 0; color: white; font-size: 28px; font-weight: 700; text-shadow: 0 2px 8px rgba(0, 0, 0, 0.2); }
    .content { background: #fff; padding: 35px; }
    .info-card { background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%); border: 2px solid #e5e7eb; border-radius: 10px; padding: 20px; margin: 20px 0; }
    .info-card h3 { margin: 0 0 15px 0; color: #1f2937; font-size: 16px; }
    .info-card p { margin: 8px 0; color: #374151; }
    .button { display: inline-block; background: #ea580c; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: 600; }
    .footer { text-align: center; color: #6b7280; padding: 25px; font-size: 13px; background: #f9fafb; border-top: 1px solid #e5e7eb; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="header-overlay"></div>
      <div class="header-content">
        <h1>⏰ Plus que 7 jours !</h1>
      </div>
    </div>
    <div class="content">
      <p>Bonjour <strong>{{athlete_name}}</strong>,</p>
      <p>Le grand jour approche ! Plus que 7 jours avant <strong>{{event_name}}</strong>.</p>
      
      <div class="info-card">
        <h3>Détails de votre inscription</h3>
        <p><strong>Épreuve :</strong> {{race_name}}</p>
        <p><strong>Date :</strong> {{event_date}}</p>
        <p><strong>Dossard :</strong> #{{bib_number}}</p>
      </div>

      <p><strong>Conseils pour le jour J :</strong></p>
      <ul style="color: #374151;">
        <li>Préparez votre équipement à l''avance</li>
        <li>Hydratez-vous bien les jours précédents</li>
        <li>Arrivez en avance pour récupérer votre dossard</li>
        <li>N''oubliez pas votre pièce d''identité</li>
      </ul>

      <div style="text-align: center;">
        <a href="{{event_url}}" class="button">Voir les détails de l''événement</a>
      </div>

      <p>Bonne préparation et à bientôt !</p>
      <p>Sportivement,<br><strong>L''équipe Timepulse</strong></p>
    </div>
    <div class="footer">
      <p>© 2025 Timepulse</p>
    </div>
  </div>
</body>
</html>'
WHERE template_key = 'event_reminder_7days';

-- 2. Update payment_confirmation template
UPDATE email_templates
SET html_body = '<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: ''Inter'', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; background: #f5f5f5; }
    .header { position: relative; height: 220px; background-image: url(''https://images.pexels.com/photos/2524368/pexels-photo-2524368.jpeg?auto=compress&cs=tinysrgb&w=1200''); background-size: cover; background-position: center; }
    .header-overlay { position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: linear-gradient(135deg, rgba(234, 88, 12, 0.85) 0%, rgba(249, 115, 22, 0.85) 100%); }
    .header-content { position: relative; z-index: 10; padding: 30px; text-align: center; height: 100%; display: flex; flex-direction: column; justify-content: center; }
    .header h1 { margin: 0; color: white; font-size: 28px; font-weight: 700; text-shadow: 0 2px 8px rgba(0, 0, 0, 0.2); }
    .content { background: #fff; padding: 35px; }
    .info-card { background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%); border: 2px solid #e5e7eb; border-radius: 10px; padding: 20px; margin: 20px 0; }
    .info-card table { width: 100%; border-collapse: collapse; }
    .info-card td { padding: 10px 0; border-bottom: 1px solid #f3f4f6; }
    .info-card td:first-child { color: #6b7280; font-weight: 500; }
    .info-card td:last-child { color: #0f172a; font-weight: 600; text-align: right; }
    .button { display: inline-block; background: #ea580c; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: 600; }
    .footer { text-align: center; color: #6b7280; padding: 25px; font-size: 13px; background: #f9fafb; border-top: 1px solid #e5e7eb; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="header-overlay"></div>
      <div class="header-content">
        <h1>✓ Paiement confirmé</h1>
      </div>
    </div>
    <div class="content">
      <p>Bonjour <strong>{{athlete_name}}</strong>,</p>
      <p>Nous avons bien reçu votre paiement pour <strong>{{event_name}}</strong>.</p>
      
      <div class="info-card">
        <table>
          <tr>
            <td>Montant</td>
            <td>{{amount}} €</td>
          </tr>
          <tr>
            <td>Date</td>
            <td>{{payment_date}}</td>
          </tr>
          <tr>
            <td>Transaction</td>
            <td>{{transaction_id}}</td>
          </tr>
        </table>
      </div>

      <p>Votre inscription est maintenant complète et confirmée.</p>

      <div style="text-align: center;">
        <a href="{{manage_url}}" class="button">Gérer mon inscription</a>
      </div>

      <p>L''équipe Timepulse</p>
    </div>
    <div class="footer">
      <p>© 2025 Timepulse</p>
    </div>
  </div>
</body>
</html>'
WHERE template_key = 'payment_confirmation';

-- 3. Update admin_welcome template  
UPDATE email_templates
SET html_body = '<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: ''Inter'', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; background: #f5f5f5; }
    .header { position: relative; height: 220px; background-image: url(''https://images.pexels.com/photos/3937174/pexels-photo-3937174.jpeg?auto=compress&cs=tinysrgb&w=1200''); background-size: cover; background-position: center; }
    .header-overlay { position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: linear-gradient(135deg, rgba(234, 88, 12, 0.85) 0%, rgba(249, 115, 22, 0.85) 100%); }
    .header-content { position: relative; z-index: 10; padding: 30px; text-align: center; height: 100%; display: flex; flex-direction: column; justify-content: center; }
    .header h1 { margin: 0; color: white; font-size: 28px; font-weight: 700; text-shadow: 0 2px 8px rgba(0, 0, 0, 0.2); }
    .content { background: #fff; padding: 35px; }
    .info-card { background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%); border: 2px solid #e5e7eb; border-radius: 10px; padding: 20px; margin: 20px 0; }
    .button { display: inline-block; background: #ea580c; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: 600; }
    .footer { text-align: center; color: #6b7280; padding: 25px; font-size: 13px; background: #f9fafb; border-top: 1px solid #e5e7eb; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="header-overlay"></div>
      <div class="header-content">
        <h1>🎉 Bienvenue Admin</h1>
      </div>
    </div>
    <div class="content">
      <p>Bonjour <strong>{{admin_name}}</strong>,</p>
      <p>Votre compte administrateur a été créé avec succès.</p>
      
      <div class="info-card">
        <p><strong>Email :</strong> {{email}}</p>
        <p><strong>Rôle :</strong> {{role}}</p>
      </div>

      <div style="text-align: center;">
        <a href="{{admin_url}}" class="button">Accéder au panneau admin</a>
      </div>

      <p>L''équipe Timepulse</p>
    </div>
    <div class="footer">
      <p>© 2025 Timepulse</p>
    </div>
  </div>
</body>
</html>'
WHERE template_key = 'admin_welcome';

-- 4. Update admin_credentials_reminder template
UPDATE email_templates  
SET html_body = '<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: ''Inter'', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; background: #f5f5f5; }
    .header { position: relative; height: 220px; background-image: url(''https://images.pexels.com/photos/669615/pexels-photo-669615.jpeg?auto=compress&cs=tinysrgb&w=1200''); background-size: cover; background-position: center; }
    .header-overlay { position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: linear-gradient(135deg, rgba(234, 88, 12, 0.85) 0%, rgba(249, 115, 22, 0.85) 100%); }
    .header-content { position: relative; z-index: 10; padding: 30px; text-align: center; height: 100%; display: flex; flex-direction: column; justify-content: center; }
    .header h1 { margin: 0; color: white; font-size: 28px; font-weight: 700; text-shadow: 0 2px 8px rgba(0, 0, 0, 0.2); }
    .content { background: #fff; padding: 35px; }
    .info-card { background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%); border: 2px solid #e5e7eb; border-radius: 10px; padding: 20px; margin: 20px 0; }
    .button { display: inline-block; background: #ea580c; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: 600; }
    .footer { text-align: center; color: #6b7280; padding: 25px; font-size: 13px; background: #f9fafb; border-top: 1px solid #e5e7eb; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="header-overlay"></div>
      <div class="header-content">
        <h1>🔑 Rappel identifiants</h1>
      </div>
    </div>
    <div class="content">
      <p>Bonjour <strong>{{name}}</strong>,</p>
      <p>Vous recevez cet email suite à une demande de rappel de vos identifiants de connexion.</p>
      
      <div class="info-card">
        <p><strong>Email :</strong> {{email}}</p>
        <p><strong>Lien de connexion :</strong> {{loginUrl}}</p>
      </div>

      <p><strong>Note :</strong> Pour des raisons de sécurité, votre mot de passe n''est pas inclus dans cet email. Si vous l''avez oublié, contactez un administrateur pour le réinitialiser.</p>

      <div style="text-align: center;">
        <a href="{{loginUrl}}" class="button">Se connecter</a>
      </div>

      <p>Si vous n''avez pas demandé cet email, vous pouvez l''ignorer en toute sécurité.</p>
      <p>Cordialement,<br><strong>L''équipe Timepulse</strong></p>
    </div>
    <div class="footer">
      <p>© 2025 Timepulse</p>
    </div>
  </div>
</body>
</html>'
WHERE template_key = 'admin_credentials_reminder';

-- 5. Update race_results_available template
UPDATE email_templates
SET html_body = '<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: ''Inter'', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; background: #f5f5f5; }
    .header { position: relative; height: 220px; background-image: url(''https://images.pexels.com/photos/2524368/pexels-photo-2524368.jpeg?auto=compress&cs=tinysrgb&w=1200''); background-size: cover; background-position: center; }
    .header-overlay { position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: linear-gradient(135deg, rgba(234, 88, 12, 0.85) 0%, rgba(249, 115, 22, 0.85) 100%); }
    .header-content { position: relative; z-index: 10; padding: 30px; text-align: center; height: 100%; display: flex; flex-direction: column; justify-content: center; }
    .header h1 { margin: 0; color: white; font-size: 28px; font-weight: 700; text-shadow: 0 2px 8px rgba(0, 0, 0, 0.2); }
    .content { background: #fff; padding: 35px; }
    .info-card { background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%); border: 2px solid #e5e7eb; border-radius: 10px; padding: 20px; margin: 20px 0; }
    .button { display: inline-block; background: #ea580c; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: 600; }
    .footer { text-align: center; color: #6b7280; padding: 25px; font-size: 13px; background: #f9fafb; border-top: 1px solid #e5e7eb; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="header-overlay"></div>
      <div class="header-content">
        <h1>🏆 Résultats disponibles</h1>
      </div>
    </div>
    <div class="content">
      <p>Bonjour <strong>{{athlete_name}}</strong>,</p>
      <p>Les résultats de <strong>{{event_name}}</strong> sont maintenant disponibles !</p>
      
      <div class="info-card">
        <p><strong>Votre temps :</strong> {{finish_time}}</p>
        <p><strong>Classement :</strong> {{rank}}</p>
        <p><strong>Catégorie :</strong> {{category}}</p>
      </div>

      <div style="text-align: center;">
        <a href="{{results_url}}" class="button">Voir les résultats complets</a>
      </div>

      <p>Félicitations pour votre participation !</p>
      <p>Sportivement,<br><strong>L''équipe Timepulse</strong></p>
    </div>
    <div class="footer">
      <p>© 2025 Timepulse</p>
    </div>
  </div>
</body>
</html>'
WHERE template_key = 'race_results_available';

-- 6-8. Update bib exchange templates
UPDATE email_templates
SET html_body = '<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: ''Inter'', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; background: #f5f5f5; }
    .header { position: relative; height: 220px; background-image: url(''https://images.pexels.com/photos/136739/pexels-photo-136739.jpeg?auto=compress&cs=tinysrgb&w=1200''); background-size: cover; background-position: center; }
    .header-overlay { position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: linear-gradient(135deg, rgba(234, 88, 12, 0.85) 0%, rgba(249, 115, 22, 0.85) 100%); }
    .header-content { position: relative; z-index: 10; padding: 30px; text-align: center; height: 100%; display: flex; flex-direction: column; justify-content: center; }
    .header h1 { margin: 0; color: white; font-size: 28px; font-weight: 700; text-shadow: 0 2px 8px rgba(0, 0, 0, 0.2); }
    .content { background: #fff; padding: 35px; }
    .info-card { background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%); border: 2px solid #e5e7eb; border-radius: 10px; padding: 20px; margin: 20px 0; }
    .button { display: inline-block; background: #ea580c; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: 600; }
    .footer { text-align: center; color: #6b7280; padding: 25px; font-size: 13px; background: #f9fafb; border-top: 1px solid #e5e7eb; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="header-overlay"></div>
      <div class="header-content">
        <h1>🎫 Dossard en vente</h1>
      </div>
    </div>
    <div class="content">
      <p>Bonjour <strong>{{seller_name}}</strong>,</p>
      <p>Votre dossard pour <strong>{{event_name}}</strong> est maintenant en vente.</p>
      
      <div class="info-card">
        <p><strong>Dossard :</strong> #{{bib_number}}</p>
        <p><strong>Prix :</strong> {{price}} €</p>
      </div>

      <p>Vous serez notifié dès qu''un acheteur sera trouvé.</p>
      <p>L''équipe Timepulse</p>
    </div>
    <div class="footer">
      <p>© 2025 Timepulse</p>
    </div>
  </div>
</body>
</html>'
WHERE template_key = 'bib_exchange_seller_listing';

UPDATE email_templates
SET html_body = '<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: ''Inter'', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; background: #f5f5f5; }
    .header { position: relative; height: 220px; background-image: url(''https://images.pexels.com/photos/136739/pexels-photo-136739.jpeg?auto=compress&cs=tinysrgb&w=1200''); background-size: cover; background-position: center; }
    .header-overlay { position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: linear-gradient(135deg, rgba(234, 88, 12, 0.85) 0%, rgba(249, 115, 22, 0.85) 100%); }
    .header-content { position: relative; z-index: 10; padding: 30px; text-align: center; height: 100%; display: flex; flex-direction: column; justify-content: center; }
    .header h1 { margin: 0; color: white; font-size: 28px; font-weight: 700; text-shadow: 0 2px 8px rgba(0, 0, 0, 0.2); }
    .content { background: #fff; padding: 35px; }
    .info-card { background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%); border: 2px solid #e5e7eb; border-radius: 10px; padding: 20px; margin: 20px 0; }
    .button { display: inline-block; background: #ea580c; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: 600; }
    .footer { text-align: center; color: #6b7280; padding: 25px; font-size: 13px; background: #f9fafb; border-top: 1px solid #e5e7eb; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="header-overlay"></div>
      <div class="header-content">
        <h1>✅ Dossard vendu</h1>
      </div>
    </div>
    <div class="content">
      <p>Bonjour <strong>{{seller_name}}</strong>,</p>
      <p>Bonne nouvelle ! Votre dossard pour <strong>{{event_name}}</strong> a été vendu.</p>
      
      <div class="info-card">
        <p><strong>Dossard :</strong> #{{bib_number}}</p>
        <p><strong>Acheteur :</strong> {{buyer_name}}</p>
        <p><strong>Prix :</strong> {{price}} €</p>
      </div>

      <p>Le montant sera crédité selon les modalités prévues.</p>
      <p>L''équipe Timepulse</p>
    </div>
    <div class="footer">
      <p>© 2025 Timepulse</p>
    </div>
  </div>
</body>
</html>'
WHERE template_key = 'bib_exchange_seller_sold';

UPDATE email_templates
SET html_body = '<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: ''Inter'', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; background: #f5f5f5; }
    .header { position: relative; height: 220px; background-image: url(''https://images.pexels.com/photos/136739/pexels-photo-136739.jpeg?auto=compress&cs=tinysrgb&w=1200''); background-size: cover; background-position: center; }
    .header-overlay { position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: linear-gradient(135deg, rgba(234, 88, 12, 0.85) 0%, rgba(249, 115, 22, 0.85) 100%); }
    .header-content { position: relative; z-index: 10; padding: 30px; text-align: center; height: 100%; display: flex; flex-direction: column; justify-content: center; }
    .header h1 { margin: 0; color: white; font-size: 28px; font-weight: 700; text-shadow: 0 2px 8px rgba(0, 0, 0, 0.2); }
    .content { background: #fff; padding: 35px; }
    .info-card { background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%); border: 2px solid #e5e7eb; border-radius: 10px; padding: 20px; margin: 20px 0; }
    .button { display: inline-block; background: #ea580c; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: 600; }
    .footer { text-align: center; color: #6b7280; padding: 25px; font-size: 13px; background: #f9fafb; border-top: 1px solid #e5e7eb; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="header-overlay"></div>
      <div class="header-content">
        <h1>🎉 Dossard récupéré</h1>
      </div>
    </div>
    <div class="content">
      <p>Bonjour <strong>{{buyer_name}}</strong>,</p>
      <p>Votre achat de dossard pour <strong>{{event_name}}</strong> est confirmé !</p>
      
      <div class="info-card">
        <p><strong>Dossard :</strong> #{{bib_number}}</p>
        <p><strong>Prix :</strong> {{price}} €</p>
      </div>

      <p>Vous pouvez maintenant participer à l''événement avec ce dossard.</p>
      <p>L''équipe Timepulse</p>
    </div>
    <div class="footer">
      <p>© 2025 Timepulse</p>
    </div>
  </div>
</body>
</html>'
WHERE template_key = 'bib_exchange_buyer_confirmation';

-- 9-11. Update remaining templates
UPDATE email_templates
SET html_body = '<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: ''Inter'', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; background: #f5f5f5; }
    .header { position: relative; height: 220px; background-image: url(''https://images.pexels.com/photos/2803158/pexels-photo-2803158.jpeg?auto=compress&cs=tinysrgb&w=1200''); background-size: cover; background-position: center; }
    .header-overlay { position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: linear-gradient(135deg, rgba(234, 88, 12, 0.85) 0%, rgba(249, 115, 22, 0.85) 100%); }
    .header-content { position: relative; z-index: 10; padding: 30px; text-align: center; height: 100%; display: flex; flex-direction: column; justify-content: center; }
    .header h1 { margin: 0; color: white; font-size: 28px; font-weight: 700; text-shadow: 0 2px 8px rgba(0, 0, 0, 0.2); }
    .content { background: #fff; padding: 35px; }
    .info-card { background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%); border: 2px solid #e5e7eb; border-radius: 10px; padding: 20px; margin: 20px 0; }
    .button { display: inline-block; background: #ea580c; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: 600; }
    .footer { text-align: center; color: #6b7280; padding: 25px; font-size: 13px; background: #f9fafb; border-top: 1px solid #e5e7eb; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="header-overlay"></div>
      <div class="header-content">
        <h1>✓ Inscription confirmée</h1>
      </div>
    </div>
    <div class="content">
      <p>Bonjour <strong>{{athlete_name}}</strong>,</p>
      <p>Votre inscription à <strong>{{event_name}}</strong> est confirmée !</p>
      
      <div class="info-card">
        <p><strong>Épreuve :</strong> {{race_name}}</p>
        <p><strong>Date :</strong> {{event_date}}</p>
        <p><strong>Catégorie :</strong> {{category}}</p>
      </div>

      <div style="text-align: center;">
        <a href="{{manage_url}}" class="button">Gérer mon inscription</a>
      </div>

      <p>Sportivement,<br><strong>L''équipe Timepulse</strong></p>
    </div>
    <div class="footer">
      <p>© 2025 Timepulse</p>
    </div>
  </div>
</body>
</html>'
WHERE template_key = 'registration_confirmation';

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
    .info-card { background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%); border: 2px solid #e5e7eb; border-radius: 10px; padding: 20px; margin: 20px 0; text-align: center; }
    .bib-number { font-size: 48px; font-weight: 800; color: #ea580c; margin: 10px 0; }
    .button { display: inline-block; background: #ea580c; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: 600; }
    .footer { text-align: center; color: #6b7280; padding: 25px; font-size: 13px; background: #f9fafb; border-top: 1px solid #e5e7eb; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="header-overlay"></div>
      <div class="header-content">
        <h1>🎫 Votre dossard</h1>
      </div>
    </div>
    <div class="content">
      <p>Bonjour <strong>{{athlete_name}}</strong>,</p>
      <p>Votre numéro de dossard pour <strong>{{event_name}}</strong> vous a été attribué :</p>
      
      <div class="info-card">
        <div class="bib-number">#{{bib_number}}</div>
        <p style="color: #6b7280; margin: 10px 0 0 0;">Votre numéro de dossard</p>
      </div>

      <p>Retirez-le lors du retrait des dossards avec votre pièce d''identité.</p>
      <p>L''équipe Timepulse</p>
    </div>
    <div class="footer">
      <p>© 2025 Timepulse</p>
    </div>
  </div>
</body>
</html>'
WHERE template_key = 'bib_number_assigned';

UPDATE email_templates
SET html_body = '<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: ''Inter'', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; background: #f5f5f5; }
    .header { position: relative; height: 220px; background-image: url(''https://images.pexels.com/photos/259209/pexels-photo-259209.jpeg?auto=compress&cs=tinysrgb&w=1200''); background-size: cover; background-position: center; }
    .header-overlay { position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: linear-gradient(135deg, rgba(234, 88, 12, 0.85) 0%, rgba(249, 115, 22, 0.85) 100%); }
    .header-content { position: relative; z-index: 10; padding: 30px; text-align: center; height: 100%; display: flex; flex-direction: column; justify-content: center; }
    .header h1 { margin: 0; color: white; font-size: 28px; font-weight: 700; text-shadow: 0 2px 8px rgba(0, 0, 0, 0.2); }
    .content { background: #fff; padding: 35px; }
    .info-card { background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%); border: 2px solid #e5e7eb; border-radius: 10px; padding: 20px; margin: 20px 0; }
    .info-card table { width: 100%; border-collapse: collapse; }
    .info-card td { padding: 10px 0; border-bottom: 1px solid #f3f4f6; }
    .info-card td:first-child { color: #6b7280; font-weight: 500; }
    .info-card td:last-child { color: #0f172a; font-weight: 600; text-align: right; }
    .footer { text-align: center; color: #6b7280; padding: 25px; font-size: 13px; background: #f9fafb; border-top: 1px solid #e5e7eb; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="header-overlay"></div>
      <div class="header-content">
        <h1>💰 Remboursement confirmé</h1>
      </div>
    </div>
    <div class="content">
      <p>Bonjour <strong>{{athlete_name}}</strong>,</p>
      <p>Votre remboursement pour <strong>{{event_name}}</strong> a été traité.</p>
      
      <div class="info-card">
        <table>
          <tr>
            <td>Montant</td>
            <td>{{refund_amount}} €</td>
          </tr>
          <tr>
            <td>Date</td>
            <td>{{refund_date}}</td>
          </tr>
          <tr>
            <td>Référence</td>
            <td>{{refund_id}}</td>
          </tr>
        </table>
      </div>

      <p>Le montant sera crédité sur votre compte sous 3 à 5 jours ouvrés.</p>
      <p>Cordialement,<br><strong>L''équipe Timepulse</strong></p>
    </div>
    <div class="footer">
      <p>© 2025 Timepulse</p>
    </div>
  </div>
</body>
</html>'
WHERE template_key = 'refund_confirmation';