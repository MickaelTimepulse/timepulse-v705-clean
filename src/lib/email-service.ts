import { supabase } from './supabase';
import {
  generateRegistrationConfirmationTemplate,
  generateWelcomeTemplate,
  generatePasswordResetTemplate,
  generateCarpoolingNotificationTemplate,
  generateSimpleConfirmationTemplate,
} from './email-templates';

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
  ppsNumber?: string;
  ppsExpiryDate?: string;
  requiresPSPUpdate?: boolean;
  requiresPPSUpdate?: boolean;
  amount?: number;
  paymentStatus: string;
  organizerName: string;
  organizerEmail?: string;
  // Champs pour inscription de groupe
  isGroupRegistration?: boolean;
  registrantName?: string;
  registrantEmail?: string;
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
    return generateRegistrationConfirmationTemplate({
      athleteFirstName: data.athleteFirstName,
      athleteLastName: data.athleteLastName,
      eventName: data.eventName,
      raceName: data.raceName,
      raceDate: data.raceDate,
      bibNumber: data.bibNumber,
      managementCode: data.managementCode,
      licenseType: data.licenseType,
      amount: data.amount,
      organizerName: data.organizerName,
      organizerEmail: data.organizerEmail,
      registrationStatus: data.registrationStatus,
      statusMessage: data.statusMessage,
      requiresPSPUpdate: data.requiresPSPUpdate,
      pspExpiryDate: data.pspExpiryDate,
      isGroupRegistration: data.isGroupRegistration,
      registrantName: data.registrantName,
      registrantEmail: data.registrantEmail,
    });
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
    const homeUrl = window.location.origin;
    return this.sendEmail({
      to: email,
      subject: 'Bienvenue sur Timepulse',
      html: generateWelcomeTemplate(name, homeUrl),
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
      html: generateSimpleConfirmationTemplate({
        name,
        eventName,
        raceName,
        bibNumber,
      }),
      text: `Bonjour ${name},\n\nVotre inscription a été confirmée avec succès.\n\nÉvénement : ${eventName}\nÉpreuve : ${raceName}${bibNumber ? `\nDossard : ${bibNumber}` : ''}\n\nNous vous souhaitons une excellente préparation et un très bon événement !\n\nSportivement,\nL'équipe Timepulse`,
    });
  }

  async sendPasswordResetEmail(email: string, resetLink: string): Promise<EmailResponse> {
    return this.sendEmail({
      to: email,
      subject: 'Réinitialisation de votre mot de passe - Timepulse',
      html: generatePasswordResetTemplate(resetLink),
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
      html: generateCarpoolingNotificationTemplate({
        driverName: name,
        passengerName: driverName,
        eventName,
        departureCity,
        availableSeats: 0, // Vous pouvez ajouter ce paramètre si disponible
      }),
      text: `Bonjour ${name},\n\n${driverName} a réservé une place dans votre offre de co-voiturage pour l'événement ${eventName}.\n\nDépart : ${departureCity}\nPassager : ${driverName}\n\nConnectez-vous à votre espace pour gérer vos offres de co-voiturage.\n\nBon trajet !\nL'équipe Timepulse`,
    });
  }
}

export const emailService = EmailService.getInstance();
