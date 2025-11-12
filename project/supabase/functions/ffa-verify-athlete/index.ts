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
    console.log('[FFA Verify] RAW BODY RECEIVED:', JSON.stringify(body));

    const { uid, mdp, numrel, nom, prenom, sexe, date_nai, cnil_web, cmpcod, cmpdate } = body;

    console.log('[FFA Verify] Extracted data:', { uid, numrel, nom, prenom, sexe, date_nai, cmpcod, cmpdate });
    console.log('[FFA Verify] nom:', nom, 'type:', typeof nom);
    console.log('[FFA Verify] prenom:', prenom, 'type:', typeof prenom);

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

    console.log('[FFA Verify] Will send to FFA - NOM:', finalNom, 'PRENOM:', finalPrenom);

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

    console.log('[FFA Verify] SOAP Envelope:', soapEnvelope.substring(0, 800));

    const response = await fetch(FFA_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': `"${SOAP_ACTION}"`,
      },
      body: soapEnvelope,
    });

    console.log('[FFA Verify] FFA Response status:', response.status);

    const responseText = await response.text();
    console.log('[FFA Verify] FFA Response:', responseText.substring(0, 500));

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
    console.log('[FFA Verify] CSV Result:', csvResult);

    const fields = csvResult.split(',');
    console.log('[FFA Verify] NOMBRE DE CHAMPS:', fields.length);
    console.log('[FFA Verify] All fields:', fields);

    console.log('[FFA Verify] CHAMPS DÉTAILLÉS:');
    console.log('  [0] INFOFLG:', fields[0]);
    console.log('  [1] RELFLG:', fields[1]);
    console.log('  [2] MUTFLG:', fields[2]);
    console.log('  [3] PPSFLG:', fields[3]);
    console.log('  [4] CMPCOD:', fields[4]);
    console.log('  [5] ID_ACT_EXT:', fields[5]);
    console.log('  [6] ID_CMP_EXT:', fields[6]);
    console.log('  [7] NUMREL:', fields[7]);
    console.log('  [8] NOM:', fields[8]);
    console.log('  [9] PRENOM:', fields[9]);
    console.log(' [10] SEXE:', fields[10]);
    console.log(' [11] DATE_NAI:', fields[11]);
    console.log(' [12] NATCOD:', fields[12]);
    console.log(' [13] RELCOD:', fields[13]);
    console.log(' [14] DFINREL:', fields[14]);
    console.log(' [15] CATCOD:', fields[15]);
    console.log(' [16] STRCODNUM_CLU:', fields[16]);
    console.log(' [17] STRNOMABR_CLU:', fields[17]);
    console.log(' [18] STRNOM_CLU:', fields[18]);
    console.log(' [19] STRCODNUM_CLUM:', fields[19]);
    console.log(' [20] STRNOMABR_CLUM:', fields[20]);
    console.log(' [21] STRNOM_CLUM:', fields[21]);
    console.log(' [22] STRCODNUM_CLUE:', fields[22]);
    console.log(' [23] STRNOMABR_CLUE:', fields[23]);
    console.log(' [24] STRNOM_CLUE:', fields[24]);
    console.log(' [25] STRNOMABR_DEP:', fields[25]);
    console.log(' [26] STRNOMABR_LIG:', fields[26]);
    console.log(' [27] MSG_RETOUR:', fields[27]);

    const clubNumero = fields[16] || '';
    const clubNomAbrege = fields[17] || '';
    const clubNomComplet = fields[18] || '';

    console.log('[FFA Verify] CLUB - Numero:', clubNumero);
    console.log('[FFA Verify] CLUB - Nom abrégé:', clubNomAbrege);
    console.log('[FFA Verify] CLUB - Nom complet:', clubNomComplet);

    const clubFinal = clubNomComplet || clubNomAbrege || (clubNumero ? `Club ${clubNumero}` : '');
    console.log('[FFA Verify] CLUB FINAL:', clubFinal);

    const parsed = {
      infoflg: fields[0],
      relflg: fields[1],
      mutflg: fields[2],
      ppsflg: fields[3],
      numrel: fields[7],
      nom: fields[8],
      prenom: fields[9],
      sexe: fields[10],
      date_nai: fields[11],
      natcod: fields[12],
      relcod: fields[13],
      dfinrel: fields[14],
      catcod: fields[15],
      strcodnum_clu: clubNumero,
      strnomabr_clu: clubNomAbrege,
      strnom_clu: clubNomComplet,
      club_final: clubFinal,
      strnomabr_dep: fields[25],
      strnomabr_lig: fields[26],
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
              sexe: parsed.sexe,
              date_nai: parsed.date_nai,
              natcod: parsed.natcod,
              relcod: parsed.relcod,
              dfinrel: parsed.dfinrel,
              pps_expiry: parsed.dfinrel,
              license_expiry: parsed.dfinrel,
              catcod: parsed.catcod,
              club_numero: parsed.strcodnum_clu,
              club_abrege: parsed.strnomabr_clu,
              club_complet: parsed.strnom_clu,
              club: parsed.club_final,
              departement: parsed.strnomabr_dep,
              ligue: parsed.strnomabr_lig,
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
    console.error('[FFA Verify] Error:', error);

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