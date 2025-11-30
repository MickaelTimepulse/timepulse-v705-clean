import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface EmailPayload {
  to: string | string[];
  from?: string;
  fromName?: string;
  subject?: string;
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
  type?: string;
  data?: Record<string, any>;
}

function replaceVariables(template: string, data: Record<string, any>): string {
  let result = template;
  for (const [key, value] of Object.entries(data)) {
    const regex = new RegExp(`{{${key}}}`, 'g');
    result = result.replace(regex, String(value || ''));
  }
  return result;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );

  let logId: string | null = null;

  try {
    console.log('🔍 [EDGE FUNCTION] Starting send-email process...');

    const payload: EmailPayload = await req.json();

    // If using template
    if (payload.type && payload.data) {
      console.log('📧 [EDGE FUNCTION] Using template:', payload.type);

      const { data: template, error: templateError } = await supabase
        .from("email_templates")
        .select("*")
        .eq("template_key", payload.type)
        .eq("is_active", true)
        .single();

      if (templateError || !template) {
        console.error('❌ [EDGE FUNCTION] Template not found:', payload.type);
        throw new Error(`Email template '${payload.type}' not found`);
      }

      // Replace variables in template
      payload.subject = replaceVariables(template.subject, payload.data);
      payload.html = replaceVariables(template.html_body, payload.data);
      if (template.text_body) {
        payload.text = replaceVariables(template.text_body, payload.data);
      }

      console.log('✅ [EDGE FUNCTION] Template processed successfully');
    }

    // Load Oximailing settings from database
    const { data: settings, error: settingsError } = await supabase
      .from("settings")
      .select("key, value")
      .in("key", [
        "oximailing_api_user",
        "oximailing_api_password",
        "oximailing_default_from",
        "oximailing_default_from_name"
      ]);

    if (settingsError) {
      console.error('❌ [EDGE FUNCTION] Error loading settings:', settingsError);
      throw new Error("Failed to load email configuration");
    }

    const settingsMap = settings?.reduce((acc, s) => {
      acc[s.key] = s.value;
      return acc;
    }, {} as Record<string, string>) || {};

    const apiUser = settingsMap.oximailing_api_user;
    const apiPassword = settingsMap.oximailing_api_password;
    const defaultFromEmail = settingsMap.oximailing_default_from || "noreply@timepulse.fr";
    const defaultFromName = settingsMap.oximailing_default_from_name || "Timepulse";

    console.log('🔑 [EDGE FUNCTION] API User configured:', !!apiUser);
    console.log('🔑 [EDGE FUNCTION] API Password configured:', !!apiPassword);
    console.log('📧 [EDGE FUNCTION] Default From:', defaultFromEmail);
    console.log('👤 [EDGE FUNCTION] Default From Name:', defaultFromName);

    if (!apiUser || !apiPassword) {
      console.error('❌ [EDGE FUNCTION] Missing OxiMailing credentials');
      throw new Error("OxiMailing API credentials not configured. Please configure them in Admin Settings.");
    }

    console.log('📧 [EDGE FUNCTION] Recipient:', payload.to);
    console.log('📝 [EDGE FUNCTION] Subject:', payload.subject);

    if (!payload.to || !payload.subject) {
      console.error('❌ [EDGE FUNCTION] Missing required fields');
      return new Response(
        JSON.stringify({ error: "Missing required fields: to, subject" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const recipients = Array.isArray(payload.to) ? payload.to : [payload.to];
    const fromEmail = payload.from || defaultFromEmail;

    // Create initial log entry
    const { data: logData, error: logError } = await supabase
      .from("email_logs")
      .insert({
        to_email: recipients[0],
        from_email: fromEmail,
        subject: payload.subject,
        status: "pending",
        metadata: payload.metadata,
      })
      .select()
      .single();

    if (!logError && logData) {
      logId = logData.id;
    }

    // Based on official Oximailing API documentation
    // The payload must have three sections: Options, Message, and Recipients
    const oxiMailingPayload: any = {
      Message: {
        From: fromEmail,
        FromName: payload.fromName || defaultFromName,
        Subject: payload.subject,
        Format: payload.html ? "html" : "txt"
      },
      Recipients: recipients.map((email) => ({ Email: email })),
      Options: {
        TrackEmails: true
      }
    };

    // Add HTML or Text message
    if (payload.html) {
      oxiMailingPayload.Message.HTML = payload.html;
      console.log('📝 [EDGE FUNCTION] HTML content length:', payload.html.length);
    } else if (payload.text) {
      oxiMailingPayload.Message.Text = payload.text;
      console.log('📝 [EDGE FUNCTION] Text content length:', payload.text.length);
    } else {
      // If neither html nor text is provided, use subject as message
      console.warn('⚠️ [EDGE FUNCTION] No content provided, using default text');
      oxiMailingPayload.Message.Text = payload.subject;
      oxiMailingPayload.Message.Format = "txt";
    }

    // Add optional fields to Options
    if (payload.replyTo) {
      oxiMailingPayload.Options.ReplyTo = payload.replyTo;
    }

    if (payload.cc) {
      oxiMailingPayload.Options.CC = payload.cc;
    }

    if (payload.bcc) {
      oxiMailingPayload.Options.BCC = payload.bcc;
    }

    if (payload.scheduledAt) {
      oxiMailingPayload.Options.ScheduledDateTime = payload.scheduledAt;
    }

    if (payload.metadata?.campaignName) {
      oxiMailingPayload.Options.CampaignName = payload.metadata.campaignName;
    }

    if (payload.attachments) {
      oxiMailingPayload.Message.Attachments = payload.attachments;
    }

    const basicAuth = btoa(`${apiUser}:${apiPassword}`);

    console.log('🌐 [EDGE FUNCTION] Calling OxiMailing API...');
    console.log('📤 [EDGE FUNCTION] Payload:', JSON.stringify(oxiMailingPayload, null, 2));

    const response = await fetch("https://api.oximailing.com/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${basicAuth}`,
      },
      body: JSON.stringify(oxiMailingPayload),
    });

    console.log('📥 [EDGE FUNCTION] OxiMailing response status:', response.status);

    const responseData = await response.json();
    console.log('📦 [EDGE FUNCTION] OxiMailing response data:', JSON.stringify(responseData, null, 2));

    if (!response.ok) {
      console.error("❌ [EDGE FUNCTION] OxiMailing API error:", responseData);

      // Update log with error
      if (logId) {
        await supabase
          .from("email_logs")
          .update({
            status: "failed",
            error_message: JSON.stringify(responseData),
            sent_at: new Date().toISOString(),
          })
          .eq("id", logId);
      }

      return new Response(
        JSON.stringify({
          error: "Failed to send email",
          details: responseData,
        }),
        {
          status: response.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Update log with success
    if (logId) {
      await supabase
        .from("email_logs")
        .update({
          status: "success",
          message_id: responseData.SendingId || responseData.id,
          sent_at: new Date().toISOString(),
        })
        .eq("id", logId);
    }

    console.log('✅ [EDGE FUNCTION] Email sent successfully!');

    return new Response(
      JSON.stringify({
        success: true,
        messageId: responseData.SendingId || responseData.id,
        data: responseData,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("💥 [EDGE FUNCTION] Exception caught:", error);
    console.error("💥 [EDGE FUNCTION] Error type:", error instanceof Error ? 'Error' : typeof error);
    console.error("💥 [EDGE FUNCTION] Error message:", error instanceof Error ? error.message : "Unknown error");

    // Update log with error
    if (logId) {
      await supabase
        .from("email_logs")
        .update({
          status: "failed",
          error_message: error instanceof Error ? error.message : "Unknown error",
          sent_at: new Date().toISOString(),
        })
        .eq("id", logId);
    }

    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
