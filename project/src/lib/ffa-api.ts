/**
 * Service d'intégration API FFA (Fédération Française d'Athlétisme)
 *
 * IMPORTANT: Ce service nécessite un compte API FFA
 * Contact: https://www.athle.fr ou informatique@athle.fr
 *
 * Documentation API: https://api.athle.fr/docs (si disponible)
 */

import { supabase } from './supabase';

interface FFALicenseResponse {
  valid: boolean;
  licenseNumber: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  gender: 'M' | 'F';
  category: string; // SEM, V1M, ESF, etc.
  club: string;
  clubCode?: string; // Code du club FFA
  league?: string; // Ligue (région FFA)
  department?: string; // Département
  licenseType?: string; // Type de licence (Compétition, Running, etc.)
  expirationDate: string;
  hasPSP: boolean;
  pspNumber?: string; // Numéro PSP (Pass Prévention Santé) pour non-licenciés
  pspExpirationDate?: string;
  medicalCertificateDate?: string;
  errorMessage?: string;
}

interface FFAVerificationCache {
  licenseNumber: string;
  data: FFALicenseResponse;
  cachedAt: string;
  expiresAt: string;
}

/**
 * Vérifie une licence FFA via l'API officielle
 */
export async function verifyFFALicense(
  licenseNumber: string,
  useCache: boolean = true
): Promise<FFALicenseResponse> {
  try {
    // Nettoyer le numéro de licence (enlever espaces, tirets)
    const cleanLicense = licenseNumber.replace(/[\s-]/g, '');

    // Vérifier le format (exemple: 1234567890 ou 1234-567890)
    if (!isValidFFALicenseFormat(cleanLicense)) {
      return {
        valid: false,
        licenseNumber: cleanLicense,
        firstName: '',
        lastName: '',
        birthDate: '',
        gender: 'M',
        category: '',
        club: '',
        expirationDate: '',
        hasPSP: false,
        errorMessage: 'Format de licence invalide',
      };
    }

    // Chercher dans le cache si autorisé
    if (useCache) {
      const cached = await getFFACachedVerification(cleanLicense);
      if (cached) {
        console.log('FFA verification: using cache');
        return cached;
      }
    }

    // Appeler l'API FFA
    const apiKey = import.meta.env.VITE_FFA_API_KEY;
    if (!apiKey) {
      console.warn('FFA_API_KEY not configured, using mock data');
      return await mockFFAVerification(cleanLicense);
    }

    // VRAI APPEL API FFA
    const response = await fetch(`https://api.athle.fr/v1/license/${cleanLicense}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`FFA API error: ${response.status}`);
    }

    const data = await response.json();

    // Mapper la réponse API FFA vers notre format
    const result: FFALicenseResponse = {
      valid: data.valid === true,
      licenseNumber: data.numero_licence || cleanLicense,
      firstName: data.prenom || '',
      lastName: data.nom || '',
      birthDate: data.date_naissance || '',
      gender: data.sexe === 'M' || data.sexe === 'F' ? data.sexe : 'M',
      category: data.categorie || calculateFFACategory(data.date_naissance, data.sexe),
      club: data.club || '',
      clubCode: data.code_club || undefined,
      league: data.ligue || undefined,
      department: data.departement || undefined,
      licenseType: data.type_licence || undefined,
      expirationDate: data.date_fin_validite || '',
      hasPSP: data.pps === true,
      pspNumber: data.numero_psp || undefined,
      pspExpirationDate: data.psp_date_fin || undefined,
      medicalCertificateDate: data.certificat_medical_date || undefined,
    };

    // Sauvegarder dans le cache (valide 24h)
    await saveFFAVerificationToCache(cleanLicense, result);

    // Logger dans la base
    await logFFAVerification(result, null);

    return result;

  } catch (error) {
    console.error('Error verifying FFA license:', error);

    const errorResult: FFALicenseResponse = {
      valid: false,
      licenseNumber,
      firstName: '',
      lastName: '',
      birthDate: '',
      gender: 'M',
      category: '',
      club: '',
      expirationDate: '',
      hasPSP: false,
      errorMessage: error instanceof Error ? error.message : 'Erreur inconnue',
    };

    await logFFAVerification(errorResult, error instanceof Error ? error.message : null);

    return errorResult;
  }
}

/**
 * Vérifie si une licence FFA est valide (sans appel API, juste vérif DB)
 */
export async function checkFFALicenseValidity(athleteId: string): Promise<boolean> {
  const { data, error } = await supabase
    .rpc('check_ffa_license_validity', { p_athlete_id: athleteId });

  if (error) {
    console.error('Error checking FFA license validity:', error);
    return false;
  }

  return data === true;
}

/**
 * Vérifie si le PSP (Pass Prévention Santé) est requis pour une course donnée
 */
export async function requirePSPForRace(raceId: string): Promise<boolean> {
  const { data, error } = await supabase
    .rpc('require_pps_for_race', { p_race_id: raceId });

  if (error) {
    console.error('Error checking PSP requirement:', error);
    return false;
  }

  return data === true;
}

/**
 * Met à jour les informations FFA d'un athlète
 */
export async function updateAthletFFAInfo(
  athleteId: string,
  ffaData: Partial<FFALicenseResponse>
): Promise<void> {
  const { error } = await supabase
    .from('athletes')
    .update({
      ffa_license_number: ffaData.licenseNumber,
      ffa_license_valid_until: ffaData.expirationDate,
      ffa_club_code: ffaData.clubCode,
      ffa_club_name: ffaData.club,
      ffa_league: ffaData.league,
      ffa_department: ffaData.department,
      license_type: ffaData.licenseType,
      has_pps: ffaData.hasPSP,
      pps_number: ffaData.pspNumber,
      pps_expiration_date: ffaData.pspExpirationDate,
      pps_valid_until: ffaData.pspExpirationDate,
      medical_certificate_date: ffaData.medicalCertificateDate,
      ffa_category: ffaData.category,
      ffa_verified_at: new Date().toISOString(),
    })
    .eq('id', athleteId);

  if (error) {
    throw new Error(`Failed to update FFA info: ${error.message}`);
  }
}

/**
 * Récupère les licences FFA expirant bientôt
 */
export async function getExpiringFFALicenses() {
  const { data, error } = await supabase
    .from('ffa_licenses_expiring_soon')
    .select('*');

  if (error) {
    console.error('Error fetching expiring licenses:', error);
    return [];
  }

  return data;
}

// ============================================
// FONCTIONS UTILITAIRES
// ============================================

/**
 * Valide le format d'un numéro de licence FFA
 */
function isValidFFALicenseFormat(license: string): boolean {
  // Format FFA typique: 10 chiffres ou format avec tiret
  // Exemple: 1234567890 ou 1234-567890
  return /^\d{10}$/.test(license) || /^\d{4}-\d{6}$/.test(license);
}

/**
 * Calcule la catégorie FFA selon la date de naissance
 */
function calculateFFACategory(birthDate: string, gender: 'M' | 'F'): string {
  const birth = new Date(birthDate);
  const today = new Date();
  const age = today.getFullYear() - birth.getFullYear();

  const suffix = gender === 'M' ? 'M' : 'F';

  if (age < 10) return 'EA' + suffix; // Enfants
  if (age < 12) return 'PO' + suffix; // Poussins
  if (age < 14) return 'BE' + suffix; // Benjamins
  if (age < 16) return 'MI' + suffix; // Minimes
  if (age < 18) return 'CA' + suffix; // Cadets
  if (age < 20) return 'JU' + suffix; // Juniors
  if (age < 23) return 'ES' + suffix; // Espoirs
  if (age < 40) return 'SE' + suffix; // Seniors
  if (age < 50) return 'V1' + suffix; // Vétérans 1
  if (age < 60) return 'V2' + suffix; // Vétérans 2
  if (age < 70) return 'V3' + suffix; // Vétérans 3
  return 'V4' + suffix; // Vétérans 4
}

/**
 * Récupère une vérification FFA depuis le cache
 */
async function getFFACachedVerification(licenseNumber: string): Promise<FFALicenseResponse | null> {
  const { data, error } = await supabase
    .rpc('get_ffa_cached_verification', {
      p_license_number: licenseNumber,
      p_verification_type: 'license',
    });

  if (error || !data) {
    return null;
  }

  return data as FFALicenseResponse;
}

/**
 * Sauvegarde une vérification FFA dans le cache
 */
async function saveFFAVerificationToCache(
  licenseNumber: string,
  result: FFALicenseResponse
): Promise<void> {
  const cacheUntil = new Date();
  cacheUntil.setHours(cacheUntil.getHours() + 24); // Cache 24h

  await supabase.from('ffa_verification_logs').insert({
    license_number: licenseNumber,
    verification_type: 'license',
    api_response: result,
    is_valid: result.valid,
    verified_data: result,
    cache_until: cacheUntil.toISOString(),
  });
}

/**
 * Log une vérification FFA dans la base
 */
async function logFFAVerification(
  result: FFALicenseResponse,
  errorMessage: string | null
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();

  await supabase.from('ffa_verification_logs').insert({
    license_number: result.licenseNumber,
    verification_type: 'license',
    api_response: result,
    is_valid: result.valid,
    error_message: errorMessage,
    verified_data: result,
    verified_by: user?.id,
  });
}

/**
 * Données de test en développement (quand pas d'API key)
 */
async function mockFFAVerification(licenseNumber: string): Promise<FFALicenseResponse> {
  console.warn('Using mock FFA verification - configure VITE_FFA_API_KEY for production');

  // Simuler un délai API
  await new Promise(resolve => setTimeout(resolve, 500));

  return {
    valid: true,
    licenseNumber,
    firstName: 'Jean',
    lastName: 'Dupont',
    birthDate: '1990-05-15',
    gender: 'M',
    category: 'SEM',
    club: 'AC Exemple',
    clubCode: '044001',
    league: 'Pays de la Loire',
    department: '44 - Loire-Atlantique',
    licenseType: 'Compétition',
    expirationDate: '2025-12-31',
    hasPSP: true,
    pspNumber: 'PPS123456',
    pspExpirationDate: '2025-12-31',
    medicalCertificateDate: '2024-09-01',
  };
}

/**
 * Vérifie un numéro PSP (Pass Prévention Santé) via l'API FFA
 */
export async function verifyPSP(
  pspNumber: string,
  eventDate: string
): Promise<{ valid: boolean; reason?: string; expirationDate?: string }> {
  try {
    const { data, error } = await supabase.rpc('verify_pps_at_date', {
      p_pps_number: pspNumber,
      p_event_date: eventDate,
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error verifying PSP:', error);
    return { valid: false, reason: 'Erreur lors de la vérification du PSP (Pass Prévention Santé)' };
  }
}

/**
 * Vérifie si un athlète peut participer à une course FFA
 * Retourne valid: true même si document à renouveler, avec warning: true
 */
export async function canParticipateInFFARace(
  athleteId: string,
  raceId: string,
  eventDate: string
): Promise<{
  valid: boolean;
  reason: string;
  warning?: boolean;
  warning_message?: string;
  requires_renewal?: boolean;
  renewal_type?: 'license' | 'pps';
  expiration_date?: string;
}> {
  try {
    const { data, error } = await supabase.rpc('can_participate_in_ffa_race', {
      p_athlete_id: athleteId,
      p_race_id: raceId,
      p_event_date: eventDate,
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error checking FFA participation:', error);
    return { valid: false, reason: 'Erreur lors de la vérification FFA' };
  }
}

/**
 * Enregistre les informations de renouvellement sur une inscription
 */
export async function saveRenewalInfo(
  entryId: string,
  renewalType: 'license' | 'pps',
  renewalDeadline: string,
  warningMessage: string
): Promise<void> {
  const { error } = await supabase
    .from('entries')
    .update({
      requires_document_renewal: true,
      renewal_document_type: renewalType,
      renewal_deadline: renewalDeadline,
      renewal_warning_message: warningMessage,
      renewal_reminder_sent: false,
    })
    .eq('id', entryId);

  if (error) {
    console.error('Error saving renewal info:', error);
    throw new Error('Erreur lors de l\'enregistrement des informations de renouvellement');
  }
}

/**
 * Récupère les inscriptions nécessitant un renouvellement de document
 */
export async function getEntriesRequiringRenewal(organizerId?: string) {
  let query = supabase
    .from('entries_requiring_document_renewal')
    .select('*')
    .order('renewal_deadline', { ascending: true });

  if (organizerId) {
    // Filtrer par organisateur si spécifié
    const { data: events } = await supabase
      .from('events')
      .select('id')
      .eq('organizer_id', organizerId);

    if (events && events.length > 0) {
      const eventIds = events.map(e => e.id);
      query = query.in('event_id', eventIds);
    }
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching entries requiring renewal:', error);
    return [];
  }

  return data;
}

/**
 * Marque un rappel de renouvellement comme envoyé
 */
export async function markRenewalReminderSent(entryId: string): Promise<void> {
  const { error } = await supabase
    .from('entries')
    .update({ renewal_reminder_sent: true })
    .eq('id', entryId);

  if (error) {
    console.error('Error marking renewal reminder as sent:', error);
    throw error;
  }
}

/**
 * Vérifie un événement CalOrg auprès de l'API FFA
 */
export async function verifyCalOrgEvent(calorgCode: string): Promise<{
  valid: boolean;
  eventName?: string;
  eventDate?: string;
  organizer?: string;
  error?: string;
}> {
  try {
    const apiKey = import.meta.env.VITE_FFA_API_KEY;
    if (!apiKey) {
      console.warn('FFA_API_KEY not configured');
      return {
        valid: true,
        eventName: 'Événement FFA (mode développement)',
        eventDate: new Date().toISOString(),
        organizer: 'Organisateur FFA',
      };
    }

    const response = await fetch(`https://api.athle.fr/v1/calorg/${calorgCode}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`FFA API error: ${response.status}`);
    }

    const data = await response.json();

    return {
      valid: true,
      eventName: data.nom_epreuve || '',
      eventDate: data.date_epreuve || '',
      organizer: data.organisateur || '',
    };
  } catch (error) {
    console.error('Error verifying CalOrg event:', error);
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    };
  }
}

/**
 * Exporte les statistiques de vérification FFA
 */
export async function getFFAVerificationStats() {
  const { data, error } = await supabase
    .from('ffa_verification_stats')
    .select('*')
    .limit(30);

  if (error) {
    console.error('Error fetching FFA stats:', error);
    return [];
  }

  return data;
}

/**
 * Formate un numéro de licence FFA pour affichage
 */
export function formatFFALicense(license: string): string {
  const clean = license.replace(/[\s-]/g, '');
  if (clean.length === 10) {
    return `${clean.slice(0, 4)}-${clean.slice(4)}`;
  }
  return license;
}

/**
 * Formate un numéro PSP (Pass Prévention Santé) pour affichage
 */
export function formatPSP(psp: string): string {
  const clean = psp.replace(/[\s-]/g, '');
  if (clean.length === 9) {
    return `${clean.slice(0, 3)}-${clean.slice(3, 6)}-${clean.slice(6)}`;
  }
  return psp;
}
