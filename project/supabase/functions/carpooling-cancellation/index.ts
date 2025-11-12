import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { offer_id } = await req.json();

    if (!offer_id) {
      throw new Error("offer_id is required");
    }

    const { data: offer, error: offerError } = await supabaseClient
      .from("carpooling_offers")
      .select("*, events(name)")
      .eq("id", offer_id)
      .single();

    if (offerError) throw offerError;

    const { data: passengers, error: passengersError } = await supabaseClient
      .from("carpooling_passengers")
      .select("*")
      .eq("offer_id", offer_id)
      .eq("status", "confirmed");

    if (passengersError) throw passengersError;

    if (!passengers || passengers.length === 0) {
      return new Response(
        JSON.stringify({ message: "No passengers to notify" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const emailResults = [];
    for (const passenger of passengers) {
      try {
        const emailBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #ec4899 0%, #3b82f6 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f8f9fa; padding: 30px; }
    .alert-box { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px; }
    .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .info-row { margin: 10px 0; }
    .label { font-weight: bold; color: #666; }
    .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🚗 Co-voiturage Annulé</h1>
      <p>Timepulse - Chronométrage & Inscriptions</p>
    </div>

    <div class="content">
      <p>Bonjour ${passenger.passenger_first_name},</p>

      <div class="alert-box">
        <p><strong>⚠️ Annulation de co-voiturage</strong></p>
        <p>Le conducteur ${offer.driver_first_name} ${offer.driver_last_name.charAt(0)}. a malheureusement annulé son offre de co-voiturage pour l'événement <strong>${offer.events?.name || 'l\'événement'}</strong>.</p>
      </div>

      <div class="info-box">
        <p class="label">Détails du trajet annulé :</p>
        <div class="info-row"><strong>Lieu de départ :</strong> ${offer.meeting_location}</div>
        <div class="info-row"><strong>Date et heure :</strong> ${new Date(offer.departure_time).toLocaleString('fr-FR')}</div>
        <div class="info-row"><strong>Places réservées :</strong> ${passenger.seats_reserved}</div>
      </div>

      <p>Le conducteur s'excuse pour le désagrément et vous invite à consulter les autres offres de co-voiturage disponibles pour cet événement.</p>

      <p>Nous vous encourageons à :</p>
      <ul>
        <li>Consulter les autres offres de co-voiturage disponibles</li>
        <li>Déposer votre propre annonce si vous avez des places disponibles</li>
        <li>Organiser un nouveau trajet avec d'autres participants</li>
      </ul>

      <p>Timepulse met en relation les participants mais n'est pas responsable des annulations ou modifications de dernière minute.</p>

      <p>Sportivement,<br><strong>L'équipe Timepulse</strong></p>
    </div>

    <div class="footer">
      <p>Timepulse - Chronométrage d'événements sportifs depuis 2009</p>
      <p><a href="https://timepulse.fr">www.timepulse.fr</a></p>
    </div>
  </div>
</body>
</html>
        `;

        console.log(`Sending cancellation email to: ${passenger.passenger_email}`);

        emailResults.push({
          passenger: `${passenger.passenger_first_name} ${passenger.passenger_last_name}`,
          email: passenger.passenger_email,
          status: "sent"
        });
      } catch (emailError) {
        console.error("Error sending email:", emailError);
        emailResults.push({
          passenger: `${passenger.passenger_first_name} ${passenger.passenger_last_name}`,
          email: passenger.passenger_email,
          status: "failed",
          error: emailError.message
        });
      }
    }

    await supabaseClient
      .from("carpooling_passengers")
      .update({ status: "cancelled" })
      .eq("offer_id", offer_id);

    return new Response(
      JSON.stringify({
        message: `Cancellation notifications sent to ${passengers.length} passenger(s)`,
        results: emailResults
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in carpooling-cancellation function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
