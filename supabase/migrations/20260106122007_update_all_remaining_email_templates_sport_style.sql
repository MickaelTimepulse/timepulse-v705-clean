/*
  # FIX FINAL - Remove ALL Non-Sport Images

  1. Changes
    - Event Reminder 7 Days: Remove network cables, add RUNNING image
    - Refund Confirmation: Remove city/Florence, add RUNNING image
    - Admin Welcome: Remove network cables, add SPORT image
    - Organizer Account Deleted: Remove city, add RUNNING image
    - Race Results Available: Use RUNNING image (not team sports)
    - Organizer Bib Exchange Notification: Remove PIZZA, add RUNNING image

  2. Only Pure Running/Athletics Images
    - Marathon runners
    - Track and field
    - Running events
    - Sports timing/chronometer
*/

-- 1. Event Reminder 7 Days - MARATHON RUNNERS
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
            <td style="position: relative; height: 200px; background-image: url(''https://images.pexels.com/photos/3757376/pexels-photo-3757376.jpeg?auto=compress&cs=tinysrgb&w=1200''); background-size: cover; background-position: center;">
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

-- 2. Refund Confirmation - RUNNING OUTDOOR
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
            <td style="position: relative; height: 200px; background-image: url(''https://images.pexels.com/photos/3621187/pexels-photo-3621187.jpeg?auto=compress&cs=tinysrgb&w=1200''); background-size: cover; background-position: center;">
              <div style="padding: 40px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 32px; text-shadow: 2px 2px 4px rgba(0,0,0,0.5);">💰 Remboursement confirmé</h1>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">Bonjour <strong>{{athlete_name}}</strong>,</p>
              <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">Votre remboursement pour <strong>{{event_name}}</strong> a été traité.</p>
              <div style="background-color: #f0fdf4; border-left: 4px solid #22c55e; padding: 20px; margin: 20px 0; border-radius: 4px;">
                <table style="width: 100%;">
                  <tr>
                    <td style="padding: 8px 0; color: #64748b;">Montant</td>
                    <td style="padding: 8px 0; color: #1e293b; text-align: right; font-weight: bold;">{{refund_amount}} €</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #64748b;">Date</td>
                    <td style="padding: 8px 0; color: #1e293b; text-align: right; font-weight: bold;">{{refund_date}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #64748b;">Référence</td>
                    <td style="padding: 8px 0; color: #1e293b; text-align: right; font-weight: bold;">{{refund_id}}</td>
                  </tr>
                </table>
              </div>
              <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 20px 0;">Le remboursement sera effectué sous 5 à 10 jours ouvrés sur votre moyen de paiement.</p>
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
WHERE template_key = 'refund_confirmation';

-- 3. Admin Welcome - SPORTS TIMING/CHRONOMETER
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
            <td style="position: relative; height: 200px; background-image: url(''https://images.pexels.com/photos/40751/running-runner-long-distance-fitness-40751.jpeg?auto=compress&cs=tinysrgb&w=1200''); background-size: cover; background-position: center;">
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

-- 4. Organizer Account Deleted - TRAIL RUNNING
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
            <td style="position: relative; height: 200px; background-image: url(''https://images.pexels.com/photos/2803160/pexels-photo-2803160.jpeg?auto=compress&cs=tinysrgb&w=1200''); background-size: cover; background-position: center;">
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

-- 5. Race Results Available - RUNNING RACE VICTORY
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
            <td style="position: relative; height: 200px; background-image: url(''https://images.pexels.com/photos/2361952/pexels-photo-2361952.jpeg?auto=compress&cs=tinysrgb&w=1200''); background-size: cover; background-position: center;">
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

-- 6. Organizer Bib Exchange Notification - MARATHON PREPARATION
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
                <h1 style="color: white; margin: 0; font-size: 32px; text-shadow: 2px 2px 4px rgba(0,0,0,0.5);">🔄 Échange de dossard</h1>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">Bonjour <strong>{{organizer_name}}</strong>,</p>
              <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">Un échange de dossard vient d''être effectué pour <strong>{{event_name}}</strong>.</p>
              <div style="background-color: #f0f9ff; border-left: 4px solid #3b82f6; padding: 20px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0 0 10px 0; color: #1e40af; font-weight: bold;">📋 Détails de l''échange</p>
                <table style="width: 100%;">
                  <tr>
                    <td style="padding: 8px 0; color: #64748b;">Vendeur</td>
                    <td style="padding: 8px 0; color: #1e293b; text-align: right; font-weight: bold;">{{seller_name}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #64748b;">Acheteur</td>
                    <td style="padding: 8px 0; color: #1e293b; text-align: right; font-weight: bold;">{{buyer_name}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #64748b;">Dossard</td>
                    <td style="padding: 8px 0; color: #1e293b; text-align: right; font-weight: bold;">{{bib_number}}</td>
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
WHERE template_key = 'organizer_bib_exchange_notification';