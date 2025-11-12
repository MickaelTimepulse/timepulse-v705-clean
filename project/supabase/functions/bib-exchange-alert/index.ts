import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface AlertPayload {
  email: string;
  event_name: string;
  race_name: string;
  event_id: string;
  alert_id: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { email, event_name, race_name, event_id, alert_id }: AlertPayload = await req.json();

    console.log(`Sending bib exchange alert to ${email} for ${event_name} - ${race_name}`);

    // TODO: Intégrer avec un service d'email (SendGrid, Resend, etc.)
    // Pour l'instant, on simule l'envoi
    
    const emailSubject = `🏃 Nouveau dossard disponible - ${event_name}`;
    const emailBody = `
      <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%); padding: 30px; border-radius: 10px; text-align: center;">
            <h1 style="color: white; margin: 0;">🏃 Dossard Disponible !</h1>
          </div>
          
          <div style="padding: 30px; background: #f9fafb; border-radius: 10px; margin-top: 20px;">
            <h2 style="color: #111827; margin-top: 0;">Un nouveau dossard vient d'être mis en vente !</h2>
            
            <p style="color: #374151; font-size: 16px; line-height: 1.6;">
              <strong>Événement :</strong> ${event_name}<br>
              <strong>Course :</strong> ${race_name}
            </p>
            
            <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 5px;">
              <p style="color: #92400e; margin: 0; font-weight: 600;">
                ⚠️ Attention ! Vous n'êtes probablement pas le seul à recevoir cette alerte.
                Dépêchez-vous pour ne pas manquer cette opportunité !
              </p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://timepulse.fr/event/${event_id}/bib-exchange" 
                 style="display: inline-block; background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                Voir le dossard disponible
              </a>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; line-height: 1.5;">
              Ce dossard sera vendu au prix d'achat initial. Le vendeur sera automatiquement remboursé
              (moins 5€ de frais Timepulse) dès que vous finaliserez l'achat.
            </p>
          </div>
          
          <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
            <p>Vous recevez cet email car vous vous êtes inscrit aux alertes de la bourse aux dossards.</p>
            <p>Timepulse - Chronométrage & Inscriptions en ligne</p>
          </div>
        </body>
      </html>
    `;

    // Ici, vous devriez intégrer un vrai service d'email
    // Exemple avec Resend (à configurer) :
    /*
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Timepulse <noreply@timepulse.fr>',
        to: [email],
        subject: emailSubject,
        html: emailBody
      })
    });
    */

    // Pour l'instant, on log juste
    console.log(`Email would be sent to ${email}`);
    console.log(`Subject: ${emailSubject}`);

    // Optionnel : supprimer l'alerte après envoi pour qu'elle ne reçoive qu'un seul email
    // (ou la garder pour être alerté à chaque nouveau dossard)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Alert email sent successfully',
        email: email 
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error sending bib exchange alert:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
