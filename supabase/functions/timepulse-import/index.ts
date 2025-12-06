import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface TimepulseAPIRequest {
  jsonrpc: "2.0";
  method: string;
  params: Record<string, any>;
  id: number;
}

interface TimepulseAPIResponse {
  jsonrpc: "2.0";
  result?: any;
  error?: {
    code: number;
    message: string;
  };
  id: number;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { action, id_epreuve } = await req.json();

    const TIMEPULSE_API_URL = Deno.env.get("TIMEPULSE_API_URL") || "https://timepulse.fr/ADMIN-timepulse-7438/tools/api-timepulse.php";
    const TIMEPULSE_API_TOKEN = Deno.env.get("TIMEPULSE_API_TOKEN");
    const TIMEPULSE_HTTP_USER = Deno.env.get("TIMEPULSE_HTTP_USER");
    const TIMEPULSE_HTTP_PASSWORD = Deno.env.get("TIMEPULSE_HTTP_PASSWORD");

    if (!TIMEPULSE_API_TOKEN) {
      throw new Error("TIMEPULSE_API_TOKEN not configured");
    }

    if (!TIMEPULSE_HTTP_USER || !TIMEPULSE_HTTP_PASSWORD) {
      throw new Error("TIMEPULSE_HTTP_USER and TIMEPULSE_HTTP_PASSWORD must be configured for HTTP Basic Auth");
    }

    const callTimepulseAPI = async (method: string, params: Record<string, any>): Promise<any> => {
      const request: TimepulseAPIRequest = {
        jsonrpc: "2.0",
        method,
        params: {
          ...params,
          token: TIMEPULSE_API_TOKEN,
        },
        id: 1,
      };

      const basicAuth = btoa(`${TIMEPULSE_HTTP_USER}:${TIMEPULSE_HTTP_PASSWORD}`);

      const response = await fetch(TIMEPULSE_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Basic ${basicAuth}`,
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Timepulse API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const responseText = await response.text();
      console.log("Raw API response:", responseText.substring(0, 500));

      let data: TimepulseAPIResponse;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        throw new Error(`Invalid JSON response from Timepulse API: ${responseText.substring(0, 200)}`);
      }

      if (data.error) {
        throw new Error(`Timepulse API error: ${data.error.message}`);
      }

      return data.result;
    };

    switch (action) {
      case "preview": {
        if (!id_epreuve) {
          throw new Error("id_epreuve is required");
        }

        const [epreuve, inscriptions, evenement] = await Promise.all([
          callTimepulseAPI("getEpreuve", { id_epreuve: parseInt(id_epreuve) }),
          callTimepulseAPI("listInscriptions", { id_epreuve: parseInt(id_epreuve) }),
          callTimepulseAPI("getEvenement", { id_evenement: 0 }),
        ]);

        if (epreuve && epreuve.id_event) {
          const eventDetails = await callTimepulseAPI("getEvenement", { id_evenement: epreuve.id_event });
          return new Response(
            JSON.stringify({
              success: true,
              data: {
                epreuve,
                evenement: eventDetails,
                inscriptions: inscriptions || [],
                stats: {
                  total: inscriptions?.length || 0,
                  paid: inscriptions?.filter((i: any) => i.payment_status === 'paid').length || 0,
                  paid_on_site: inscriptions?.filter((i: any) => i.payment_status === 'paid_on_site').length || 0,
                  unpaid: inscriptions?.filter((i: any) => i.payment_status === 'unpaid').length || 0,
                }
              }
            }),
            {
              headers: {
                ...corsHeaders,
                "Content-Type": "application/json",
              },
            }
          );
        }

        throw new Error("Épreuve non trouvée");
      }

      case "import": {
        if (!id_epreuve) {
          throw new Error("id_epreuve is required");
        }

        const body = await req.json();
        const { target_event_id, target_race_id } = body;

        if (!target_event_id || !target_race_id) {
          throw new Error("target_event_id and target_race_id are required");
        }
        const supabaseClient = createClient(
          Deno.env.get("SUPABASE_URL") ?? "",
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
          {
            global: {
              headers: { Authorization: req.headers.get("Authorization")! },
            },
          }
        );

        const inscriptions = await callTimepulseAPI("listInscriptions", {
          id_epreuve: parseInt(id_epreuve)
        });

        const paidInscriptions = inscriptions.filter((i: any) => i.payment_status === 'paid');

        let imported = 0;
        let skipped = 0;
        const errors: string[] = [];

        for (const inscription of paidInscriptions) {
          try {
            const { data: existingEntry, error: checkError } = await supabaseClient
              .from('entries')
              .select('id')
              .eq('race_id', target_race_id)
              .eq('email', inscription.email)
              .maybeSingle();

            if (checkError) {
              errors.push(`Erreur vérification ${inscription.email}: ${checkError.message}`);
              continue;
            }

            if (existingEntry) {
              skipped++;
              continue;
            }

            const birthDate = inscription.naissance ? new Date(inscription.naissance).toISOString().split('T')[0] : null;

            const { error: insertError } = await supabaseClient
              .from('entries')
              .insert({
                event_id: target_event_id,
                race_id: target_race_id,
                email: inscription.email,
                first_name: inscription.prenom,
                last_name: inscription.nom,
                gender: inscription.sexe === 'H' ? 'M' : inscription.sexe === 'F' ? 'F' : null,
                birth_date: birthDate,
                nationality: inscription.nationalite || 'FRA',
                phone: inscription.mobile || inscription.telephone,
                address: inscription.adresse,
                city: inscription.ville,
                postal_code: inscription.zip,
                license_number: inscription.num_licence,
                club: inscription.club,
                bib_number: inscription.num_dossard || null,
                amount: parseFloat(inscription.tarif_inscription) || 0,
                payment_status: 'paid',
                registration_date: inscription.date_inscription ? new Date(inscription.date_inscription).toISOString() : new Date().toISOString(),
              });

            if (insertError) {
              errors.push(`Erreur import ${inscription.email}: ${insertError.message}`);
            } else {
              imported++;
            }
          } catch (err: any) {
            errors.push(`Erreur ${inscription.email}: ${err.message}`);
          }
        }

        return new Response(
          JSON.stringify({
            success: true,
            message: `Import terminé: ${imported} importées, ${skipped} doublons ignorés`,
            data: {
              total: paidInscriptions.length,
              imported,
              skipped,
              errors: errors.length > 0 ? errors : undefined,
            },
          }),
          {
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          }
        );
      }

      case "test_connection": {
        const result = await callTimepulseAPI("listEvenements", {
          after_date_event: new Date().toISOString().split('T')[0]
        });

        return new Response(
          JSON.stringify({
            success: true,
            message: "Connexion réussie à l'API Timepulse.fr",
            events_count: result?.length || 0,
          }),
          {
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          }
        );
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    console.error("Timepulse Import Error:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});