import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface SendSMSRequest {
  athleteId?: string;
  phoneNumber: string;
  message: string;
  templateId?: string;
  eventId?: string;
  raceId?: string;
}

interface OxismsResponse {
  success: boolean;
  messageId?: string;
  cost?: number;
  error?: string;
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const oxismsApiKey = Deno.env.get('OXISMS_API_KEY');
    const oxismsSender = Deno.env.get('OXISMS_SENDER') || 'TIMEPULSE';

    if (!oxismsApiKey) {
      console.warn('OXISMS_API_KEY not configured, using mock mode');
    }

    // Créer client Supabase
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parser la requête
    const body: SendSMSRequest = await req.json();
    const { athleteId, phoneNumber, message, templateId, eventId, raceId } = body;

    // Valider les champs requis
    if (!phoneNumber || !message) {
      return new Response(
        JSON.stringify({ error: 'phoneNumber and message are required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Nettoyer le numéro de téléphone (format international)
    const cleanPhone = cleanPhoneNumber(phoneNumber);
    if (!isValidPhoneNumber(cleanPhone)) {
      return new Response(
        JSON.stringify({ error: 'Invalid phone number format' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Récupérer l'utilisateur authentifié
    const authHeader = req.headers.get('Authorization');
    let sentBy: string | null = null;

    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      sentBy = user?.id || null;
    }

    // Créer le log SMS (status: pending)
    const { data: smsLog, error: logError } = await supabase
      .from('sms_logs')
      .insert({
        athlete_id: athleteId,
        phone_number: cleanPhone,
        message,
        template_id: templateId,
        event_id: eventId,
        race_id: raceId,
        status: 'pending',
        sent_by: sentBy,
      })
      .select()
      .single();

    if (logError) {
      console.error('Error creating SMS log:', logError);
      return new Response(
        JSON.stringify({ error: 'Failed to create SMS log' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Envoyer le SMS via Oxisms
    let oxismsResult: OxismsResponse;

    if (!oxismsApiKey) {
      // Mode mock pour développement
      oxismsResult = await mockSendSMS(cleanPhone, message);
    } else {
      // Vrai envoi via Oxisms
      oxismsResult = await sendViaOxisms(
        oxismsApiKey,
        oxismsSender,
        cleanPhone,
        message
      );
    }

    // Mettre à jour le log avec le résultat
    const updateData: any = {
      status: oxismsResult.success ? 'sent' : 'failed',
      sent_at: new Date().toISOString(),
      provider_message_id: oxismsResult.messageId,
      provider_response: oxismsResult,
      cost_eur: oxismsResult.cost,
      error_message: oxismsResult.error,
    };

    await supabase
      .from('sms_logs')
      .update(updateData)
      .eq('id', smsLog.id);

    // Retourner la réponse
    return new Response(
      JSON.stringify({
        success: oxismsResult.success,
        smsLogId: smsLog.id,
        messageId: oxismsResult.messageId,
        cost: oxismsResult.cost,
        error: oxismsResult.error,
      }),
      {
        status: oxismsResult.success ? 200 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in send-sms function:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

/**
 * Envoie un SMS via l'API Oxisms
 */
async function sendViaOxisms(
  apiKey: string,
  sender: string,
  phoneNumber: string,
  message: string
): Promise<OxismsResponse> {
  try {
    const response = await fetch('https://api.oxisms.com/v2/sms/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sender,
        recipients: [phoneNumber],
        message,
        type: 'transactional', // SMS transactionnel (non marketing)
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Oxisms API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    return {
      success: true,
      messageId: data.message_id || data.id,
      cost: data.cost || 0.05, // Coût typique 0.05€ par SMS
    };

  } catch (error) {
    console.error('Oxisms API error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown Oxisms error',
    };
  }
}

/**
 * Mode mock pour développement (sans vraie API)
 */
async function mockSendSMS(
  phoneNumber: string,
  message: string
): Promise<OxismsResponse> {
  console.log('📱 MOCK SMS:', { phoneNumber, message });

  // Simuler un délai réseau
  await new Promise(resolve => setTimeout(resolve, 500));

  // 95% de succès en mock
  const success = Math.random() > 0.05;

  return {
    success,
    messageId: success ? `mock_${Date.now()}` : undefined,
    cost: 0.05,
    error: success ? undefined : 'Mock error: simulated failure',
  };
}

/**
 * Nettoie et formate un numéro de téléphone
 */
function cleanPhoneNumber(phone: string): string {
  // Enlever tous les espaces, tirets, points, parenthèses
  let clean = phone.replace(/[\s\-\.\(\)]/g, '');

  // Ajouter +33 si commence par 0 (France)
  if (clean.startsWith('0')) {
    clean = '+33' + clean.substring(1);
  }

  // Ajouter + si manquant
  if (!clean.startsWith('+')) {
    clean = '+' + clean;
  }

  return clean;
}

/**
 * Valide un numéro de téléphone international
 */
function isValidPhoneNumber(phone: string): boolean {
  // Format international: +33XXXXXXXXX ou +XXX...
  return /^\+\d{10,15}$/.test(phone);
}
