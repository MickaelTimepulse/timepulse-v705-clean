import { supabase } from './supabase';

export interface EmailOptions {
  to: string | string[];
  from?: string;
  fromName?: string;
  subject: string;
  html?: string;
  text?: string;
  replyTo?: string;
  cc?: string[];
  bcc?: string[];
  attachments?: Array<{
    filename: string;
    content: string;
    encoding: string;
  }>;
  metadata?: Record<string, any>;
  scheduledAt?: string;
}

export interface EmailResponse {
  success: boolean;
  messageId?: string;
  error?: string;
  details?: any;
}

export interface RegistrationConfirmationData {
  athleteFirstName: string;
  athleteLastName: string;
  athleteEmail: string;
  eventName: string;
  raceName: string;
  raceDate: string;
  bibNumber?: string;
  registrationStatus: 'confirmed' | 'pending_documents' | 'documents_invalid';
  statusMessage?: string;
  managementCode: string;
  licenseType: string;
  pspNumber?: string;
  pspExpiryDate?: string;
  requiresPSPUpdate?: boolean;
  amount?: number;
  paymentStatus: string;
  organizerName: string;
  organizerEmail?: string;
}

export class EmailService {
  private static instance: EmailService;

  private constructor() {}

  public static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  generateRegistrationConfirmationEmail(data: RegistrationConfirmationData): string {
    const baseUrl = window.location.origin;
    const modifyUrl = `${baseUrl}/modify-registration/${data.managementCode}`;

    // Use Supabase Storage URLs for email assets
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const logoUrl = `${supabaseUrl}/storage/v1/object/public/email-assets/timepulse-logo.png`;
    const bgUrl = `${supabaseUrl}/storage/v1/object/public/email-assets/email-header-bg.jpeg`;

    let statusBadge = '';
    let statusMessage = '';

    if (data.registrationStatus === 'confirmed') {
      statusBadge = '<div style="background: #10b981; color: white; padding: 12px 24px; border-radius: 6px; display: inline-block; font-weight: bold; margin: 20px 0;">✓ INSCRIPTION CONFIRMÉE</div>';
      if (data.requiresPSPUpdate) {
        statusMessage = '<p style="color: #10b981; font-weight: bold;">Votre inscription est confirmée mais votre PSP (Pass Prévention Santé) n\'est pas à jour.</p>';
      } else {
        statusMessage = '<p style="color: #10b981; font-weight: bold;">Votre inscription est confirmée et validée.</p>';
      }
    } else if (data.registrationStatus === 'pending_documents') {
      statusBadge = '<div style="background: #f59e0b; color: white; padding: 12px 24px; border-radius: 6px; display: inline-block; font-weight: bold; margin: 20px 0;">⏳ EN ATTENTE DE DOCUMENTS</div>';
      statusMessage = '<p style="color: #f59e0b; font-weight: bold;">Votre inscription est enregistrée mais nécessite des documents complémentaires.</p>';
    } else {
      statusBadge = '<div style="background: #ef4444; color: white; padding: 12px 24px; border-radius: 6px; display: inline-block; font-weight: bold; margin: 20px 0;">❌ DOCUMENTS INVALIDES</div>';
      statusMessage = '<p style="color: #ef4444; font-weight: bold;">Vos documents doivent être mis à jour.</p>';
    }

    let ppsWarning = '';
    if (data.requiresPSPUpdate && data.pspExpiryDate) {
      ppsWarning = `
        <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 20px 0; border-radius: 4px;">
          <h3 style="color: #d97706; margin: 0 0 10px 0;">⚠️ Action requise : Mise à jour du PSP</h3>
          <p style="margin: 0 0 10px 0;">Votre PSP (Pass Prévention Santé) expire le <strong>${data.pspExpiryDate}</strong>.</p>
          <p style="margin: 0 0 10px 0;"><strong>Vous devez fournir un PSP valide datant de moins d'1 an avant l'épreuve.</strong></p>
          <p style="margin: 0;">Utilisez le code de gestion ci-dessous pour mettre à jour votre document.</p>
        </div>
      `;
    }

    const detailsSection = data.statusMessage ? `
      <div style="background: #f3f4f6; padding: 16px; border-radius: 4px; margin: 20px 0;">
        <p style="margin: 0; color: #374151;"><strong>Détails :</strong> ${data.statusMessage}</p>
      </div>
    ` : '';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background: #f5f5f5;">
        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">

          <!-- Header -->
          <div style="position: relative; padding: 50px 20px; text-align: center; background-image: url('${bgUrl}'); background-size: cover; background-position: center;">
            <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: linear-gradient(135deg, rgba(219, 39, 119, 0.92) 0%, rgba(147, 51, 234, 0.92) 100%);"></div>
            <div style="position: relative; z-index: 1;">
              <img src="${logoUrl}" alt="Timepulse" style="height: 70px; max-width: 280px; margin: 0 auto 15px; display: block; filter: brightness(0) invert(1);">
              <p style="color: rgba(255,255,255,0.95); margin: 0; font-size: 17px; font-weight: 600; text-transform: uppercase; letter-spacing: 1.5px;">Confirmation d'inscription</p>
            </div>
          </div>

          <!-- Content -->
          <div style="padding: 40px 30px;">

            <h2 style="color: #1f2937; margin: 0 0 20px 0;">Bonjour ${data.athleteFirstName},</h2>

            <p style="margin: 0 0 20px 0; font-size: 16px;">Nous vous confirmons votre inscription à :</p>

            <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 20px; margin: 20px 0;">
              <h3 style="margin: 0 0 15px 0; color: #1f2937; font-size: 20px;">${data.eventName}</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Épreuve :</td>
                  <td style="padding: 8px 0; color: #1f2937; font-weight: bold; text-align: right;">${data.raceName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Date :</td>
                  <td style="padding: 8px 0; color: #1f2937; font-weight: bold; text-align: right;">${data.raceDate}</td>
                </tr>
                ${data.bibNumber ? `
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Dossard :</td>
                  <td style="padding: 8px 0; color: #1f2937; font-weight: bold; text-align: right; font-size: 20px;">#${data.bibNumber}</td>
                </tr>
                ` : ''}
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Licence :</td>
                  <td style="padding: 8px 0; color: #1f2937; text-align: right;">${data.licenseType}</td>
                </tr>
                ${data.amount ? `
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Montant payé :</td>
                  <td style="padding: 8px 0; color: #10b981; font-weight: bold; text-align: right;">${data.amount.toFixed(2)} €</td>
                </tr>
                ` : ''}
              </table>
            </div>

            <!-- Status Badge -->
            <div style="text-align: center; margin: 30px 0;">
              ${statusBadge}
            </div>

            ${statusMessage}
            ${detailsSection}
            ${ppsWarning}

            <!-- Management Code -->
            <div style="background: #eff6ff; border: 2px solid #3b82f6; border-radius: 8px; padding: 24px; margin: 30px 0; text-align: center;">
              <h3 style="color: #1e40af; margin: 0 0 10px 0; font-size: 18px;">📝 Code de gestion de votre inscription</h3>
              <p style="margin: 0 0 15px 0; color: #1f2937;">Conservez précieusement ce code pour gérer votre inscription :</p>
              <div style="background: white; border: 2px dashed #3b82f6; border-radius: 6px; padding: 16px; margin: 15px 0;">
                <div style="font-size: 32px; font-weight: bold; color: #1e40af; letter-spacing: 4px; font-family: 'Courier New', monospace;">${data.managementCode}</div>
              </div>
              <p style="margin: 15px 0 0 0; font-size: 14px; color: #6b7280;">Vous pouvez utiliser ce code pour modifier vos informations ou mettre à jour vos documents.</p>
              <a href="${modifyUrl}" style="display: inline-block; background: #3b82f6; color: white; text-decoration: none; padding: 12px 32px; border-radius: 6px; margin-top: 15px; font-weight: bold;">Gérer mon inscription</a>
            </div>

            <!-- Organizer Contact -->
            <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
              <h4 style="color: #6b7280; margin: 0 0 10px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Organisateur</h4>
              <p style="margin: 0; color: #1f2937; font-weight: 500;">${data.organizerName}</p>
              ${data.organizerEmail ? `<p style="margin: 5px 0 0 0; color: #6b7280;"><a href="mailto:${data.organizerEmail}" style="color: #3b82f6; text-decoration: none;">${data.organizerEmail}</a></p>` : ''}
            </div>

            <!-- Footer Notes -->
            <div style="background: #f9fafb; border-radius: 6px; padding: 20px; margin: 30px 0 0 0;">
              <p style="margin: 0 0 10px 0; font-size: 14px; color: #6b7280;"><strong>Important :</strong></p>
              <ul style="margin: 0; padding-left: 20px; font-size: 14px; color: #6b7280;">
                <li>Conservez ce code de gestion dans un endroit sûr</li>
                <li>Vérifiez que tous vos documents sont valides et à jour</li>
                <li>Contactez l'organisateur pour toute question</li>
              </ul>
            </div>

          </div>

          <!-- Footer -->
          <div style="background: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0; font-size: 14px; color: #6b7280;">
              Timepulse - Votre partenaire chronométrage
            </p>
            <p style="margin: 10px 0 0 0; font-size: 12px; color: #9ca3af;">
              Cet email a été envoyé automatiquement, merci de ne pas y répondre.
            </p>
          </div>

        </div>
      </body>
      </html>
    `;
  }

  async sendEmailWithAnonymousKey(options: EmailOptions): Promise<EmailResponse> {
    try {
      console.log('🔍 [EMAIL DEBUG] Starting anonymous email send process...');
      console.log('📧 [EMAIL DEBUG] Recipient:', options.to);
      console.log('📝 [EMAIL DEBUG] Subject:', options.subject);

      const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-email`;
      console.log('🌐 [EMAIL DEBUG] Function URL:', functionUrl);

      console.log('📤 [EMAIL DEBUG] Sending request to edge function (anonymous)...');
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify(options),
      });

      console.log('📥 [EMAIL DEBUG] Response status:', response.status);
      console.log('📥 [EMAIL DEBUG] Response ok:', response.ok);

      const data = await response.json();
      console.log('📦 [EMAIL DEBUG] Response data:', JSON.stringify(data, null, 2));

      if (!response.ok) {
        console.error('❌ [EMAIL DEBUG] Request failed');
        console.error('❌ [EMAIL DEBUG] Error:', data.error);
        console.error('❌ [EMAIL DEBUG] Details:', JSON.stringify(data.details, null, 2));
        return {
          success: false,
          error: data.error || 'Failed to send email',
          details: data.details,
        };
      }

      console.log('✅ [EMAIL DEBUG] Email sent successfully!');
      console.log('✅ [EMAIL DEBUG] Message ID:', data.messageId);

      return {
        success: true,
        messageId: data.messageId,
      };
    } catch (error) {
      console.error('💥 [EMAIL DEBUG] Exception caught:', error);
      console.error('💥 [EMAIL DEBUG] Error type:', error instanceof Error ? 'Error' : typeof error);
      console.error('💥 [EMAIL DEBUG] Error message:', error instanceof Error ? error.message : 'Unknown error');
      console.error('💥 [EMAIL DEBUG] Stack trace:', error instanceof Error ? error.stack : 'N/A');
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async sendEmail(options: EmailOptions): Promise<EmailResponse> {
    try {
      console.log('🔍 [EMAIL DEBUG] Starting email send process...');
      console.log('📧 [EMAIL DEBUG] Recipient:', options.to);
      console.log('📝 [EMAIL DEBUG] Subject:', options.subject);

      const { data: session } = await supabase.auth.getSession();

      if (!session.session) {
        console.error('❌ [EMAIL DEBUG] No active session found');
        throw new Error('User must be authenticated to send emails');
      }

      console.log('✅ [EMAIL DEBUG] Session found, user authenticated');

      const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-email`;
      console.log('🌐 [EMAIL DEBUG] Function URL:', functionUrl);

      console.log('📤 [EMAIL DEBUG] Sending request to edge function...');
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.session.access_token}`,
        },
        body: JSON.stringify(options),
      });

      console.log('📥 [EMAIL DEBUG] Response status:', response.status);
      console.log('📥 [EMAIL DEBUG] Response ok:', response.ok);

      const data = await response.json();
      console.log('📦 [EMAIL DEBUG] Response data:', JSON.stringify(data, null, 2));

      if (!response.ok) {
        console.error('❌ [EMAIL DEBUG] Request failed');
        console.error('❌ [EMAIL DEBUG] Error:', data.error);
        console.error('❌ [EMAIL DEBUG] Details:', JSON.stringify(data.details, null, 2));
        return {
          success: false,
          error: data.error || 'Failed to send email',
          details: data.details,
        };
      }

      console.log('✅ [EMAIL DEBUG] Email sent successfully!');
      console.log('✅ [EMAIL DEBUG] Message ID:', data.messageId);

      return {
        success: true,
        messageId: data.messageId,
      };
    } catch (error) {
      console.error('💥 [EMAIL DEBUG] Exception caught:', error);
      console.error('💥 [EMAIL DEBUG] Error type:', error instanceof Error ? 'Error' : typeof error);
      console.error('💥 [EMAIL DEBUG] Error message:', error instanceof Error ? error.message : 'Unknown error');
      console.error('💥 [EMAIL DEBUG] Stack trace:', error instanceof Error ? error.stack : 'N/A');
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async sendWelcomeEmail(email: string, name: string): Promise<EmailResponse> {
    return this.sendEmail({
      to: email,
      subject: 'Bienvenue sur Timepulse',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #ffffff; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 12px 30px; background: #ec4899; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <img src="${import.meta.env.VITE_SUPABASE_URL?.replace('//', '//').split('/')[0] + '//' + import.meta.env.VITE_SUPABASE_URL?.replace('//', '//').split('/')[2]}/image copy.png" alt="Timepulse" style="height: 50px; margin-bottom: 15px;">
              <h1>Bienvenue sur Timepulse !</h1>
            </div>
            <div class="content">
              <p>Bonjour ${name},</p>
              <p>Nous sommes ravis de vous accueillir sur <strong>Timepulse</strong>, votre plateforme de chronométrage et d'inscription pour événements sportifs.</p>
              <p>Avec Timepulse, vous pouvez :</p>
              <ul>
                <li>Découvrir et vous inscrire à des événements sportifs</li>
                <li>Gérer vos inscriptions en ligne</li>
                <li>Accéder à vos résultats en temps réel</li>
                <li>Participer au co-voiturage et à l'échange de dossards</li>
              </ul>
              <p style="text-align: center;">
                <a href="${import.meta.env.VITE_SUPABASE_URL?.replace('//', '//').split('/')[0] + '//' + import.meta.env.VITE_SUPABASE_URL?.replace('//', '//').split('/')[2]}" class="button">Découvrir les événements</a>
              </p>
              <p>Si vous avez des questions, n'hésitez pas à nous contacter.</p>
              <p>Sportivement,<br>L'équipe Timepulse</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Timepulse - Tous droits réservés</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `Bonjour ${name},\n\nNous sommes ravis de vous accueillir sur Timepulse, votre plateforme de chronométrage et d'inscription pour événements sportifs.\n\nSportivement,\nL'équipe Timepulse`,
    });
  }

  async sendRegistrationConfirmation(
    email: string,
    name: string,
    eventName: string,
    raceName: string,
    bibNumber?: string
  ): Promise<EmailResponse> {
    return this.sendEmail({
      to: email,
      subject: `Confirmation d'inscription - ${eventName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px; }
            .info-box { background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .info-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
            .info-row:last-child { border-bottom: none; }
            .label { font-weight: bold; color: #6b7280; }
            .value { color: #111827; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <img src="${import.meta.env.VITE_SUPABASE_URL?.replace('//', '//').split('/')[0] + '//' + import.meta.env.VITE_SUPABASE_URL?.replace('//', '//').split('/')[2]}/image copy.png" alt="Timepulse" style="height: 50px; margin-bottom: 15px;">
              <h1>✅ Inscription confirmée !</h1>
            </div>
            <div class="content">
              <p>Bonjour ${name},</p>
              <p>Votre inscription a été confirmée avec succès.</p>

              <div class="info-box">
                <div class="info-row">
                  <span class="label">Événement :</span>
                  <span class="value">${eventName}</span>
                </div>
                <div class="info-row">
                  <span class="label">Épreuve :</span>
                  <span class="value">${raceName}</span>
                </div>
                ${bibNumber ? `
                <div class="info-row">
                  <span class="label">Dossard :</span>
                  <span class="value">${bibNumber}</span>
                </div>
                ` : ''}
              </div>

              <p>Nous vous souhaitons une excellente préparation et un très bon événement !</p>

              <p>Sportivement,<br>L'équipe Timepulse</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Timepulse - Tous droits réservés</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `Bonjour ${name},\n\nVotre inscription a été confirmée avec succès.\n\nÉvénement : ${eventName}\nÉpreuve : ${raceName}${bibNumber ? `\nDossard : ${bibNumber}` : ''}\n\nNous vous souhaitons une excellente préparation et un très bon événement !\n\nSportivement,\nL'équipe Timepulse`,
    });
  }

  async sendPasswordResetEmail(email: string, resetLink: string): Promise<EmailResponse> {
    return this.sendEmail({
      to: email,
      subject: 'Réinitialisation de votre mot de passe - Timepulse',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 12px 30px; background: #ec4899; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <img src="${import.meta.env.VITE_SUPABASE_URL?.replace('//', '//').split('/')[0] + '//' + import.meta.env.VITE_SUPABASE_URL?.replace('//', '//').split('/')[2]}/image copy.png" alt="Timepulse" style="height: 50px; margin-bottom: 15px;">
              <h1>🔐 Réinitialisation du mot de passe</h1>
            </div>
            <div class="content">
              <p>Bonjour,</p>
              <p>Vous avez demandé la réinitialisation de votre mot de passe sur Timepulse.</p>
              <p style="text-align: center;">
                <a href="${resetLink}" class="button">Réinitialiser mon mot de passe</a>
              </p>
              <div class="warning">
                <strong>⚠️ Important :</strong> Ce lien est valable pendant 1 heure. Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.
              </div>
              <p>Cordialement,<br>L'équipe Timepulse</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Timepulse - Tous droits réservés</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `Bonjour,\n\nVous avez demandé la réinitialisation de votre mot de passe sur Timepulse.\n\nCliquez sur le lien suivant pour réinitialiser votre mot de passe :\n${resetLink}\n\nCe lien est valable pendant 1 heure. Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.\n\nCordialement,\nL'équipe Timepulse`,
    });
  }

  async sendCarpoolingNotification(
    email: string,
    name: string,
    eventName: string,
    driverName: string,
    departureCity: string
  ): Promise<EmailResponse> {
    return this.sendEmail({
      to: email,
      subject: `Nouvelle demande de co-voiturage - ${eventName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px; }
            .info-box { background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🚗 Nouvelle demande de co-voiturage</h1>
            </div>
            <div class="content">
              <p>Bonjour ${name},</p>
              <p><strong>${driverName}</strong> a réservé une place dans votre offre de co-voiturage pour l'événement <strong>${eventName}</strong>.</p>

              <div class="info-box">
                <p><strong>📍 Départ :</strong> ${departureCity}</p>
                <p><strong>👤 Passager :</strong> ${driverName}</p>
              </div>

              <p>Connectez-vous à votre espace pour gérer vos offres de co-voiturage et contacter votre passager.</p>

              <p>Bon trajet !<br>L'équipe Timepulse</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Timepulse - Tous droits réservés</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `Bonjour ${name},\n\n${driverName} a réservé une place dans votre offre de co-voiturage pour l'événement ${eventName}.\n\nDépart : ${departureCity}\nPassager : ${driverName}\n\nConnectez-vous à votre espace pour gérer vos offres de co-voiturage.\n\nBon trajet !\nL'équipe Timepulse`,
    });
  }
}

export const emailService = EmailService.getInstance();
