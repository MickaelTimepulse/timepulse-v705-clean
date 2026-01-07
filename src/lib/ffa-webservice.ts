/**
 * Service d'intégration Webservice FFA (Fédération Française d'Athlétisme)
 * Documentation officielle fournie par la FFA pour sociétés de chronométrage/inscription
 *
 * IMPORTANT:
 * - Nécessite des identifiants SIFFA (UID/MDP)
 * - L'utilisateur doit être référencé dans le SIFFA comme acteur de la société de chronométrage
 * - La société doit être affectée à la compétition dans CALORG/SIFFA
 *
 * Contact FFA: informatique@athle.fr
 */

import { supabase } from './supabase';

/**
 * Format d'entrée du webservice FFA
 */
interface FFAWebserviceRequest {
  uid: string;                    // Identifiant SIFFA
  mdp: string;                    // Mot de passe SIFFA
  numrel?: string;                // Numéro de relation (licence/TP/CF) - optionnel
  nom: string;                    // Nom
  prenom: string;                 // Prénom
  sexe: 'M' | 'F';               // Sexe
  date_nai: string;              // Date naissance (DD/MM/YYYY ou YYYY)
  cnil_web: 'O' | 'N';           // Accepte résultats en ligne (O=Oui, N=Non)
  cmpcod: string;                // Code SIFFA de la compétition (CalOrg code)
  cmpdate: string;               // Date de la compétition (DD/MM/YYYY)
  id_act_ext?: string;           // ID acteur interne (optionnel)
  id_cmp_ext?: string;           // ID compétition interne (optionnel)
}

/**
 * Format de sortie du webservice FFA
 */
interface FFAWebserviceResponse {
  // Flags principaux
  infoflg: 'O' | 'N';            // Informations exactes (O=Oui, N=Non)
  relflg: 'O' | 'N';             // Relation valide (O=Oui, N=Non)
  mutflg: 'O' | 'N';             // Athlète muté (O=Oui, N=Non)
  pspflg: 'O' | 'N';             // PSP requis (O=Oui, N=Non)

  // Identifiants
  cmpcod: string;
  id_act_ext: string;
  id_cmp_ext: string;
  numrel: string;                // Numéro de relation trouvé

  // Identité
  nom: string;
  prenom: string;
  sexe: 'M' | 'F';
  date_nai: string;

  // Informations complémentaires
  natcod: string;                // Nationalité (FRA, etc.)
  relcod: string;                // Type de licence (COMP, ENTR, LOISR, LOISS, DECO, ENCA, TP365, CF01)
  dfinrel: string;               // Date de fin de relation
  catcod: string;                // Catégorie (SE, VE, etc.)

  // Informations club (uniquement si licence valide)
  strcodnum_clu: string;         // Numéro du club
  strnomabr_clu: string;         // Nom abrégé du club
  strnom_clu: string;            // Nom du club
  strcodnum_clum: string;        // Numéro du club maître
  strnomabr_clum: string;        // Nom abrégé du club maître
  strnom_clum: string;           // Nom du club maître
  strcodnum_clue: string;        // Numéro du club entreprise
  strnomabr_clue: string;        // Nom abrégé du club entreprise
  strnom_clue: string;           // Nom du club entreprise
  strnomabr_dep: string;         // Département abrégé
  strnomabr_lig: string;         // Ligue abrégée

  // Message de retour
  msg_retour: string;            // OK ou message d'erreur avec code (PROxXXX)
}

/**
 * Codes d'erreur FFA
 */
export const FFA_ERROR_CODES = {
  'PROx001': 'Erreur sur le format de date',
  'PROx002': 'Informations fournies non-suffisantes',
  'PROx003': 'Numéro de licence introuvable',
  'PROx004': 'Numéro de TP introuvable',
  'PROx005': 'Numéro de CF introuvable',
  'PROx006': 'La relation (licence/TP) ne sera plus valide au moment de la compétition',
  'PROx007': 'Identité différente : mauvaise orthographe ou couple (relation/identité) faux',
  'PROx008': 'Identité introuvable',
  'PROx009': 'Réponse impossible pour raison d\'homonymie',
  'PROx010': 'Cas non pris en charge',
  'PROx011': 'Vous n\'êtes pas autorisé à utiliser ce service',
  'PROx012': 'Le service est bloqué, contactez la FFA',
  'PROx013': 'Erreur sur le format de date de la compétition',
  'PROx014': 'La date de compétition ne correspond pas avec la date saisie dans le SIFFA',
} as const;

/**
 * Types de licences FFA et leurs règles
 */
export const FFA_LICENSE_TYPES = {
  'COMP': { name: 'Compétition', requiresMedicalCertificate: false, validForCompetition: true },
  'ENTR': { name: 'Entreprise', requiresMedicalCertificate: false, validForCompetition: true },
  'LOISR': { name: 'Loisir Running', requiresMedicalCertificate: false, validForCompetition: true },
  'LOISS': { name: 'Loisir Santé', requiresMedicalCertificate: true, validForCompetition: false },
  'DECO': { name: 'Découverte', requiresMedicalCertificate: true, validForCompetition: false },
  'ENCA': { name: 'Encadrement', requiresMedicalCertificate: true, validForCompetition: false },
  'TP365': { name: 'Pass J\'aime Courir', requiresMedicalCertificate: true, validForCompetition: true, note: 'Doit être tamponné par un médecin' },
  'CF01': { name: 'Carte de Fidélité', requiresMedicalCertificate: true, validForCompetition: false },
} as const;

/**
 * Appelle le webservice FFA pour vérifier une licence/TP/CF
 */
export async function callFFAWebservice(
  request: FFAWebserviceRequest
): Promise<FFAWebserviceResponse> {
  try {
    // Utiliser la Edge Function Supabase pour éviter les problèmes Mixed Content (HTTP/HTTPS)
    const edgeFunctionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ffa-verify-athlete`;

    console.log('[FFA Webservice] Calling Edge Function with request:', request);

    // Appeler l'Edge Function qui fera le proxy vers l'API FFA
    const response = await fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        uid: request.uid,
        mdp: request.mdp,
        numrel: request.numrel || '',
        nom: request.nom,
        prenom: request.prenom,
        sexe: request.sexe,
        date_nai: request.date_nai,
        cnil_web: request.cnil_web,
        cmpcod: request.cmpcod,
        cmpdate: request.cmpdate,
        id_act_ext: request.id_act_ext || '',
        id_cmp_ext: request.id_cmp_ext || '',
      }),
    });

    if (!response.ok) {
      throw new Error(`Edge Function error: ${response.status}`);
    }

    const result = await response.json();
    console.log('[FFA Webservice] Edge Function Response:', result);

    // Si la connexion a échoué
    if (!result.connected) {
      // Erreur PROx014 : événement non déclaré FFA
      if (result.error_code === 'PROx014' || result.message?.includes('PROx014')) {
        throw new Error(
          'Événement non déclaré FFA. Pour utiliser la vérification FFA :\n' +
          '1. Déclarez votre événement dans CalOrg (https://www.athle.fr)\n' +
          '2. Obtenez un code CalOrg FFA (ex: 308668)\n' +
          '3. Vérifiez que la date de l\'événement correspond à celle dans CalOrg\n' +
          '4. Configurez le code CalOrg dans les paramètres de l\'événement\n\n' +
          'Si votre événement n\'est pas FFA, les participants peuvent s\'inscrire sans licence.'
        );
      }

      throw new Error(result.message || 'Erreur lors de la vérification FFA');
    }

    // Extraire les données de l'athlète depuis la réponse de l'Edge Function
    const athleteData = result.details?.test_athlete;
    if (!athleteData) {
      throw new Error('Données athlète manquantes dans la réponse FFA');
    }

    // Créer la réponse au format FFAWebserviceResponse
    const parsedResponse: FFAWebserviceResponse = {
      infoflg: result.details.flags.info_exact ? 'O' : 'N',
      relflg: result.details.flags.relation_valide ? 'O' : 'N',
      mutflg: result.details.flags.mute ? 'O' : 'N',
      pspflg: result.details.flags.pps_requis ? 'O' : 'N',
      cmpcod: request.cmpcod,
      id_act_ext: request.id_act_ext || '',
      id_cmp_ext: request.id_cmp_ext || '',
      numrel: athleteData.numrel || '',
      nom: athleteData.nom || request.nom,
      prenom: athleteData.prenom || request.prenom,
      sexe: athleteData.sexe || request.sexe,
      date_nai: athleteData.date_nai || request.date_nai,
      natcod: athleteData.natcod || '',
      relcod: athleteData.relcod || '',
      dfinrel: athleteData.license_expiry || '',
      catcod: athleteData.catcod || '',
      strcodnum_clu: athleteData.club_numero || '',
      strnomabr_clu: athleteData.club_abrege || '',
      strnom_clu: athleteData.club || '',
      strcodnum_clum: athleteData.club_numero || '',
      strnomabr_clum: athleteData.club_abrege || '',
      strnom_clum: athleteData.club || '',
      strcodnum_clue: '',
      strnomabr_clue: '',
      strnom_clue: '',
      strnomabr_dep: athleteData.departement || '',
      strnomabr_lig: athleteData.ligue || '',
      msg_retour: result.details.msg_retour || 'OK',
    };

    // Enregistrer dans les logs
    await logFFAVerification(request, parsedResponse);

    return parsedResponse;
  } catch (error) {
    console.error('[FFA Webservice] Error:', error);
    throw new Error('Erreur lors de l\'appel au webservice FFA : ' + (error as Error).message);
  }
}

/**
 * Parse la réponse CSV du webservice FFA
 */
function parseFFAResponse(csvResponse: string): FFAWebserviceResponse {
  // La réponse est au format :
  // INFOFLG,RELFLG,MUTFLG,PPSFLG,CMPCOD,ID_ACT_EXT,ID_CMP_EXT,NUMREL,NOM,PRENOM,
  // SEXE,DATE_NAI,NATCOD,RELCOD,DFINREL,CATCOD,STRCODNUM_CLU,STRNOMABR_CLU,
  // STRNOM_CLU,STRCODNUM_CLUM,STRNOMABR_CLUM,STRNOM_CLUM,STRCODNUM_CLUE,
  // STRNOMABR_CLUE,STRNOM_CLUE,STRNOMABR_DEP,STRNOMABR_LIG,MSG_RETOUR

  const fields = csvResponse.split(',');

  return {
    infoflg: (fields[0] || 'N') as 'O' | 'N',
    relflg: (fields[1] || 'N') as 'O' | 'N',
    mutflg: (fields[2] || 'N') as 'O' | 'N',
    pspflg: (fields[3] || 'O') as 'O' | 'N',
    cmpcod: fields[4] || '',
    id_act_ext: fields[5] || '',
    id_cmp_ext: fields[6] || '',
    numrel: fields[7] || '',
    nom: fields[8] || '',
    prenom: fields[9] || '',
    sexe: (fields[10] || 'M') as 'M' | 'F',
    date_nai: fields[11] || '',
    natcod: fields[12] || '',
    relcod: fields[13] || '',
    dfinrel: fields[14] || '',
    catcod: fields[15] || '',
    strcodnum_clu: fields[16] || '',
    strnomabr_clu: fields[17] || '',
    strnom_clu: fields[18] || '',
    strcodnum_clum: fields[19] || '',
    strnomabr_clum: fields[20] || '',
    strnom_clum: fields[21] || '',
    strcodnum_clue: fields[22] || '',
    strnomabr_clue: fields[23] || '',
    strnom_clue: fields[24] || '',
    strnomabr_dep: fields[25] || '',
    strnomabr_lig: fields[26] || '',
    msg_retour: fields[27] || 'OK',
  };
}

/**
 * Vérifie une licence FFA pour une course donnée
 */
export async function verifyFFALicenseForRace(
  athleteId: string,
  raceId: string,
  eventDate: string
): Promise<{
  valid: boolean;
  requiresCertificate: boolean;
  licenseType?: string;
  club?: string;
  category?: string;
  errorMessage?: string;
  warningMessage?: string;
}> {
  try {
    // Récupérer les informations de l'athlète
    const { data: athlete, error: athleteError } = await supabase
      .from('athletes')
      .select('*')
      .eq('id', athleteId)
      .maybeSingle();

    if (athleteError || !athlete) {
      return { valid: false, requiresCertificate: true, errorMessage: 'Athlète introuvable' };
    }

    // Récupérer les informations de la course
    const { data: race, error: raceError } = await supabase
      .from('races')
      .select('*, event:events(*)')
      .eq('id', raceId)
      .maybeSingle();

    if (raceError || !race || !race.event) {
      return { valid: false, requiresCertificate: true, errorMessage: 'Course introuvable' };
    }

    // Vérifier si l'événement est affilié FFA
    if (!race.event.ffa_affiliated || !race.event.ffa_calorg_code) {
      return { valid: true, requiresCertificate: false, warningMessage: 'Événement non affilié FFA' };
    }

    // Récupérer les identifiants FFA via fonction RPC (bypass RLS)
    const { data: settingsData } = await supabase.rpc('get_ffa_settings');

    const uidSetting = settingsData?.find((s: any) => s.key === 'ffa_api_uid');
    const passwordSetting = settingsData?.find((s: any) => s.key === 'ffa_api_password');

    if (!uidSetting?.value || !passwordSetting?.value) {
      console.warn('FFA API credentials not configured');
      return { valid: true, requiresCertificate: true, warningMessage: 'Vérification FFA non configurée' };
    }

    // Préparer la requête FFA
    const ffaRequest: FFAWebserviceRequest = {
      uid: uidSetting.value,
      mdp: passwordSetting.value,
      numrel: athlete.license_number || undefined,
      nom: athlete.last_name,
      prenom: athlete.first_name,
      sexe: athlete.gender,
      date_nai: formatDateForFFA(athlete.birthdate),
      cnil_web: athlete.public_results_consent ? 'O' : 'N',
      cmpcod: race.event.ffa_calorg_code,
      cmpdate: formatDateForFFA(eventDate),
      id_act_ext: athleteId,
      id_cmp_ext: raceId,
    };

    // Appeler le webservice FFA
    const ffaResponse = await callFFAWebservice(ffaRequest);

    // Analyser la réponse
    const isValid = ffaResponse.infoflg === 'O' && ffaResponse.relflg === 'O';
    const requiresPSP = ffaResponse.pspflg === 'O';
    const requiresCertificate = requiresPSP || ffaResponse.relflg === 'N';

    let warningMessage: string | undefined;
    let errorMessage: string | undefined;

    if (ffaResponse.msg_retour !== 'OK') {
      // Extraire le code d'erreur
      const errorCodeMatch = ffaResponse.msg_retour.match(/\(([^)]+)\)/);
      const errorCode = errorCodeMatch ? errorCodeMatch[1] : null;

      if (errorCode && errorCode in FFA_ERROR_CODES) {
        errorMessage = FFA_ERROR_CODES[errorCode as keyof typeof FFA_ERROR_CODES];
      } else {
        errorMessage = ffaResponse.msg_retour;
      }

      // Si c'est PROx006, c'est un warning, pas une erreur bloquante
      if (errorCode === 'PROx006') {
        warningMessage = errorMessage;
        errorMessage = undefined;
      }
    }

    // Informations sur le type de licence
    const licenseInfo = ffaResponse.relcod ? FFA_LICENSE_TYPES[ffaResponse.relcod as keyof typeof FFA_LICENSE_TYPES] : null;

    return {
      valid: isValid,
      requiresCertificate,
      licenseType: licenseInfo?.name || ffaResponse.relcod,
      club: ffaResponse.strnom_clu || undefined,
      category: ffaResponse.catcod || undefined,
      errorMessage,
      warningMessage,
    };
  } catch (error) {
    console.error('Error verifying FFA license:', error);
    return {
      valid: false,
      requiresCertificate: true,
      errorMessage: 'Erreur lors de la vérification FFA : ' + (error as Error).message,
    };
  }
}

/**
 * Formate une date pour le webservice FFA (DD/MM/YYYY ou YYYY)
 */
function formatDateForFFA(date: string | Date | null): string {
  if (!date) return '';

  const d = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(d.getTime())) return '';

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();

  return `${day}/${month}/${year}`;
}

/**
 * Enregistre une vérification FFA dans les logs
 */
async function logFFAVerification(
  request: FFAWebserviceRequest,
  response: FFAWebserviceResponse
): Promise<void> {
  try {
    await supabase.from('audit_logs').insert({
      action: 'FFA_VERIFICATION',
      details: {
        request: {
          numrel: request.numrel,
          nom: request.nom,
          prenom: request.prenom,
          cmpcod: request.cmpcod,
        },
        response: {
          infoflg: response.infoflg,
          relflg: response.relflg,
          mutflg: response.mutflg,
          pspflg: response.pspflg,
          msg_retour: response.msg_retour,
        },
      },
    });
  } catch (error) {
    console.error('Error logging FFA verification:', error);
  }
}

/**
 * Vérifie un code CalOrg et récupère les informations de la compétition
 * Note: Cette fonction simule une vérification car la FFA ne fournit pas
 * de webservice public pour interroger les compétitions.
 * En production, il faudrait soit :
 * - Demander à la FFA un webservice dédié
 * - Scraper le site Athle.fr
 * - Maintenir une base locale synchronisée
 */
export async function verifyCalorgCode(calorgCode: string): Promise<{
  valid: boolean;
  competition?: {
    code: string;
    name: string;
    date: string;
    location: string;
    organizer: string;
    timingCompany?: string;
    registrationCompany?: string;
  };
  message: string;
}> {
  try {
    const { data: credentials } = await supabase
      .rpc('get_ffa_credentials')
      .maybeSingle();

    if (!credentials?.uid || !credentials?.password) {
      return {
        valid: false,
        message: '❌ Identifiants FFA non configurés dans les paramètres admin',
      };
    }

    const edgeFunctionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/test-ffa-connection`;

    const response = await fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        uid: credentials.uid,
        mdp: credentials.password,
        numrel: '1756134',
        nom: 'TEST',
        prenom: 'TEST',
        sexe: 'M',
        date_nai: '1991',
        cnil_web: 'O',
        cmpcod: calorgCode,
        cmpdate: '01/01/2026',
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const result = await response.json();

    if (result.connected) {
      return {
        valid: true,
        competition: {
          code: calorgCode,
          name: 'Compétition FFA',
          date: 'À définir',
          location: 'Voir CalOrg',
          organizer: 'Voir CalOrg',
          timingCompany: 'Timepulse',
          registrationCompany: 'Timepulse',
        },
        message: '✓ Code CalOrg valide et reconnu par la FFA',
      };
    } else {
      return {
        valid: false,
        message: result.message || '❌ Code CalOrg non reconnu par la FFA',
      };
    }
  } catch (error) {
    console.error('Error verifying CalOrg code:', error);
    return {
      valid: false,
      message: '❌ Erreur lors de la vérification : ' + (error as Error).message,
    };
  }
}

/**
 * Teste la connexion au webservice FFA
 */
export async function testFFAConnection(): Promise<{
  connected: boolean;
  message: string;
  details?: any;
}> {
  try {
    // Récupérer les identifiants FFA via fonction RPC (bypass RLS)
    const { data: settingsData, error: settingsError } = await supabase.rpc('get_ffa_settings');

    if (settingsError) {
      console.error('[FFA Test] Error fetching FFA credentials:', settingsError);
      return {
        connected: false,
        message: 'Erreur lors de la récupération des identifiants',
        details: { error: settingsError.message }
      };
    }

    if (!settingsData || settingsData.length === 0) {
      console.error('[FFA Test] No FFA settings found');
      return {
        connected: false,
        message: 'Identifiants FFA non configurés',
        details: { error: 'No FFA settings found' }
      };
    }

    const uidSetting = settingsData.find((s: any) => s.key === 'ffa_api_uid');
    const passwordSetting = settingsData.find((s: any) => s.key === 'ffa_api_password');

    if (!uidSetting?.value || !passwordSetting?.value) {
      console.error('[FFA Test] Credentials are empty:', {
        uid: uidSetting?.value ? 'present' : 'missing',
        password: passwordSetting?.value ? 'present' : 'missing'
      });
      return {
        connected: false,
        message: 'Identifiants FFA non configurés',
        details: { error: 'Missing credentials' }
      };
    }

    const uid = uidSetting.value;
    const password = passwordSetting.value;

    console.log('[FFA Test] Credentials loaded successfully, uid:', uid);

    // Utiliser l'Edge Function pour éviter les problèmes CORS et HTTP/HTTPS
    console.log('[FFA Test] Testing connection via Edge Function with uid:', uid);

    try {
      const edgeFunctionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/test-ffa-connection`;

      console.log('[FFA Test] Calling URL:', edgeFunctionUrl);

      const response = await fetch(edgeFunctionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          uid,
          mdp: password,
          nom: 'TEST',
          prenom: 'TEST',
          sexe: 'M',
          date_nai: '1991',
          cnil_web: 'O',
          cmpcod: '000000',
          cmpdate: '01/01/1900'
        })
      });

      console.log('[FFA Test] Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[FFA Test] Edge function error:', errorText);
        throw new Error(`Edge function returned ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log('[FFA Test] Result:', result);

      // Si on reçoit une réponse de la FFA (même une erreur PROx011),
      // c'est que la connexion technique fonctionne
      const technicallyConnected = result.details?.msg_retour !== undefined ||
                                    result.details?.csv_raw !== undefined;

      let finalResult = result;

      if (technicallyConnected && !result.connected) {
        // La FFA a répondu mais les identifiants sont incorrects
        const errorMessage = result.details?.all_fields?.[28] || '';

        if (errorMessage.includes('PROx011')) {
          finalResult = {
            connected: true,
            message: '✓ Connexion à la FFA établie (identifiants à vérifier)',
            details: {
              ...result.details,
              technical_status: 'connected',
              auth_status: 'invalid_credentials',
              hint: 'La connexion au webservice FFA fonctionne. Vérifiez vos identifiants SIFFA (UID/MDP) auprès de la FFA.'
            }
          };
        }
      }

      // Enregistrer le résultat
      await supabase.from('audit_logs').insert({
        action: 'FFA_CONNECTION_TEST',
        details: {
          status: finalResult.connected ? 'success' : 'failed',
          uid,
          message: finalResult.message,
          details: finalResult.details,
        },
      });

      return finalResult;

    } catch (edgeError) {
      console.error('[FFA Test] Edge Function error:', edgeError);

      // Fallback: essayer l'appel direct (pour développement local)
      console.log('[FFA Test] Fallback: trying direct call...');

      try {
        const testRequest: FFAWebserviceRequest = {
          uid,
          mdp: password,
          numrel: '1756134',
          nom: 'ROBERT',
          prenom: 'JONATHAN',
          sexe: 'M',
          date_nai: '1991',
          cnil_web: 'O',
          cmpcod: '000000',
          cmpdate: '01/01/1900',
        };

        const response = await callFFAWebservice(testRequest);

        const isSuccess = response.msg_retour === 'OK' ||
          response.infoflg === 'O' ||
          (!response.msg_retour.includes('PROx011') && !response.msg_retour.includes('PROx012'));

        await supabase.from('audit_logs').insert({
          action: 'FFA_CONNECTION_TEST',
          details: {
            status: isSuccess ? 'success' : 'failed',
            uid,
            msg_retour: response.msg_retour,
            method: 'direct_fallback'
          },
        });

        return {
          connected: isSuccess,
          message: isSuccess ? 'Connexion FFA réussie' : `Erreur FFA : ${response.msg_retour}`,
          details: {
            uid,
            msg_retour: response.msg_retour,
            timestamp: new Date().toISOString(),
          }
        };
      } catch (directError) {
        console.error('[FFA Test] Direct call also failed:', directError);

        return {
          connected: false,
          message: 'Impossible de contacter le webservice FFA. Vérifiez votre connexion internet.',
          details: {
            error: (directError as Error).message,
            hint: 'Le webservice FFA utilise HTTP et peut être bloqué par votre navigateur. Essayez depuis un environnement de développement local.'
          }
        };
      }
    }
  } catch (error) {
    console.error('[FFA Test] Connection test failed:', error);

    await supabase.from('audit_logs').insert({
      action: 'FFA_CONNECTION_TEST',
      details: {
        status: 'error',
        error: (error as Error).message,
      },
    });

    return {
      connected: false,
      message: 'Erreur lors du test de connexion : ' + (error as Error).message,
      details: { error: (error as Error).message }
    };
  }
}

/**
 * Actualise toutes les licences FFA d'une course
 * Met à jour les informations FFA pour tous les athlètes ayant un numéro de licence
 */
export async function refreshFFALicensesForRace(
  raceId: string
): Promise<{
  total: number;
  updated: number;
  errors: number;
  details: Array<{
    athleteId: string;
    athleteName: string;
    licenseNumber: string;
    status: 'success' | 'error';
    message?: string;
  }>;
}> {
  const results: Array<{
    athleteId: string;
    athleteName: string;
    licenseNumber: string;
    status: 'success' | 'error';
    message?: string;
  }> = [];

  try {
    // Récupérer la course et l'événement
    const { data: race, error: raceError } = await supabase
      .from('races')
      .select('*, event:events(*)')
      .eq('id', raceId)
      .maybeSingle();

    if (raceError || !race || !race.event) {
      throw new Error('Course introuvable');
    }

    // Vérifier si l'événement est affilié FFA
    if (!race.event.ffa_affiliated || !race.event.ffa_calorg_code) {
      throw new Error(
        'Événement non affilié FFA. Pour utiliser la vérification FFA, vous devez :\n' +
        '1. Déclarer votre événement auprès de la FFA dans CalOrg\n' +
        '2. Obtenir un code CalOrg (ex: 308668)\n' +
        '3. Configurer ce code dans les paramètres de l\'événement\n' +
        '4. Vérifier que la date de l\'événement correspond à celle déclarée dans CalOrg'
      );
    }

    // Récupérer toutes les inscriptions avec numéro de licence
    const { data: entries, error: entriesError } = await supabase
      .from('entries')
      .select(`
        id,
        athlete_id,
        athletes (
          id,
          first_name,
          last_name,
          gender,
          birthdate,
          license_number,
          public_results_consent
        )
      `)
      .eq('race_id', raceId)
      .not('athletes.license_number', 'is', null);

    if (entriesError) {
      throw entriesError;
    }

    if (!entries || entries.length === 0) {
      return {
        total: 0,
        updated: 0,
        errors: 0,
        details: []
      };
    }

    // Récupérer les identifiants FFA
    const { data: settingsData } = await supabase.rpc('get_ffa_settings');
    const uidSetting = settingsData?.find((s: any) => s.key === 'ffa_api_uid');
    const passwordSetting = settingsData?.find((s: any) => s.key === 'ffa_api_password');

    if (!uidSetting?.value || !passwordSetting?.value) {
      throw new Error('Identifiants FFA non configurés');
    }

    const uid = uidSetting.value;
    const password = passwordSetting.value;

    // Traiter chaque inscription
    let updated = 0;
    let errors = 0;

    for (const entry of entries) {
      const athlete = entry.athletes as any;

      if (!athlete || !athlete.license_number) {
        continue;
      }

      const athleteName = `${athlete.first_name} ${athlete.last_name}`;

      try {
        // Préparer la requête FFA
        const ffaRequest: FFAWebserviceRequest = {
          uid,
          mdp: password,
          numrel: athlete.license_number,
          nom: athlete.last_name,
          prenom: athlete.first_name,
          sexe: athlete.gender,
          date_nai: formatDateForFFA(athlete.birthdate),
          cnil_web: athlete.public_results_consent ? 'O' : 'N',
          cmpcod: race.event.ffa_calorg_code,
          cmpdate: formatDateForFFA(race.event.start_date),
          id_act_ext: athlete.id,
          id_cmp_ext: raceId,
        };

        // Appeler le webservice FFA
        const ffaResponse = await callFFAWebservice(ffaRequest);

        // Convertir la date d'expiration FFA (DD/MM/YYYY) en format ISO
        let expiryDate = null;
        if (ffaResponse.dfinrel) {
          try {
            const parts = ffaResponse.dfinrel.split('/');
            if (parts.length === 3) {
              expiryDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
            }
          } catch (e) {
            console.error('Error parsing expiry date:', e);
          }
        }

        // Mettre à jour l'athlète avec les informations FFA
        const { error: updateError } = await supabase
          .from('athletes')
          .update({
            license_club: ffaResponse.strnom_clu || null,
            ffa_club_name: ffaResponse.strnom_clu || null,
            ffa_relcod: ffaResponse.relcod || null,
            ffa_club_code: ffaResponse.strcodnum_clu || null,
            ffa_league_abbr: ffaResponse.strnomabr_lig || null,
            ffa_department_abbr: ffaResponse.strnomabr_dep || null,
            ffa_catcod: ffaResponse.catcod || null,
            pps_number: ffaResponse.pspflg === 'O' ? (ffaResponse.numrel || null) : null,
            pps_expiry_date: expiryDate,
          })
          .eq('id', athlete.id);

        if (updateError) {
          throw updateError;
        }

        updated++;
        results.push({
          athleteId: athlete.id,
          athleteName,
          licenseNumber: athlete.license_number,
          status: 'success',
          message: `Licence actualisée - ${ffaResponse.catcod} - ${ffaResponse.strnom_clu || 'Pas de club'}`
        });

      } catch (error) {
        errors++;
        results.push({
          athleteId: athlete.id,
          athleteName,
          licenseNumber: athlete.license_number,
          status: 'error',
          message: (error as Error).message
        });
      }
    }

    return {
      total: entries.length,
      updated,
      errors,
      details: results
    };

  } catch (error) {
    console.error('Error refreshing FFA licenses:', error);
    throw error;
  }
}
