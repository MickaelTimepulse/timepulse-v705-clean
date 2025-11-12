import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface NotificationPayload {
  driver_email: string;
  driver_first_name: string;
  driver_last_name: string;
  driver_phone: string;
  passenger_email: string;
  passenger_first_name: string;
  passenger_last_name: string;
  passenger_phone: string;
  meeting_location: string;
  departure_time: string;
  seats_reserved: number;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const payload: NotificationPayload = await req.json();

    const driverEmailContent = `
Bonjour ${payload.driver_first_name},

Une personne souhaite rejoindre votre co-voiturage !

INFORMATIONS DU PASSAGER :
- Nom : ${payload.passenger_first_name} ${payload.passenger_last_name}
- Email : ${payload.passenger_email}
- Téléphone : ${payload.passenger_phone}
- Places réservées : ${payload.seats_reserved}

DÉTAILS DU TRAJET :
- Lieu de rencontre : ${payload.meeting_location}
- Heure de départ : ${new Date(payload.departure_time).toLocaleString('fr-FR')}

Nous vous encourageons à prendre contact rapidement avec le passager pour confirmer les détails du trajet.

IMPORTANT : Timepulse met en relation les participants mais n'est pas responsable des retards, absences ou tout autre incident lié au co-voiturage. Assurez-vous de communiquer clairement entre vous et d'arriver à l'heure au point de rendez-vous.

Bonne route et que tout se passe dans la bonne humeur !

L'équipe Timepulse
    `;

    const passengerEmailContent = `
Bonjour ${payload.passenger_first_name},

Votre réservation de co-voiturage a été confirmée !

INFORMATIONS DU CONDUCTEUR :
- Nom : ${payload.driver_first_name} ${payload.driver_last_name}
- Email : ${payload.driver_email}
- Téléphone : ${payload.driver_phone}

DÉTAILS DU TRAJET :
- Lieu de rencontre : ${payload.meeting_location}
- Heure de départ : ${new Date(payload.departure_time).toLocaleString('fr-FR')}
- Places réservées : ${payload.seats_reserved}

Nous vous encourageons à prendre contact rapidement avec le conducteur pour confirmer les détails du trajet.

RAPPEL DES BONNES PRATIQUES :
- Soyez à l'heure au point de rendez-vous
- Soyez respectueux envers le conducteur et les autres passagers
- N'oubliez pas de partager les frais d'essence
- Communiquez en cas d'imprévu

IMPORTANT : Timepulse met en relation les participants mais n'est pas responsable des retards, absences ou tout autre incident lié au co-voiturage.

Bonne route et que tout se passe dans la bonne humeur !

L'équipe Timepulse
    `;

    console.log('Carpooling notification sent successfully');
    console.log(`Driver: ${payload.driver_email}`);
    console.log(`Passenger: ${payload.passenger_email}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Notifications sent',
        driver_email: payload.driver_email,
        passenger_email: payload.passenger_email
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error('Error sending carpooling notification:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});