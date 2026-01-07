/**
 * Templates d'emails professionnels pour Timepulse
 * Design cohérent avec le site web
 */

export interface EmailTemplateData {
  title: string;
  preheader?: string;
  content: string;
  ctaText?: string;
  ctaUrl?: string;
  footerNote?: string;
}

// Images de fond variées depuis Pexels (cohérentes avec le site)
const HEADER_IMAGES = [
  'https://images.pexels.com/photos/2402777/pexels-photo-2402777.jpeg?auto=compress&cs=tinysrgb&w=1920', // Course à pied groupe
  'https://images.pexels.com/photos/618612/pexels-photo-618612.jpeg?auto=compress&cs=tinysrgb&w=1920', // Runner solo
  'https://images.pexels.com/photos/3764011/pexels-photo-3764011.jpeg?auto=compress&cs=tinysrgb&w=1920', // Trail montagne
  'https://images.pexels.com/photos/2803158/pexels-photo-2803158.jpeg?auto=compress&cs=tinysrgb&w=1920', // Cycliste
  'https://images.pexels.com/photos/163403/runner-athlete-fitness-jogger-163403.jpeg?auto=compress&cs=tinysrgb&w=1920', // Marathon
];

// Sélectionne une image de fond de manière pseudo-aléatoire basée sur le titre
function getHeaderImage(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash = hash & hash;
  }
  const index = Math.abs(hash) % HEADER_IMAGES.length;
  return HEADER_IMAGES[index];
}

export function generateEmailTemplate(data: EmailTemplateData): string {
  const headerImage = getHeaderImage(data.title);
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const logoUrl = `${supabaseUrl}/storage/v1/object/public/email-assets/timepulse-logo.png`;

  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      ${data.preheader ? `<meta name="x-apple-disable-message-reformatting">` : ''}
      <title>${data.title}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

        body {
          margin: 0;
          padding: 0;
          font-family: 'Inter', 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          background-color: #f5f5f5;
        }

        .email-wrapper {
          width: 100%;
          background-color: #f5f5f5;
          padding: 20px 0;
        }

        .email-container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #ffffff;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .email-header {
          position: relative;
          height: 220px;
          background-image: url('${headerImage}');
          background-size: cover;
          background-position: center;
          overflow: hidden;
        }

        .header-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, rgba(234, 88, 12, 0.85) 0%, rgba(249, 115, 22, 0.85) 100%);
        }

        .header-content {
          position: relative;
          z-index: 10;
          padding: 30px 25px;
          text-align: center;
          display: flex;
          flex-direction: column;
          justify-content: center;
          height: 100%;
        }

        .logo {
          height: 40px;
          margin-bottom: 15px;
          filter: brightness(0) invert(1);
        }

        .email-title {
          margin: 0;
          color: #ffffff;
          font-size: 26px;
          font-weight: 700;
          letter-spacing: 0.02em;
          line-height: 1.3;
          text-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        }

        .email-body {
          padding: 35px;
          color: #1f2937;
          line-height: 1.6;
          font-size: 15px;
        }

        .email-body p {
          margin: 0 0 16px 0;
          color: #374151;
        }

        .email-body strong {
          color: #1f2937;
          font-weight: 600;
        }

        .info-card {
          background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%);
          border: 2px solid #e5e7eb;
          border-radius: 10px;
          padding: 20px;
          margin: 20px 0;
        }

        .info-card table {
          width: 100%;
          border-collapse: collapse;
        }

        .info-card td {
          padding: 10px 0;
          border-bottom: 1px solid #f3f4f6;
        }

        .info-card td:first-child {
          color: #6b7280;
          font-weight: 500;
        }

        .info-card td:last-child {
          color: #0f172a;
          font-weight: 600;
          text-align: right;
        }

        .cta-button {
          display: inline-block;
          padding: 14px 32px;
          background: #ea580c;
          color: #ffffff !important;
          text-decoration: none;
          border-radius: 8px;
          font-weight: 600;
          font-size: 15px;
          margin: 20px 0;
          box-shadow: 0 2px 8px rgba(234, 88, 12, 0.3);
          transition: all 0.3s ease;
        }

        .cta-button:hover {
          background: #c2410c;
          box-shadow: 0 4px 12px rgba(234, 88, 12, 0.4);
          transform: translateY(-1px);
        }

        .email-footer {
          background-color: #f9fafb;
          padding: 25px 35px;
          border-top: 1px solid #e5e7eb;
          text-align: center;
        }

        .footer-note {
          margin: 0 0 15px 0;
          color: #6b7280;
          font-size: 13px;
          line-height: 1.5;
        }

        .footer-brand {
          margin: 15px 0 0 0;
          color: #1f2937;
          font-size: 14px;
          font-weight: 600;
        }

        .footer-legal {
          margin: 10px 0 0 0;
          color: #9ca3af;
          font-size: 11px;
        }

        .divider {
          height: 1px;
          background: linear-gradient(to right, transparent, #e5e7eb, transparent);
          margin: 25px 0;
        }

        .warning-box {
          background: #fef3c7;
          border-left: 4px solid #f59e0b;
          padding: 16px;
          margin: 20px 0;
          border-radius: 6px;
        }

        .warning-box h3 {
          color: #d97706;
          margin: 0 0 10px 0;
          font-size: 15px;
          font-weight: 700;
        }

        .warning-box p {
          margin: 0 0 8px 0;
          color: #92400e;
          font-size: 14px;
        }

        @media only screen and (max-width: 600px) {
          .email-container {
            border-radius: 0;
          }

          .email-header {
            height: 180px;
          }

          .header-content {
            padding: 20px;
          }

          .email-title {
            font-size: 22px;
          }

          .email-body {
            padding: 25px 20px;
          }

          .email-footer {
            padding: 20px;
          }
        }
      </style>
    </head>
    <body>
      ${data.preheader ? `
      <div style="display: none; max-height: 0; overflow: hidden;">
        ${data.preheader}
      </div>
      ` : ''}

      <div class="email-wrapper">
        <div class="email-container">

          <!-- Header avec image de sport -->
          <div class="email-header">
            <div class="header-overlay"></div>
            <div class="header-content">
              <img src="${logoUrl}" alt="Timepulse" class="logo">
              <h1 class="email-title">${data.title}</h1>
            </div>
          </div>

          <!-- Corps du message -->
          <div class="email-body">
            ${data.content}

            ${data.ctaText && data.ctaUrl ? `
            <div style="text-align: center; margin: 25px 0;">
              <a href="${data.ctaUrl}" class="cta-button">${data.ctaText}</a>
            </div>
            ` : ''}
          </div>

          <!-- Footer -->
          <div class="email-footer">
            ${data.footerNote ? `
            <p class="footer-note">${data.footerNote}</p>
            <div class="divider"></div>
            ` : ''}

            <p class="footer-brand">L'équipe Timepulse</p>
            <p class="footer-legal">
              Cet email a été envoyé automatiquement. Merci de ne pas y répondre.<br>
              © ${new Date().getFullYear()} Timepulse - Tous droits réservés
            </p>
          </div>

        </div>
      </div>
    </body>
    </html>
  `;
}

// Template spécifique pour confirmation d'inscription
export function generateRegistrationConfirmationTemplate(data: {
  athleteFirstName: string;
  athleteLastName: string;
  eventName: string;
  raceName: string;
  raceDate: string;
  bibNumber?: string;
  managementCode: string;
  licenseType: string;
  amount?: number;
  organizerName: string;
  organizerEmail?: string;
  registrationStatus: 'confirmed' | 'pending_documents' | 'documents_invalid';
  statusMessage?: string;
  requiresPSPUpdate?: boolean;
  pspExpiryDate?: string;
  isGroupRegistration?: boolean;
  registrantName?: string;
  registrantEmail?: string;
}): string {
  const baseUrl = window.location.origin;
  const modifyUrl = `${baseUrl}/modify-registration/${data.managementCode}`;

  let statusBadge = '';
  let statusIcon = '';
  let statusColor = '';

  if (data.registrationStatus === 'confirmed') {
    statusIcon = '✓';
    statusColor = '#10b981';
    statusBadge = 'INSCRIPTION CONFIRMÉE';
  } else if (data.registrationStatus === 'pending_documents') {
    statusIcon = '⏳';
    statusColor = '#f59e0b';
    statusBadge = 'EN ATTENTE DE DOCUMENTS';
  } else {
    statusIcon = '❌';
    statusColor = '#ef4444';
    statusBadge = 'DOCUMENTS INVALIDES';
  }

  let pspWarning = '';
  if (data.requiresPSPUpdate && data.pspExpiryDate) {
    pspWarning = `
      <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 25px 0; border-radius: 8px;">
        <h3 style="color: #d97706; margin: 0 0 12px 0; font-size: 16px; font-weight: 700;">⚠️ Action requise : Mise à jour du PSP</h3>
        <p style="margin: 0 0 10px 0; color: #92400e;">Votre PSP (Pass Prévention Santé) expire le <strong>${data.pspExpiryDate}</strong>.</p>
        <p style="margin: 0 0 10px 0; color: #92400e;"><strong>Vous devez fournir un PSP valide datant de moins d'1 an avant l'épreuve.</strong></p>
        <p style="margin: 0; color: #92400e;">Utilisez le code de gestion ci-dessous pour mettre à jour votre document.</p>
      </div>
    `;
  }

  let groupInfo = '';
  if (data.isGroupRegistration && data.registrantName) {
    groupInfo = `
      <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 25px 0; border-radius: 8px;">
        <h4 style="color: #d97706; margin: 0 0 12px 0; font-size: 15px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">👥 Inscription de groupe</h4>
        <p style="margin: 0 0 8px 0; color: #92400e;">Votre inscription a été effectuée par :</p>
        <p style="margin: 0; color: #1f2937; font-weight: 600;">${data.registrantName}</p>
        ${data.registrantEmail ? `<p style="margin: 8px 0 0 0; color: #92400e;"><a href="mailto:${data.registrantEmail}" style="color: #d97706; text-decoration: none; font-weight: 500;">${data.registrantEmail}</a></p>` : ''}
        <p style="margin: 12px 0 0 0; font-size: 14px; color: #92400e;">Pour toute modification, contactez cette personne.</p>
      </div>
    `;
  }

  const dossardImageUrl = `${baseUrl}/dossardsite.png`;

  const content = `
    <p style="font-size: 18px; margin: 0 0 25px 0;">Bonjour <strong>${data.athleteFirstName}</strong>,</p>

    <p style="margin: 0 0 25px 0;">Nous vous confirmons votre inscription à :</p>

    <!-- Carte événement -->
    <div style="background: linear-gradient(135deg, #f9fafb 0%, #ffffff 100%); border: 2px solid #e5e7eb; border-radius: 12px; padding: 25px; margin: 25px 0;">
      <h2 style="margin: 0 0 20px 0; color: #0f172a; font-size: 24px; font-weight: 700; font-family: 'Inter', sans-serif;">${data.eventName}</h2>

      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 12px 0; color: #6b7280; font-weight: 500; border-bottom: 1px solid #f3f4f6;">Épreuve</td>
          <td style="padding: 12px 0; color: #0f172a; font-weight: 700; text-align: right; border-bottom: 1px solid #f3f4f6;">${data.raceName}</td>
        </tr>
        <tr>
          <td style="padding: 12px 0; color: #6b7280; font-weight: 500; border-bottom: 1px solid #f3f4f6;">Date</td>
          <td style="padding: 12px 0; color: #0f172a; font-weight: 700; text-align: right; border-bottom: 1px solid #f3f4f6;">${data.raceDate}</td>
        </tr>
        <tr>
          <td style="padding: 12px 0; color: #6b7280; font-weight: 500; border-bottom: 1px solid #f3f4f6;">Type de licence</td>
          <td style="padding: 12px 0; color: #0f172a; text-align: right; border-bottom: 1px solid #f3f4f6;">${data.licenseType}</td>
        </tr>
        ${data.amount ? `
        <tr>
          <td style="padding: 12px 0; color: #6b7280; font-weight: 500;">Montant payé</td>
          <td style="padding: 12px 0; color: #10b981; font-weight: 700; text-align: right; font-size: 18px;">${data.amount.toFixed(2)} €</td>
        </tr>
        ` : ''}
      </table>
    </div>

    ${data.bibNumber ? `
    <!-- Image du dossard avec le numéro -->
    <div style="text-align: center; margin: 30px 0;">
      <p style="margin: 0 0 15px 0; color: #6b7280; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Votre numéro de dossard</p>
      <div style="display: inline-block; position: relative; width: 240px; height: 156px;">
        <img
          src="${dossardImageUrl}"
          alt="Dossard"
          style="width: 100%; height: 100%; border-radius: 8px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);"
        />
        <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; display: flex; align-items: center; justify-content: center;">
          <span style="font-size: 56px; font-weight: 800; color: #1f2937; text-shadow: 0 2px 4px rgba(255, 255, 255, 0.5);">${data.bibNumber}</span>
        </div>
      </div>
      <p style="margin: 15px 0 0 0; color: #6b7280; font-size: 13px;">Retirez-le lors du retrait des dossards avec votre pièce d'identité</p>
    </div>
    ` : ''}

    <!-- Badge de statut -->
    <div style="text-align: center; margin: 35px 0;">
      <div style="display: inline-block; background: ${statusColor}; color: white; padding: 16px 32px; border-radius: 12px; font-weight: 800; font-size: 16px; letter-spacing: 1px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);">
        ${statusIcon} ${statusBadge}
      </div>
    </div>

    ${data.statusMessage ? `
    <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 25px 0;">
      <p style="margin: 0; color: #374151;"><strong>Détails :</strong> ${data.statusMessage}</p>
    </div>
    ` : ''}

    ${pspWarning}
    ${groupInfo}

    <!-- Code de gestion -->
    <div style="background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border: 3px solid #3b82f6; border-radius: 16px; padding: 30px; margin: 35px 0; text-align: center;">
      <h3 style="color: #1e40af; margin: 0 0 12px 0; font-size: 18px; font-weight: 700;">📝 Code de gestion</h3>
      <p style="margin: 0 0 20px 0; color: #1f2937; font-size: 15px;">Conservez précieusement ce code :</p>

      <div style="background: white; border: 3px dashed #3b82f6; border-radius: 12px; padding: 20px; margin: 20px 0;">
        <div style="font-size: 36px; font-weight: 800; color: #1e40af; letter-spacing: 6px; font-family: 'Courier New', monospace;">${data.managementCode}</div>
      </div>

      <p style="margin: 20px 0 0 0; font-size: 14px; color: #6b7280;">Utilisez ce code pour modifier vos informations ou mettre à jour vos documents.</p>
    </div>

    <!-- Contact organisateur -->
    <div style="border-top: 2px solid #e5e7eb; padding-top: 25px; margin-top: 35px;">
      <h4 style="color: #6b7280; margin: 0 0 12px 0; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Organisateur</h4>
      <p style="margin: 0; color: #0f172a; font-weight: 600; font-size: 16px;">${data.organizerName}</p>
      ${data.organizerEmail ? `<p style="margin: 8px 0 0 0;"><a href="mailto:${data.organizerEmail}" style="color: #3b82f6; text-decoration: none; font-weight: 500;">${data.organizerEmail}</a></p>` : ''}
    </div>
  `;

  return generateEmailTemplate({
    title: 'Dossard confirmé',
    preheader: `Votre inscription à ${data.eventName} est confirmée`,
    content,
    ctaText: 'Gérer mon inscription',
    ctaUrl: modifyUrl,
    footerNote: 'Conservez ce code de gestion dans un endroit sûr. Vérifiez que tous vos documents sont valides et à jour.',
  });
}

// Template de bienvenue
export function generateWelcomeTemplate(name: string, homeUrl: string): string {
  const content = `
    <p style="font-size: 18px; margin: 0 0 25px 0;">Bonjour <strong>${name}</strong>,</p>

    <p style="margin: 0 0 25px 0;">Nous sommes ravis de vous accueillir sur <strong>Timepulse</strong>, votre plateforme de chronométrage et d'inscription pour événements sportifs.</p>

    <div style="background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%); border: 2px solid #e5e7eb; border-radius: 12px; padding: 25px; margin: 30px 0;">
      <h3 style="margin: 0 0 20px 0; color: #0f172a; font-size: 20px; font-weight: 700;">Avec Timepulse, vous pouvez :</h3>
      <ul style="margin: 0; padding-left: 20px; color: #374151; font-size: 15px; line-height: 2;">
        <li><strong>Découvrir</strong> et vous inscrire à des événements sportifs partout en France</li>
        <li><strong>Gérer</strong> vos inscriptions en ligne facilement</li>
        <li><strong>Accéder</strong> à vos résultats en temps réel</li>
        <li><strong>Participer</strong> au co-voiturage et à l'échange de dossards</li>
        <li><strong>Suivre</strong> vos performances et progresser</li>
      </ul>
    </div>

    <p style="margin: 25px 0;">Prêt à relever votre prochain défi sportif ?</p>

    <div style="background: #f9fafb; border-radius: 12px; padding: 25px; margin: 30px 0; text-align: center;">
      <p style="margin: 0 0 15px 0; color: #6b7280; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Besoin d'aide ?</p>
      <p style="margin: 0; color: #374151;">Notre équipe est à votre disposition pour toute question.</p>
    </div>

    <p style="margin: 25px 0 0 0;">Sportivement,<br><strong style="color: #0f172a;">L'équipe Timepulse</strong></p>
  `;

  return generateEmailTemplate({
    title: 'Bienvenue sur Timepulse',
    preheader: 'Découvrez votre nouvelle plateforme d\'inscription aux événements sportifs',
    content,
    ctaText: 'Découvrir les événements',
    ctaUrl: homeUrl,
    footerNote: 'Vous recevez cet email car vous vous êtes inscrit sur Timepulse.',
  });
}

// Template de réinitialisation de mot de passe
export function generatePasswordResetTemplate(resetLink: string): string {
  const content = `
    <p style="font-size: 18px; margin: 0 0 25px 0;">Bonjour,</p>

    <p style="margin: 0 0 25px 0;">Vous avez demandé la réinitialisation de votre mot de passe sur <strong>Timepulse</strong>.</p>

    <p style="margin: 0 0 25px 0;">Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe :</p>

    <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 30px 0; border-radius: 12px;">
      <h3 style="color: #d97706; margin: 0 0 12px 0; font-size: 16px; font-weight: 700;">⚠️ Important</h3>
      <ul style="margin: 0; padding-left: 20px; color: #92400e; font-size: 14px; line-height: 1.8;">
        <li>Ce lien est <strong>valable pendant 1 heure</strong></li>
        <li>Si vous n'avez pas demandé cette réinitialisation, <strong>ignorez cet email</strong></li>
        <li>Votre mot de passe actuel reste inchangé tant que vous ne cliquez pas sur le lien</li>
      </ul>
    </div>

    <div style="background: #f9fafb; border-radius: 12px; padding: 25px; margin: 30px 0; text-align: center;">
      <p style="margin: 0; color: #6b7280; font-size: 14px;">Pour des raisons de sécurité, ne partagez jamais ce lien avec quiconque.</p>
    </div>

    <p style="margin: 25px 0 0 0;">Cordialement,<br><strong style="color: #0f172a;">L'équipe Timepulse</strong></p>
  `;

  return generateEmailTemplate({
    title: 'Réinitialisation de mot de passe',
    preheader: 'Créez un nouveau mot de passe pour votre compte Timepulse',
    content,
    ctaText: 'Réinitialiser mon mot de passe',
    ctaUrl: resetLink,
    footerNote: 'Ce lien expire dans 1 heure pour votre sécurité.',
  });
}

// Template de notification de co-voiturage
export function generateCarpoolingNotificationTemplate(data: {
  driverName: string;
  passengerName: string;
  eventName: string;
  departureCity: string;
  departureTime?: string;
  availableSeats: number;
}): string {
  const content = `
    <p style="font-size: 18px; margin: 0 0 25px 0;">Bonjour <strong>${data.driverName}</strong>,</p>

    <p style="margin: 0 0 25px 0;">Bonne nouvelle ! <strong>${data.passengerName}</strong> a réservé une place dans votre offre de co-voiturage pour l'événement <strong>${data.eventName}</strong>.</p>

    <!-- Carte co-voiturage -->
    <div style="background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%); border: 2px solid #e5e7eb; border-radius: 12px; padding: 25px; margin: 30px 0;">
      <div style="text-align: center; margin-bottom: 20px;">
        <span style="font-size: 48px;">🚗</span>
      </div>

      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 12px 0; color: #6b7280; font-weight: 600; border-bottom: 1px solid #f3f4f6;">📍 Départ</td>
          <td style="padding: 12px 0; color: #0f172a; font-weight: 700; text-align: right; border-bottom: 1px solid #f3f4f6;">${data.departureCity}</td>
        </tr>
        ${data.departureTime ? `
        <tr>
          <td style="padding: 12px 0; color: #6b7280; font-weight: 600; border-bottom: 1px solid #f3f4f6;">🕐 Heure</td>
          <td style="padding: 12px 0; color: #0f172a; font-weight: 700; text-align: right; border-bottom: 1px solid #f3f4f6;">${data.departureTime}</td>
        </tr>
        ` : ''}
        <tr>
          <td style="padding: 12px 0; color: #6b7280; font-weight: 600; border-bottom: 1px solid #f3f4f6;">👤 Passager</td>
          <td style="padding: 12px 0; color: #0f172a; font-weight: 700; text-align: right; border-bottom: 1px solid #f3f4f6;">${data.passengerName}</td>
        </tr>
        <tr>
          <td style="padding: 12px 0; color: #6b7280; font-weight: 600;">💺 Places restantes</td>
          <td style="padding: 12px 0; color: #10b981; font-weight: 800; text-align: right; font-size: 20px;">${data.availableSeats}</td>
        </tr>
      </table>
    </div>

    <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 30px 0; border-radius: 12px;">
      <h3 style="color: #d97706; margin: 0 0 12px 0; font-size: 16px; font-weight: 700;">💡 Prochaines étapes</h3>
      <ul style="margin: 0; padding-left: 20px; color: #92400e; font-size: 14px; line-height: 1.8;">
        <li>Connectez-vous à votre espace organisateur</li>
        <li>Consultez les détails de la réservation</li>
        <li>Contactez votre passager pour finaliser les détails</li>
      </ul>
    </div>

    <p style="margin: 25px 0;">Merci de contribuer à une mobilité plus écologique et conviviale !</p>

    <p style="margin: 25px 0 0 0;">Bon trajet !<br><strong style="color: #0f172a;">L'équipe Timepulse</strong></p>
  `;

  return generateEmailTemplate({
    title: 'Nouvelle réservation co-voiturage',
    preheader: `${data.passengerName} a réservé une place dans votre véhicule`,
    content,
    ctaText: 'Gérer mes offres',
    ctaUrl: `${window.location.origin}/organizer/carpooling`,
    footerNote: 'Pensez à échanger vos coordonnées avec votre passager avant le départ.',
  });
}

// Template de confirmation simple
export function generateSimpleConfirmationTemplate(data: {
  name: string;
  eventName: string;
  raceName: string;
  bibNumber?: string;
}): string {
  const content = `
    <p style="font-size: 18px; margin: 0 0 25px 0;">Bonjour <strong>${data.name}</strong>,</p>

    <p style="margin: 0 0 25px 0;">Votre inscription a été confirmée avec succès !</p>

    <div style="background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%); border: 2px solid #e5e7eb; border-radius: 12px; padding: 30px; margin: 30px 0; text-align: center;">
      <div style="font-size: 64px; margin: 0 0 20px 0;">✅</div>
      <h2 style="margin: 0 0 15px 0; color: #0f172a; font-size: 24px; font-weight: 800;">${data.eventName}</h2>
      <p style="margin: 0; color: #6b7280; font-size: 18px; font-weight: 600;">${data.raceName}</p>
      ${data.bibNumber ? `
      <div style="margin-top: 25px; padding-top: 25px; border-top: 2px dashed #e5e7eb;">
        <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Votre dossard</p>
        <p style="margin: 0; color: #0f172a; font-size: 36px; font-weight: 800;">#${data.bibNumber}</p>
      </div>
      ` : ''}
    </div>

    <p style="margin: 25px 0;">Nous vous souhaitons une excellente préparation et un très bon événement !</p>

    <p style="margin: 25px 0 0 0;">Sportivement,<br><strong style="color: #0f172a;">L'équipe Timepulse</strong></p>
  `;

  return generateEmailTemplate({
    title: 'Inscription confirmée',
    preheader: `Votre inscription à ${data.eventName} est confirmée`,
    content,
    footerNote: 'Conservez cet email de confirmation pour le jour de l\'événement.',
  });
}

// Template spécial "Votre dossard est prêt"
export function generateBibReadyTemplate(data: {
  athleteName: string;
  eventName: string;
  raceName: string;
  bibNumber: string;
  managementCode: string;
}): string {
  const baseUrl = window.location.origin;
  const dossardImageUrl = `${baseUrl}/dossardsite.png`;

  const content = `
    <p style="font-size: 17px; margin: 0 0 20px 0;">Bonjour <strong>${data.athleteName}</strong>,</p>

    <p style="margin: 0 0 20px 0;">Votre numéro de dossard pour <strong>${data.eventName}</strong> vous a été attribué.</p>

    <!-- Carte de l'événement -->
    <div style="background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%); border: 2px solid #e5e7eb; border-radius: 10px; padding: 20px; margin: 25px 0;">
      <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Épreuve</p>
      <p style="margin: 0; color: #0f172a; font-size: 16px; font-weight: 700;">${data.raceName}</p>
    </div>

    <!-- Image du dossard avec le numéro -->
    <div style="text-align: center; margin: 30px 0;">
      <div style="display: inline-block; position: relative; width: 240px; height: 156px;">
        <img
          src="${dossardImageUrl}"
          alt="Dossard"
          style="width: 100%; height: 100%; border-radius: 8px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);"
        />
        <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; display: flex; align-items: center; justify-content: center;">
          <span style="font-size: 56px; font-weight: 800; color: #1f2937; text-shadow: 0 2px 4px rgba(255, 255, 255, 0.5);">${data.bibNumber}</span>
        </div>
      </div>
      <p style="margin: 15px 0 0 0; color: #6b7280; font-size: 13px;">Votre numéro de dossard</p>
    </div>

    <p style="margin: 25px 0;">Retirez-le lors du retrait des dossards avec votre pièce d'identité.</p>

    <!-- Code de gestion -->
    <div style="background: #eff6ff; border: 2px solid #3b82f6; border-radius: 8px; padding: 20px; margin: 25px 0; text-align: center;">
      <p style="margin: 0 0 10px 0; color: #1e40af; font-size: 14px; font-weight: 600;">📝 Code de gestion</p>
      <div style="background: white; border: 2px dashed #3b82f6; border-radius: 6px; padding: 12px; margin: 12px 0;">
        <span style="font-size: 28px; font-weight: 800; color: #1e40af; letter-spacing: 4px; font-family: 'Courier New', monospace;">${data.managementCode}</span>
      </div>
      <p style="margin: 12px 0 0 0; font-size: 12px; color: #6b7280;">Utilisez ce code pour modifier vos informations</p>
    </div>

    <p style="margin: 25px 0 0 0;">L'équipe Timepulse</p>
  `;

  return generateEmailTemplate({
    title: 'Votre dossard est prêt !',
    preheader: `Votre dossard n°${data.bibNumber} pour ${data.eventName}`,
    content,
    footerNote: 'Conservez ce code de gestion dans un endroit sûr.',
  });
}
