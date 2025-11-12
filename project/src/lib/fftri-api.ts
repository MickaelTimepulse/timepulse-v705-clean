/**
 * Service d'intégration API FFTri (Fédération Française de Triathlon)
 *
 * IMPORTANT: Ce service nécessite un accès API FFTri
 * Contact: https://www.fftri.com ou informatique@fftri.com
 *
 * Documentation niveaux FIS:
 * - E: Débutant (découverte, distances sprint)
 * - D: Initié (distances courtes/olympiques)
 * - C: Confirmé (moyenne distance, conditions normales)
 * - B: Expert (longue distance, Ironman 70.3)
 * - A: Élite (ultra-distances, Ironman, conditions extrêmes)
 */

import { supabase } from './supabase';

export type FISLevel = 'A' | 'B' | 'C' | 'D' | 'E';

interface FFTriLicenseResponse {
  valid: boolean;
  licenseNumber: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  gender: 'M' | 'F';
  category: string;
  club: string;
  expirationDate: string;
  fisLevel: FISLevel;
  isSuspended: boolean;
  suspensionUntil?: string;
  errorMessage?: string;
}

/**
 * Vérifie une licence FFTri via l'API officielle
 */
export async function verifyFFTriLicense(
  licenseNumber: string,
  useCache: boolean = true
): Promise<FFTriLicenseResponse> {
  try {
    // Nettoyer le numéro de licence
    const cleanLicense = licenseNumber.replace(/[\s-]/g, '').toUpperCase();

    // Vérifier le format (exemple: T123456 ou 123456)
    if (!isValidFFTriLicenseFormat(cleanLicense)) {
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
        fisLevel: 'E',
        isSuspended: false,
        errorMessage: 'Format de licence invalide',
      };
    }

    // Chercher dans le cache
    if (useCache) {
      const cached = await getFFTriCachedVerification(cleanLicense);
      if (cached) {
        console.log('FFTri verification: using cache');
        return cached;
      }
    }

    // Appeler l'API FFTri
    const apiKey = import.meta.env.VITE_FFTRI_API_KEY;
    if (!apiKey) {
      console.warn('FFTRI_API_KEY not configured, using mock data');
      return await mockFFTriVerification(cleanLicense);
    }

    // VRAI APPEL API FFTri
    const response = await fetch(`https://api.fftri.com/v1/license/${cleanLicense}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`FFTri API error: ${response.status}`);
    }

    const data = await response.json();

    // Mapper la réponse API FFTri
    const result: FFTriLicenseResponse = {
      valid: data.valid === true,
      licenseNumber: data.numero || cleanLicense,
      firstName: data.prenom || '',
      lastName: data.nom || '',
      birthDate: data.date_naissance || '',
      gender: data.sexe === 'M' || data.sexe === 'F' ? data.sexe : 'M',
      category: data.categorie || '',
      club: data.club || '',
      expirationDate: data.date_fin_validite || '',
      fisLevel: (data.niveau_fis || 'E') as FISLevel,
      isSuspended: data.suspendu === true,
      suspensionUntil: data.suspension_jusqu_au || undefined,
    };

    // Sauvegarder dans le cache
    await saveFFTriVerificationToCache(cleanLicense, result);

    // Logger
    await logFFTriVerification(result, null);

    return result;

  } catch (error) {
    console.error('Error verifying FFTri license:', error);

    const errorResult: FFTriLicenseResponse = {
      valid: false,
      licenseNumber,
      firstName: '',
      lastName: '',
      birthDate: '',
      gender: 'M',
      category: '',
      club: '',
      expirationDate: '',
      fisLevel: 'E',
      isSuspended: false,
      errorMessage: error instanceof Error ? error.message : 'Erreur inconnue',
    };

    await logFFTriVerification(errorResult, error instanceof Error ? error.message : null);

    return errorResult;
  }
}

/**
 * Vérifie si une licence FFTri est valide (sans appel API)
 */
export async function checkFFTriLicenseValidity(athleteId: string): Promise<boolean> {
  const { data, error } = await supabase
    .rpc('check_fftri_license_validity', { p_athlete_id: athleteId });

  if (error) {
    console.error('Error checking FFTri license validity:', error);
    return false;
  }

  return data === true;
}

/**
 * Vérifie si un athlète est suspendu
 */
export async function isFFTriSuspended(athleteId: string): Promise<boolean> {
  const { data, error } = await supabase
    .rpc('is_fftri_suspended', { p_athlete_id: athleteId });

  if (error) {
    console.error('Error checking FFTri suspension:', error);
    return false;
  }

  return data === true;
}

/**
 * Vérifie le niveau FIS requis pour une course
 */
export async function checkFISLevelRequirement(
  athleteId: string,
  raceId: string
): Promise<{
  meetsRequirement: boolean;
  athleteFisLevel: FISLevel | null;
  requiredFisLevel: FISLevel | null;
  message: string;
}> {
  const { data, error } = await supabase
    .rpc('check_fis_level_requirement', {
      p_athlete_id: athleteId,
      p_race_id: raceId,
    });

  if (error) {
    console.error('Error checking FIS requirement:', error);
    return {
      meetsRequirement: false,
      athleteFisLevel: null,
      requiredFisLevel: null,
      message: 'Erreur lors de la vérification',
    };
  }

  return data;
}

/**
 * Définit l'exigence FIS pour une course
 */
export async function setFISRequirement(
  raceId: string,
  minimumFisLevel: FISLevel,
  reason: string
): Promise<void> {
  const { error } = await supabase
    .from('fftri_fis_requirements')
    .upsert({
      race_id: raceId,
      minimum_fis_level: minimumFisLevel,
      reason,
    });

  if (error) {
    throw new Error(`Failed to set FIS requirement: ${error.message}`);
  }
}

/**
 * Met à jour les informations FFTri d'un athlète
 */
export async function updateAthleteFFTriInfo(
  athleteId: string,
  fftriData: Partial<FFTriLicenseResponse>
): Promise<void> {
  const { error } = await supabase
    .from('athletes')
    .update({
      fftri_license_number: fftriData.licenseNumber,
      fftri_license_valid_until: fftriData.expirationDate,
      fftri_fis_level: fftriData.fisLevel,
      fftri_club: fftriData.club,
      fftri_category: fftriData.category,
      fftri_suspension_until: fftriData.suspensionUntil,
      fftri_verified_at: new Date().toISOString(),
    })
    .eq('id', athleteId);

  if (error) {
    throw new Error(`Failed to update FFTri info: ${error.message}`);
  }
}

/**
 * Récupère les licences FFTri expirant bientôt ou suspendues
 */
export async function getExpiringFFTriLicenses() {
  const { data, error } = await supabase
    .from('fftri_licenses_expiring_soon')
    .select('*');

  if (error) {
    console.error('Error fetching expiring licenses:', error);
    return [];
  }

  return data;
}

/**
 * Récupère la distribution des niveaux FIS
 */
export async function getFISDistribution() {
  const { data, error } = await supabase
    .from('fftri_fis_distribution')
    .select('*');

  if (error) {
    console.error('Error fetching FIS distribution:', error);
    return [];
  }

  return data;
}

// ============================================
// FONCTIONS UTILITAIRES
// ============================================

/**
 * Valide le format d'un numéro de licence FFTri
 */
function isValidFFTriLicenseFormat(license: string): boolean {
  // Format FFTri typique: 6 chiffres ou T suivi de 6 chiffres
  return /^\d{6}$/.test(license) || /^T\d{6}$/.test(license);
}

/**
 * Compare deux niveaux FIS
 * Retourne: 1 si level1 > level2, -1 si level1 < level2, 0 si égal
 */
export function compareFISLevels(level1: FISLevel, level2: FISLevel): number {
  const order: FISLevel[] = ['E', 'D', 'C', 'B', 'A'];
  const pos1 = order.indexOf(level1);
  const pos2 = order.indexOf(level2);

  if (pos1 > pos2) return 1;
  if (pos1 < pos2) return -1;
  return 0;
}

/**
 * Retourne le libellé d'un niveau FIS
 */
export function getFISLevelLabel(level: FISLevel): string {
  const labels: Record<FISLevel, string> = {
    E: 'Débutant - Découverte',
    D: 'Initié - Distances courtes',
    C: 'Confirmé - Moyenne distance',
    B: 'Expert - Longue distance',
    A: 'Élite - Ultra-distance',
  };
  return labels[level];
}

/**
 * Retourne la couleur d'un niveau FIS (pour affichage)
 */
export function getFISLevelColor(level: FISLevel): string {
  const colors: Record<FISLevel, string> = {
    E: 'bg-gray-100 text-gray-800',
    D: 'bg-blue-100 text-blue-800',
    C: 'bg-green-100 text-green-800',
    B: 'bg-orange-100 text-orange-800',
    A: 'bg-red-100 text-red-800',
  };
  return colors[level];
}

/**
 * Calcule le niveau FIS recommandé selon la distance et difficulté
 */
export function calculateRecommendedFISLevel(
  distanceKm: number,
  difficulty: 'easy' | 'medium' | 'hard' | 'extreme'
): FISLevel {
  // Sprint / Découverte (< 25km)
  if (distanceKm < 25) {
    return difficulty === 'easy' ? 'E' : 'D';
  }

  // Courte distance / Olympique (25-50km)
  if (distanceKm < 50) {
    return difficulty === 'easy' ? 'D' : 'C';
  }

  // Moyenne distance (50-100km)
  if (distanceKm < 100) {
    return difficulty === 'easy' || difficulty === 'medium' ? 'C' : 'B';
  }

  // Longue distance / Half Ironman (100-180km)
  if (distanceKm < 180) {
    return difficulty === 'hard' || difficulty === 'extreme' ? 'A' : 'B';
  }

  // Ultra-distance / Ironman (180km+)
  return 'A';
}

/**
 * Récupère le cache de vérification FFTri
 */
async function getFFTriCachedVerification(licenseNumber: string): Promise<FFTriLicenseResponse | null> {
  const { data, error } = await supabase
    .rpc('get_fftri_cached_verification', {
      p_license_number: licenseNumber,
      p_verification_type: 'license',
    });

  if (error || !data) {
    return null;
  }

  return data as FFTriLicenseResponse;
}

/**
 * Sauvegarde une vérification FFTri dans le cache
 */
async function saveFFTriVerificationToCache(
  licenseNumber: string,
  result: FFTriLicenseResponse
): Promise<void> {
  const cacheUntil = new Date();
  cacheUntil.setHours(cacheUntil.getHours() + 24); // Cache 24h

  await supabase.from('fftri_verification_logs').insert({
    license_number: licenseNumber,
    verification_type: 'license',
    api_response: result,
    is_valid: result.valid,
    verified_data: result,
    cache_until: cacheUntil.toISOString(),
  });
}

/**
 * Log une vérification FFTri
 */
async function logFFTriVerification(
  result: FFTriLicenseResponse,
  errorMessage: string | null
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();

  await supabase.from('fftri_verification_logs').insert({
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
 * Données de test en développement
 */
async function mockFFTriVerification(licenseNumber: string): Promise<FFTriLicenseResponse> {
  console.warn('Using mock FFTri verification - configure VITE_FFTRI_API_KEY for production');

  await new Promise(resolve => setTimeout(resolve, 500));

  return {
    valid: true,
    licenseNumber,
    firstName: 'Sophie',
    lastName: 'Martin',
    birthDate: '1988-03-20',
    gender: 'F',
    category: 'V1F',
    club: 'Triathlon Club Exemple',
    expirationDate: '2025-12-31',
    fisLevel: 'C',
    isSuspended: false,
  };
}

/**
 * Formate un numéro de licence FFTri pour affichage
 */
export function formatFFTriLicense(license: string): string {
  const clean = license.replace(/[\s-]/g, '').toUpperCase();
  if (clean.startsWith('T')) {
    return clean;
  }
  return `T${clean}`;
}
