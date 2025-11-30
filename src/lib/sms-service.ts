/**
 * Service d'envoi SMS via Oxisms
 * Utilise l'Edge Function send-sms
 */

import { supabase } from './supabase';

export interface SMSTemplate {
  id: string;
  name: string;
  content: string;
  templateType: string;
}

export interface SMSStats {
  totalSent: number;
  delivered: number;
  failed: number;
  pending: number;
  totalCost: number;
  deliveryRate: number;
}

/**
 * Templates SMS prédéfinis
 */
export const SMS_TEMPLATES = {
  REGISTRATION_CONFIRMED: (firstName: string, raceName: string) =>
    `Bonjour ${firstName}, votre inscription à ${raceName} est confirmée ! Retrouvez vos infos sur timepulse.fr. À bientôt !`,

  REMINDER_1_DAY: (firstName: string, raceName: string, startTime: string) =>
    `Rappel: ${raceName} demain à ${startTime} ! Pensez à votre dossard. Bon courage ${firstName} !`,

  REMINDER_1_HOUR: (firstName: string, raceName: string) =>
    `${firstName}, la ${raceName} commence dans 1h ! Échauffez-vous bien. Bonne course !`,

  RESULT_READY: (firstName: string, raceName: string, rank: number, time: string) =>
    `Bravo ${firstName} ! Classement ${raceName}: ${rank}e en ${time}. Détails sur timepulse.fr`,

  BIB_ASSIGNED: (firstName: string, raceName: string, bibNumber: number, date: string) =>
    `${firstName}, votre dossard pour ${raceName} : N° ${bibNumber}. RDV le ${date} !`,

  WEATHER_ALERT: (firstName: string, raceName: string, weatherInfo: string) =>
    `Alerte météo ${raceName}: ${weatherInfo}. Préparez votre équipement en conséquence !`,

  EVENT_UPDATE: (firstName: string, raceName: string, updateMessage: string) =>
    `Info ${raceName}: ${updateMessage}. Consultez timepulse.fr pour plus de détails.`,
};

/**
 * Envoie un SMS unique
 */
export async function sendSMS(params: {
  phoneNumber: string;
  message: string;
  athleteId?: string;
  eventId?: string;
  raceId?: string;
  templateId?: string;
}): Promise<{
  success: boolean;
  smsLogId?: string;
  messageId?: string;
  cost?: number;
  error?: string;
}> {
  try {
    const { data, error } = await supabase.functions.invoke('send-sms', {
      body: params,
    });

    if (error) {
      console.error('SMS sending error:', error);
      return {
        success: false,
        error: error.message,
      };
    }

    return data;
  } catch (error) {
    console.error('SMS sending exception:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Envoie un SMS à partir d'un template
 */
export async function sendSMSFromTemplate(
  templateType: keyof typeof SMS_TEMPLATES,
  phoneNumber: string,
  variables: Record<string, any>,
  options?: {
    athleteId?: string;
    eventId?: string;
    raceId?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    // Générer le message depuis le template
    const template = SMS_TEMPLATES[templateType];
    const message = template(...Object.values(variables));

    return await sendSMS({
      phoneNumber,
      message,
      ...options,
    });
  } catch (error) {
    console.error('Error sending SMS from template:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Récupère les templates SMS d'un organisateur
 */
export async function getOrganizerSMSTemplates(organizerId: string): Promise<SMSTemplate[]> {
  const { data, error } = await supabase
    .from('sms_templates')
    .select('*')
    .eq('organizer_id', organizerId)
    .eq('is_active', true)
    .order('template_type');

  if (error) {
    console.error('Error fetching SMS templates:', error);
    return [];
  }

  return data.map(t => ({
    id: t.id,
    name: t.name,
    content: t.content,
    templateType: t.template_type,
  }));
}

/**
 * Crée un template SMS personnalisé
 */
export async function createSMSTemplate(params: {
  organizerId: string;
  name: string;
  content: string;
  templateType: string;
  description?: string;
}): Promise<{ success: boolean; templateId?: string; error?: string }> {
  const { data, error } = await supabase
    .from('sms_templates')
    .insert({
      organizer_id: params.organizerId,
      name: params.name,
      content: params.content,
      template_type: params.templateType,
      description: params.description,
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    return {
      success: false,
      error: error.message,
    };
  }

  return {
    success: true,
    templateId: data.id,
  };
}

/**
 * Récupère les statistiques SMS pour un événement
 */
export async function getSMSStats(eventId: string): Promise<SMSStats | null> {
  const { data, error } = await supabase.rpc('get_sms_stats', {
    p_event_id: eventId,
  });

  if (error) {
    console.error('Error fetching SMS stats:', error);
    return null;
  }

  return {
    totalSent: data.total_sent || 0,
    delivered: data.delivered || 0,
    failed: data.failed || 0,
    pending: data.pending || 0,
    totalCost: data.total_cost || 0,
    deliveryRate: data.delivery_rate || 0,
  };
}

/**
 * Récupère l'historique SMS d'un athlète
 */
export async function getAthleteSMSHistory(athleteId: string) {
  const { data, error } = await supabase
    .from('sms_logs')
    .select('*')
    .eq('athlete_id', athleteId)
    .order('sent_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('Error fetching SMS history:', error);
    return [];
  }

  return data;
}

/**
 * Récupère les SMS échoués récents
 */
export async function getFailedSMS() {
  const { data, error } = await supabase
    .from('sms_failed_needing_attention')
    .select('*')
    .limit(100);

  if (error) {
    console.error('Error fetching failed SMS:', error);
    return [];
  }

  return data;
}

/**
 * Crée une campagne SMS groupée
 */
export async function createSMSCampaign(params: {
  eventId: string;
  name: string;
  message: string;
  raceIds?: string[];
  segmentFilter?: Record<string, any>;
  scheduledFor?: Date;
}): Promise<{ success: boolean; campaignId?: string; error?: string }> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      error: 'Not authenticated',
    };
  }

  const { data, error } = await supabase
    .from('sms_campaigns')
    .insert({
      event_id: params.eventId,
      name: params.name,
      message: params.message,
      race_ids: params.raceIds,
      segment_filter: params.segmentFilter,
      scheduled_for: params.scheduledFor?.toISOString(),
      status: params.scheduledFor ? 'scheduled' : 'draft',
      created_by: user.id,
    })
    .select()
    .single();

  if (error) {
    return {
      success: false,
      error: error.message,
    };
  }

  return {
    success: true,
    campaignId: data.id,
  };
}

/**
 * Lance l'envoi d'une campagne SMS
 */
export async function sendSMSCampaign(campaignId: string): Promise<{
  success: boolean;
  sentCount?: number;
  error?: string;
}> {
  // Cette fonction devrait déclencher un job backend qui envoie les SMS en masse
  // Pour l'instant, retourner un placeholder
  console.warn('sendSMSCampaign: Not yet fully implemented - requires background job');

  return {
    success: false,
    error: 'Campaign sending requires background job implementation',
  };
}

/**
 * Valide un numéro de téléphone
 */
export function isValidPhoneNumber(phone: string): boolean {
  // Enlever espaces, tirets, etc.
  const clean = phone.replace(/[\s\-\.\(\)]/g, '');

  // Vérifier format français ou international
  return (
    /^0[1-9]\d{8}$/.test(clean) || // Format français: 0612345678
    /^\+33[1-9]\d{8}$/.test(clean) || // Format international FR: +33612345678
    /^\+\d{10,15}$/.test(clean) // Format international général
  );
}

/**
 * Formate un numéro de téléphone pour affichage
 */
export function formatPhoneNumber(phone: string): string {
  const clean = phone.replace(/[\s\-\.\(\)]/g, '');

  // Format français
  if (clean.startsWith('0') && clean.length === 10) {
    return clean.replace(/(\d{2})(?=\d)/g, '$1 ');
  }

  // Format international
  if (clean.startsWith('+33') && clean.length === 12) {
    return '+33 ' + clean.substring(3).replace(/(\d{1})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5');
  }

  return phone;
}

/**
 * Calcule le coût estimé d'un envoi SMS
 */
export function estimateSMSCost(recipientCount: number, costPerSMS: number = 0.05): number {
  return recipientCount * costPerSMS;
}

/**
 * Compte le nombre de SMS nécessaires pour un message (160 caractères = 1 SMS)
 */
export function countSMSSegments(message: string): number {
  const length = message.length;

  if (length === 0) return 0;
  if (length <= 160) return 1;
  if (length <= 306) return 2;
  if (length <= 459) return 3;

  return Math.ceil(length / 153); // Segments suivants: 153 caractères
}
