/**
 * Générateur de slugs SEO-friendly pour les URLs
 */

/**
 * Génère un slug à partir d'un texte
 * Exemple: "Marathon de Paris 2025" -> "marathon-de-paris-2025"
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD') // Décompose les caractères accentués
    .replace(/[\u0300-\u036f]/g, '') // Supprime les accents
    .replace(/[^a-z0-9\s-]/g, '') // Supprime les caractères spéciaux
    .trim()
    .replace(/\s+/g, '-') // Remplace les espaces par des tirets
    .replace(/-+/g, '-') // Remplace les tirets multiples par un seul
    .replace(/^-|-$/g, ''); // Supprime les tirets au début et à la fin
}

/**
 * Génère un slug pour une course avec nom et année
 * Exemple: "10km de Paris", "2025-03-15" -> "10km-de-paris-2025"
 */
export function generateRaceSlug(raceName: string, date: string | Date): string {
  const year = date instanceof Date ? date.getFullYear() : new Date(date).getFullYear();
  const baseSlug = generateSlug(raceName);
  return `${baseSlug}-${year}`;
}

/**
 * Génère un slug pour un événement avec nom et année
 * Exemple: "Marathon de Paris", "2025-03-15" -> "marathon-de-paris-2025"
 */
export function generateEventSlug(eventName: string, date: string | Date): string {
  return generateRaceSlug(eventName, date);
}

/**
 * Parse un slug pour extraire l'année
 * Exemple: "marathon-de-paris-2025" -> { slug: "marathon-de-paris", year: 2025 }
 */
export function parseSlugWithYear(slug: string): { slug: string; year: number | null } {
  const yearMatch = slug.match(/-(\d{4})$/);

  if (yearMatch) {
    const year = parseInt(yearMatch[1]);
    const baseSlug = slug.replace(/-\d{4}$/, '');
    return { slug: baseSlug, year };
  }

  return { slug, year: null };
}

/**
 * Vérifie si une chaîne est un UUID
 */
export function isUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

/**
 * Génère un slug complet pour les résultats d'une course
 * Format: /resultats/nom-evenement-nom-course-2025
 * Exemple: /resultats/marathon-de-paris-10km-2025
 */
export function generateResultsSlug(
  eventName: string,
  raceName: string,
  date: string | Date
): string {
  const year = date instanceof Date ? date.getFullYear() : new Date(date).getFullYear();
  const eventSlug = generateSlug(eventName);
  const raceSlug = generateSlug(raceName);

  // Si le nom de la course contient déjà le nom de l'événement, ne pas dupliquer
  if (raceSlug.includes(eventSlug)) {
    return `${raceSlug}-${year}`;
  }

  return `${eventSlug}-${raceSlug}-${year}`;
}

/**
 * Tronque un slug trop long
 */
export function truncateSlug(slug: string, maxLength: number = 100): string {
  if (slug.length <= maxLength) {
    return slug;
  }

  return slug.substring(0, maxLength).replace(/-[^-]*$/, '');
}
