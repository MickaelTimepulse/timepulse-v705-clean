/*
  # Fix All Remaining Email Templates - Remove Orange Overlay and Use Clear Sport Images

  1. Changes
    - Remove orange overlay from ALL remaining templates
    - Use clear, professional sport images
    - No pizza, no cities, no unclear images
    - Only running, cycling, swimming, athletics, sports events

  2. Templates to fix
    - Registration confirmation
    - Payment confirmation
    - Bib number assigned
    - Race results available
    - Event reminder 7 days
    - Admin welcome
    - Admin credentials reminder
    - Organizer account created
    - Organizer account deleted
    - Organizer bib exchange notification
*/

-- 1. Registration Confirmation - Clear start line with runners
UPDATE email_templates
SET html_body = '<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0;">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <tr>
            <td style="position: relative; height: 200px; background-image: url(''https://images.pexels.com/photos/221210/pexels-photo-221210.jpeg?auto=compress&cs=tinysrgb&w=1200''); background-size: cover; background-position: center;">
              <div style="padding: 40px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 32px; text-shadow: 2px 2px 4px rgba(0,0,0,0.5);">✅ Inscription confirmée</h1>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">Bonjour <strong>{{athlete_name}}</strong>,</p>
              <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">Votre inscription à <strong>{{event_name}}</strong> est confirmée !</p>
              <div style="background-color: #f0f9ff; border-left: 4px solid #3b82f6; padding: 20px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0 0 10px 0; color: #1e40af; font-weight: bold;">📋 Détails de votre inscription</p>
                <table style="width: 100%;">
                  <tr>
                    <td style="padding: 8px 0; color: #64748b;">Événement</td>
                    <td style="padding: 8px 0; color: #1e293b; text-align: right; font-weight: bold;">{{event_name}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #64748b;">Course</td>
                    <td style="padding: 8px 0; color: #1e293b; text-align: right; font-weight: bold;">{{race_name}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #64748b;">Code de gestion</td>
                    <td style="padding: 8px 0; color: #1e293b; text-align: right; font-weight: bold;">{{management_code}}</td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>
          <tr>
            <td style="background-color: #1f2937; padding: 30px; text-align: center;">
              <p style="color: #9ca3af; font-size: 14px; margin: 0 0 10px 0;">Timepulse - Chronométrage sportif professionnel</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>'
WHERE template_key = 'registration_confirmation';

-- 2. Payment Confirmation - Finish line celebration
UPDATE email_templates
SET html_body = '<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0;">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <tr>
            <td style="position: relative; height: 200px; background-image: url(''https://images.pexels.com/photos/235922/pexels-photo-235922.jpeg?auto=compress&cs=tinysrgb&w=1200''); background-size: cover; background-position: center;">
              <div style="padding: 40px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 32px; text-shadow: 2px 2px 4px rgba(0,0,0,0.5);">💳 Paiement confirmé</h1>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">Bonjour <strong>{{athlete_name}}</strong>,</p>
              <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">Votre paiement pour <strong>{{event_name}}</strong> a été confirmé.</p>
              <div style="background-color: #f0fdf4; border-left: 4px solid #22c55e; padding: 20px; margin: 20px 0; border-radius: 4px;">
                <table style="width: 100%;">
                  <tr>
                    <td style="padding: 8px 0; color: #64748b;">Montant</td>
                    <td style="padding: 8px 0; color: #1e293b; text-align: right; font-weight: bold;">{{amount}} €</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #64748b;">Transaction</td>
                    <td style="padding: 8px 0; color: #1e293b; text-align: right; font-weight: bold;">{{transaction_id}}</td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>
          <tr>
            <td style="background-color: #1f2937; padding: 30px; text-align: center;">
              <p style="color: #9ca3af; font-size: 14px; margin: 0 0 10px 0;">Timepulse - Chronométrage sportif professionnel</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>'
WHERE template_key = 'payment_confirmation';

-- 3. Bib Number Assigned - Runners with bibs
UPDATE email_templates
SET html_body = '<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0;">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <tr>
            <td style="position: relative; height: 200px; background-image: url(''https://images.pexels.com/photos/2803158/pexels-photo-2803158.jpeg?auto=compress&cs=tinysrgb&w=1200''); background-size: cover; background-position: center;">
              <div style="padding: 40px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 32px; text-shadow: 2px 2px 4px rgba(0,0,0,0.5);">🎟️ Votre dossard</h1>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">Bonjour <strong>{{athlete_name}}</strong>,</p>
              <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">Votre dossard pour <strong>{{event_name}}</strong> a été attribué !</p>
              <div style="background-color: #f0f9ff; border-left: 4px solid #3b82f6; padding: 20px; margin: 20px 0; border-radius: 4px; text-align: center;">
                <p style="margin: 0 0 10px 0; color: #1e40af; font-weight: bold;">Votre numéro de dossard</p>
                <p style="font-size: 48px; font-weight: bold; color: #1e40af; margin: 20px 0;">{{bib_number}}</p>
              </div>
            </td>
          </tr>
          <tr>
            <td style="background-color: #1f2937; padding: 30px; text-align: center;">
              <p style="color: #9ca3af; font-size: 14px; margin: 0 0 10px 0;">Timepulse - Chronométrage sportif professionnel</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>'
WHERE template_key = 'bib_number_assigned';

-- 4. Race Results Available - Victory/podium
UPDATE email_templates
SET html_body = '<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0;">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <tr>
            <td style="position: relative; height: 200px; background-image: url(''https://images.pexels.com/photos/262524/pexels-photo-262524.jpeg?auto=compress&cs=tinysrgb&w=1200''); background-size: cover; background-position: center;">
              <div style="padding: 40px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 32px; text-shadow: 2px 2px 4px rgba(0,0,0,0.5);">🏆 Résultats disponibles</h1>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">Bonjour <strong>{{athlete_name}}</strong>,</p>
              <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">Les résultats de <strong>{{event_name}}</strong> sont maintenant disponibles !</p>
              <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0 0 10px 0; color: #92400e; font-weight: bold;">📊 Vos performances</p>
                <table style="width: 100%;">
                  <tr>
                    <td style="padding: 8px 0; color: #64748b;">Classement</td>
                    <td style="padding: 8px 0; color: #1e293b; text-align: right; font-weight: bold;">{{rank}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #64748b;">Temps</td>
                    <td style="padding: 8px 0; color: #1e293b; text-align: right; font-weight: bold;">{{finish_time}}</td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>
          <tr>
            <td style="background-color: #1f2937; padding: 30px; text-align: center;">
              <p style="color: #9ca3af; font-size: 14px; margin: 0 0 10px 0;">Timepulse - Chronométrage sportif professionnel</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>'
WHERE template_key = 'race_results_available';

-- 5. Event Reminder 7 Days - Track/stadium
UPDATE email_templates
SET html_body = '<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0;">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <tr>
            <td style="position: relative; height: 200px; background-image: url(''https://images.pexels.com/photos/2881224/pexels-photo-2881224.jpeg?auto=compress&cs=tinysrgb&w=1200''); background-size: cover; background-position: center;">
              <div style="padding: 40px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 32px; text-shadow: 2px 2px 4px rgba(0,0,0,0.5);">⏰ Plus que 7 jours !</h1>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">Bonjour <strong>{{athlete_name}}</strong>,</p>
              <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">Plus que 7 jours avant <strong>{{event_name}}</strong> !</p>
              <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0 0 10px 0; color: #92400e; font-weight: bold;">📅 Détails</p>
                <table style="width: 100%;">
                  <tr>
                    <td style="padding: 8px 0; color: #64748b;">Date</td>
                    <td style="padding: 8px 0; color: #1e293b; text-align: right; font-weight: bold;">{{event_date}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #64748b;">Lieu</td>
                    <td style="padding: 8px 0; color: #1e293b; text-align: right; font-weight: bold;">{{event_location}}</td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>
          <tr>
            <td style="background-color: #1f2937; padding: 30px; text-align: center;">
              <p style="color: #9ca3af; font-size: 14px; margin: 0 0 10px 0;">Timepulse - Chronométrage sportif professionnel</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>'
WHERE template_key = 'event_reminder_7days';

-- 6. Admin Welcome - Professional sports event
UPDATE email_templates
SET html_body = '<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0;">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <tr>
            <td style="position: relative; height: 200px; background-image: url(''https://images.pexels.com/photos/2881224/pexels-photo-2881224.jpeg?auto=compress&cs=tinysrgb&w=1200''); background-size: cover; background-position: center;">
              <div style="padding: 40px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 32px; text-shadow: 2px 2px 4px rgba(0,0,0,0.5);">👋 Bienvenue Admin</h1>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">Bienvenue sur l''espace administrateur Timepulse !</p>
              <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">Votre compte a été créé avec succès.</p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #1f2937; padding: 30px; text-align: center;">
              <p style="color: #9ca3af; font-size: 14px; margin: 0 0 10px 0;">Timepulse - Chronométrage sportif professionnel</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>'
WHERE template_key = 'admin_welcome';

-- 7. Admin Credentials Reminder - Chronometer/timing
UPDATE email_templates
SET html_body = '<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0;">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <tr>
            <td style="position: relative; height: 200px; background-image: url(''https://images.pexels.com/photos/618612/pexels-photo-618612.jpeg?auto=compress&cs=tinysrgb&w=1200''); background-size: cover; background-position: center;">
              <div style="padding: 40px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 32px; text-shadow: 2px 2px 4px rgba(0,0,0,0.5);">🔑 Rappel identifiants</h1>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">Voici vos identifiants de connexion à l''espace administrateur Timepulse.</p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #1f2937; padding: 30px; text-align: center;">
              <p style="color: #9ca3af; font-size: 14px; margin: 0 0 10px 0;">Timepulse - Chronométrage sportif professionnel</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>'
WHERE template_key = 'admin_credentials_reminder';

-- 8. Organizer Account Created - Welcome runners
UPDATE email_templates
SET html_body = '<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0;">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <tr>
            <td style="position: relative; height: 200px; background-image: url(''https://images.pexels.com/photos/221210/pexels-photo-221210.jpeg?auto=compress&cs=tinysrgb&w=1200''); background-size: cover; background-position: center;">
              <div style="padding: 40px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 32px; text-shadow: 2px 2px 4px rgba(0,0,0,0.5);">🎉 Bienvenue organisateur</h1>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">Bonjour <strong>{{organizer_name}}</strong>,</p>
              <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">Bienvenue sur Timepulse ! Votre compte organisateur a été créé avec succès.</p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #1f2937; padding: 30px; text-align: center;">
              <p style="color: #9ca3af; font-size: 14px; margin: 0 0 10px 0;">Timepulse - Chronométrage sportif professionnel</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>'
WHERE template_key = 'organizer_account_created';

-- 9. Organizer Account Deleted - Neutral running
UPDATE email_templates
SET html_body = '<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0;">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <tr>
            <td style="position: relative; height: 200px; background-image: url(''https://images.pexels.com/photos/2422461/pexels-photo-2422461.jpeg?auto=compress&cs=tinysrgb&w=1200''); background-size: cover; background-position: center;">
              <div style="padding: 40px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 32px; text-shadow: 2px 2px 4px rgba(0,0,0,0.5);">👋 Compte supprimé</h1>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">Votre compte organisateur Timepulse a été supprimé comme demandé.</p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #1f2937; padding: 30px; text-align: center;">
              <p style="color: #9ca3af; font-size: 14px; margin: 0 0 10px 0;">Timepulse - Chronométrage sportif professionnel</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>'
WHERE template_key = 'organizer_account_deleted';

-- 10. Organizer Bib Exchange Notification - Cycling/athletes
UPDATE email_templates
SET html_body = '<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0;">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <tr>
            <td style="position: relative; height: 200px; background-image: url(''https://images.pexels.com/photos/1566837/pexels-photo-1566837.jpeg?auto=compress&cs=tinysrgb&w=1200''); background-size: cover; background-position: center;">
              <div style="padding: 40px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 32px; text-shadow: 2px 2px 4px rgba(0,0,0,0.5);">🔄 Échange de dossard</h1>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">Bonjour <strong>{{organizer_name}}</strong>,</p>
              <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">Un échange de dossard vient d''être effectué pour <strong>{{event_name}}</strong>.</p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #1f2937; padding: 30px; text-align: center;">
              <p style="color: #9ca3af; font-size: 14px; margin: 0 0 10px 0;">Timepulse - Chronométrage sportif professionnel</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>'
WHERE template_key = 'organizer_bib_exchange_notification';