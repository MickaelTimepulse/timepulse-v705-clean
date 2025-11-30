const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

const FFA_API_URL = 'http://webservicesffa.athle.fr/St_Chrono/STCHRONO.asmx';
const SOAP_ACTION = 'http://tempuri.org/STCHRONO_V2';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const body = await req.json();
    console.log('[FFA Test] RAW BODY RECEIVED:', JSON.stringify(body));

    const { uid, mdp, numrel, nom, prenom, sexe, date_nai, cnil_web, cmpcod, cmpdate } = body;

    console.log('[FFA Test] Received request data:', { uid, numrel, nom, prenom, sexe, date_nai, cmpcod, cmpdate });
    console.log('[FFA Test] nom value:', nom, 'type:', typeof nom);
    console.log('[FFA Test] prenom value:', prenom, 'type:', typeof prenom);

    if (!uid || !mdp) {
      return new Response(
        JSON.stringify({
          connected: false,
          message: 'Identifiants FFA manquants',
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const escapeXml = (str: string) => {
      if (!str) return '';
      return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
    };

    const finalNom = nom || 'TEST';
    const finalPrenom = prenom || 'TEST';

    console.log('[FFA Test] Final values - NOM:', finalNom, 'PRENOM:', finalPrenom);

    const soapEnvelope = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <STCHRONO_V2 xmlns="http://tempuri.org/">
      <UID>${escapeXml(uid)}</UID>
      <MDP>${escapeXml(mdp)}</MDP>
      <NUMREL>${escapeXml(numrel || '')}</NUMREL>
      <NOM>${escapeXml(finalNom)}</NOM>
      <PRENOM>${escapeXml(finalPrenom)}</PRENOM>
      <SEXE>${escapeXml(sexe || 'M')}</SEXE>
      <DATENAI>${escapeXml(date_nai || '1991')}</DATENAI>
      <CNIL_WEB>${escapeXml(cnil_web || 'O')}</CNIL_WEB>
      <CMPCOD>${escapeXml(cmpcod || '000000')}</CMPCOD>
      <CMPDATE>${escapeXml(cmpdate || '01/01/1900')}</CMPDATE>
      <ID_ACT_EXT>TEST</ID_ACT_EXT>
      <ID_CMP_EXT>TEST</ID_CMP_EXT>
    </STCHRONO_V2>
  </soap:Body>
</soap:Envelope>`;

    console.log('[FFA Test] SOAP Envelope (first 800 chars):', soapEnvelope.substring(0, 800));
    console.log('[FFA Test] Calling FFA API with UID:', uid);

    const response = await fetch(FFA_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': `"${SOAP_ACTION}"`,
      },
      body: soapEnvelope,
    });

    console.log('[FFA Test] Response status:', response.status);

    const responseText = await response.text();
    console.log('[FFA Test] Response (first 500 chars):', responseText.substring(0, 500));

    const resultMatch = responseText.match(/<STCHRONO_V2Result>([^<]+)<\/STCHRONO_V2Result>/);

    if (!resultMatch) {
      const faultMatch = responseText.match(/<faultstring>([^<]+)<\/faultstring>/);
      if (faultMatch) {
        return new Response(
          JSON.stringify({
            connected: false,
            message: `Erreur SOAP: ${faultMatch[1]}`,
            details: {
              soap_error: faultMatch[1],
              response_snippet: responseText.substring(0, 500)
            },
          }),
          {
            status: 200,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
            },
          }
        );
      }

      return new Response(
        JSON.stringify({
          connected: false,
          message: 'Format de réponse FFA invalide',
          details: {
            response_snippet: responseText.substring(0, 500)
          },
        }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const csvResult = resultMatch[1];
    console.log('[FFA Test] CSV Result COMPLET:', csvResult);

    const fields = csvResult.split(',');
    console.log('[FFA Test] Nombre de champs:', fields.length);
    console.log('[FFA Test] Tous les champs:', fields);

    const clubNumero = fields[16] || '';
    const clubNomAbrege = fields[17] || '';
    const clubNomComplet = fields[18] || '';
    console.log('[FFA Test] Club info - Index 16 (Numero):', clubNumero);
    console.log('[FFA Test] Club info - Index 17 (Abrege):', clubNomAbrege);
    console.log('[FFA Test] Club info - Index 18 (Complet):', clubNomComplet);

    const clubFinal = clubNomComplet || clubNomAbrege || (clubNumero ? `Club ${clubNumero}` : '');

    const parsed = {
      infoflg: fields[0],
      relflg: fields[1],
      mutflg: fields[2],
      ppsflg: fields[3],
      numrel: fields[7],
      nom: fields[8],
      prenom: fields[9],
      strnom_clu: clubFinal,
      msg_retour: fields[27] || 'OK',
    };

    const isSuccess =
      parsed.msg_retour === 'OK' ||
      parsed.infoflg === 'O' ||
      (!parsed.msg_retour.includes('PROx011') &&
       !parsed.msg_retour.includes('PROx012') &&
       !parsed.msg_retour.includes('PROx014'));

    if (parsed.msg_retour.includes('PROx014')) {
      return new Response(
        JSON.stringify({
          connected: false,
          error_code: 'PROx014',
          message: "Cet événement n'est pas déclaré comme une compétition FFA officielle",
          details: {
            uid,
            csv_raw: csvResult,
            msg_retour: parsed.msg_retour,
            hint: "Pour utiliser la vérification FFA, l'événement doit être déclaré auprès de la FFA avec un numéro d'événement valide. Sinon, les participants peuvent remplir leurs informations manuellement."
          },
        }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    if (isSuccess) {
      return new Response(
        JSON.stringify({
          connected: true,
          message: 'Connexion FFA réussie !',
          details: {
            uid,
            csv_raw: csvResult,
            all_fields: fields,
            test_athlete: {
              numrel: parsed.numrel,
              nom: parsed.nom,
              prenom: parsed.prenom,
              club: parsed.strnom_clu,
            },
            flags: {
              info_exact: parsed.infoflg === 'O',
              relation_valide: parsed.relflg === 'O',
              mute: parsed.mutflg === 'O',
              pps_requis: parsed.ppsflg === 'O',
            },
            msg_retour: parsed.msg_retour,
          },
        }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    } else {
      return new Response(
        JSON.stringify({
          connected: false,
          message: `Échec de connexion: ${parsed.msg_retour}`,
          details: {
            uid,
            msg_retour: parsed.msg_retour,
            hint: parsed.msg_retour.includes('PROx011')
              ? 'Identifiants SIFFA invalides. Vérifiez votre UID et mot de passe.'
              : parsed.msg_retour.includes('PROx012')
              ? 'Service bloqué par la FFA. Contactez dsi@athle.fr'
              : 'Erreur lors de la vérification',
          },
        }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

  } catch (error) {
    console.error('[FFA Test] Error:', error);

    return new Response(
      JSON.stringify({
        connected: false,
        message: `Erreur: ${error.message}`,
        details: {
          error: error.message,
          stack: error.stack,
        },
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