/*
  # Update All Email Templates - Pure Sport Images Without Orange Overlay

  1. Changes
    - Remove ALL orange overlays (voile orange) from all templates
    - Replace ALL images with clear, relevant sport images
    - Fix pizza images, city images, unclear images
    - Use clean, professional sport photography

  2. Templates Updated
    - Password changed (remove pizza, add security/sport image)
    - Bib exchange seller listing (remove pizza, add running/bib image)
    - Bib exchange seller sold (remove pizza, add celebration/finish image)
    - Bib exchange buyer confirmation (remove gray block, add sport image)
    - New entry notification (clarify image with clear start line)
    - Refund confirmation (remove city, add neutral sport image)
    - All other templates (remove orange overlay)
*/

-- 1. Organizer Password Changed - Remove orange overlay, use security/sport image
UPDATE email_templates
SET html_body = '<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header with clean sport image -->
          <tr>
            <td style="position: relative; height: 200px; background-image: url(''https://images.pexels.com/photos/618612/pexels-photo-618612.jpeg?auto=compress&cs=tinysrgb&w=1200''); background-size: cover; background-position: center;">
              <div style="padding: 40px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 32px; text-shadow: 2px 2px 4px rgba(0,0,0,0.5);">🔒 Mot de passe modifié</h1>
              </div>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">Bonjour <strong>{{organizer_name}}</strong>,</p>
              <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">Votre mot de passe a été modifié avec succès le <strong>{{changed_at}}</strong>.</p>
              <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">Si vous n''avez pas effectué cette modification, veuillez contacter notre support immédiatement.</p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #1f2937; padding: 30px; text-align: center;">
              <p style="color: #9ca3af; font-size: 14px; margin: 0 0 10px 0;">Timepulse - Chronométrage sportif professionnel</p>
              <p style="color: #6b7280; font-size: 12px; margin: 0;">Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>'
WHERE template_key = 'organizer_password_changed';

-- 2. Bib Exchange Seller Listing - Clear running/bib image
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
          <!-- Header with runners and bibs -->
          <tr>
            <td style="position: relative; height: 200px; background-image: url(''https://images.pexels.com/photos/2803158/pexels-photo-2803158.jpeg?auto=compress&cs=tinysrgb&w=1200''); background-size: cover; background-position: center;">
              <div style="padding: 40px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 32px; text-shadow: 2px 2px 4px rgba(0,0,0,0.5);">🎟️ Dossard en vente</h1>
              </div>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">Bonjour <strong>{{seller_name}}</strong>,</p>
              <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">Votre dossard pour <strong>{{event_name}}</strong> est maintenant en vente sur notre plateforme.</p>
              <div style="background-color: #f0f9ff; border-left: 4px solid #3b82f6; padding: 20px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0 0 10px 0; color: #1e40af; font-weight: bold;">📋 Détails de l''annonce</p>
                <table style="width: 100%;">
                  <tr>
                    <td style="padding: 8px 0; color: #64748b;">Dossard</td>
                    <td style="padding: 8px 0; color: #1e293b; text-align: right; font-weight: bold;">{{bib_number}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #64748b;">Prix</td>
                    <td style="padding: 8px 0; color: #1e293b; text-align: right; font-weight: bold;">{{price}} €</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #64748b;">Code de gestion</td>
                    <td style="padding: 8px 0; color: #1e293b; text-align: right; font-weight: bold;">{{management_code}}</td>
                  </tr>
                </table>
              </div>
              <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 20px 0;">Vous recevrez une notification dès qu''un acheteur sera intéressé.</p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #1f2937; padding: 30px; text-align: center;">
              <p style="color: #9ca3af; font-size: 14px; margin: 0 0 10px 0;">Timepulse - Chronométrage sportif professionnel</p>
              <p style="color: #6b7280; font-size: 12px; margin: 0;">Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>'
WHERE template_key = 'bib_exchange_seller_listing';

-- 3. Bib Exchange Seller Sold - Celebration/finish line image
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
          <!-- Header with finish line/victory -->
          <tr>
            <td style="position: relative; height: 200px; background-image: url(''https://images.pexels.com/photos/235922/pexels-photo-235922.jpeg?auto=compress&cs=tinysrgb&w=1200''); background-size: cover; background-position: center;">
              <div style="padding: 40px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 32px; text-shadow: 2px 2px 4px rgba(0,0,0,0.5);">✅ Dossard vendu</h1>
              </div>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">Bonjour <strong>{{seller_name}}</strong>,</p>
              <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">Bonne nouvelle ! Votre dossard pour <strong>{{event_name}}</strong> a été vendu.</p>
              <div style="background-color: #f0fdf4; border-left: 4px solid #22c55e; padding: 20px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0 0 10px 0; color: #166534; font-weight: bold;">📋 Détails de la vente</p>
                <table style="width: 100%;">
                  <tr>
                    <td style="padding: 8px 0; color: #64748b;">Acheteur</td>
                    <td style="padding: 8px 0; color: #1e293b; text-align: right; font-weight: bold;">{{buyer_name}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #64748b;">Dossard</td>
                    <td style="padding: 8px 0; color: #1e293b; text-align: right; font-weight: bold;">{{bib_number}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #64748b;">Prix</td>
                    <td style="padding: 8px 0; color: #1e293b; text-align: right; font-weight: bold;">{{price}} €</td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #1f2937; padding: 30px; text-align: center;">
              <p style="color: #9ca3af; font-size: 14px; margin: 0 0 10px 0;">Timepulse - Chronométrage sportif professionnel</p>
              <p style="color: #6b7280; font-size: 12px; margin: 0;">Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>'
WHERE template_key = 'bib_exchange_seller_sold';

-- 4. Bib Exchange Buyer Confirmation - Add clear sport image
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
          <!-- Header with runners preparing -->
          <tr>
            <td style="position: relative; height: 200px; background-image: url(''https://images.pexels.com/photos/1566837/pexels-photo-1566837.jpeg?auto=compress&cs=tinysrgb&w=1200''); background-size: cover; background-position: center;">
              <div style="padding: 40px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 32px; text-shadow: 2px 2px 4px rgba(0,0,0,0.5);">🎉 Dossard récupéré</h1>
              </div>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">Bonjour <strong>{{buyer_name}}</strong>,</p>
              <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">Félicitations ! Vous avez récupéré un dossard pour <strong>{{event_name}}</strong>.</p>
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
                  <tr>
                    <td style="padding: 8px 0; color: #64748b;">Prix</td>
                    <td style="padding: 8px 0; color: #1e293b; text-align: right; font-weight: bold;">{{price}} €</td>
                  </tr>
                </table>
              </div>
              <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 20px 0;">Bon courage pour votre course !</p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #1f2937; padding: 30px; text-align: center;">
              <p style="color: #9ca3af; font-size: 14px; margin: 0 0 10px 0;">Timepulse - Chronométrage sportif professionnel</p>
              <p style="color: #6b7280; font-size: 12px; margin: 0;">Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>'
WHERE template_key = 'bib_exchange_buyer_confirmation';

-- 5. Organizer New Entry Notification - Clear start line image
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
          <!-- Header with start line -->
          <tr>
            <td style="position: relative; height: 200px; background-image: url(''https://images.pexels.com/photos/221210/pexels-photo-221210.jpeg?auto=compress&cs=tinysrgb&w=1200''); background-size: cover; background-position: center;">
              <div style="padding: 40px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 32px; text-shadow: 2px 2px 4px rgba(0,0,0,0.5);">🎉 Nouvelle inscription</h1>
              </div>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">Bonjour <strong>{{organizer_name}}</strong>,</p>
              <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">Une nouvelle inscription vient d''être enregistrée pour votre événement <strong>{{event_name}}</strong> !</p>
              <div style="background-color: #f0f9ff; border-left: 4px solid #3b82f6; padding: 20px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0 0 10px 0; color: #1e40af; font-weight: bold;">👤 Informations du participant</p>
                <table style="width: 100%;">
                  <tr>
                    <td style="padding: 8px 0; color: #64748b;">Nom</td>
                    <td style="padding: 8px 0; color: #1e293b; text-align: right; font-weight: bold;">{{athlete_name}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #64748b;">Course</td>
                    <td style="padding: 8px 0; color: #1e293b; text-align: right; font-weight: bold;">{{race_name}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #64748b;">Dossard</td>
                    <td style="padding: 8px 0; color: #1e293b; text-align: right; font-weight: bold;">{{bib_number}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #64748b;">Code de gestion</td>
                    <td style="padding: 8px 0; color: #1e293b; text-align: right; font-weight: bold;">{{management_code}}</td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #1f2937; padding: 30px; text-align: center;">
              <p style="color: #9ca3af; font-size: 14px; margin: 0 0 10px 0;">Timepulse - Chronométrage sportif professionnel</p>
              <p style="color: #6b7280; font-size: 12px; margin: 0;">Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>'
WHERE template_key = 'organizer_new_entry_notification';

-- 6. Refund Confirmation - Neutral running image (not city!)
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
          <!-- Header with clean running image -->
          <tr>
            <td style="position: relative; height: 200px; background-image: url(''https://images.pexels.com/photos/2422461/pexels-photo-2422461.jpeg?auto=compress&cs=tinysrgb&w=1200''); background-size: cover; background-position: center;">
              <div style="padding: 40px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 32px; text-shadow: 2px 2px 4px rgba(0,0,0,0.5);">💰 Remboursement confirmé</h1>
              </div>
            </td>
          </tr>
          <!-- Content -->
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
          <!-- Footer -->
          <tr>
            <td style="background-color: #1f2937; padding: 30px; text-align: center;">
              <p style="color: #9ca3af; font-size: 14px; margin: 0 0 10px 0;">Timepulse - Chronométrage sportif professionnel</p>
              <p style="color: #6b7280; font-size: 12px; margin: 0;">Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>'
WHERE template_key = 'refund_confirmation';