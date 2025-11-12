export function calculateAge(birthDate: string, referenceDate: Date = new Date()): number {
  const birth = new Date(birthDate);
  let age = referenceDate.getFullYear() - birth.getFullYear();
  const monthDiff = referenceDate.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && referenceDate.getDate() < birth.getDate())) {
    age--;
  }

  return age;
}

export function getFFAReferenceDate(eventDate: Date): Date {
  const eventYear = eventDate.getFullYear();
  const september1st = new Date(eventYear, 8, 1);

  return september1st;
}

export function calculateFFACategory(birthDate: string, eventDate: Date = new Date()): string {
  const ffaReferenceDate = getFFAReferenceDate(eventDate);
  const age = calculateAge(birthDate, ffaReferenceDate);

  if (age < 7) return '';
  if (age >= 7 && age <= 9) return 'EA';
  if (age >= 10 && age <= 11) return 'PO';
  if (age >= 12 && age <= 13) return 'BE';
  if (age >= 14 && age <= 15) return 'MI';
  if (age >= 16 && age <= 17) return 'CA';
  if (age >= 18 && age <= 19) return 'JU';
  if (age >= 20 && age <= 22) return 'ES';
  if (age >= 23 && age <= 39) return 'SE';
  if (age >= 40 && age <= 44) return 'M0';
  if (age >= 45 && age <= 49) return 'M1';
  if (age >= 50 && age <= 54) return 'M2';
  if (age >= 55 && age <= 59) return 'M3';
  if (age >= 60 && age <= 64) return 'M4';
  if (age >= 65 && age <= 69) return 'M5';
  if (age >= 70 && age <= 74) return 'M6';
  if (age >= 75 && age <= 79) return 'M7';
  if (age >= 80 && age <= 84) return 'M8';
  if (age >= 85 && age <= 89) return 'M9';
  if (age >= 90) return 'M10';

  return '';
}

export async function checkCategoryRestriction(
  raceId: string,
  birthDate: string,
  eventDate: Date
): Promise<{ allowed: boolean; category: string; message?: string }> {
  const { supabase } = await import('./supabase');

  const { data: race } = await supabase
    .from('races')
    .select('is_ffa_race')
    .eq('id', raceId)
    .single();

  if (!race?.is_ffa_race) {
    return { allowed: true, category: '' };
  }

  const category = calculateFFACategory(birthDate, eventDate);

  if (!category) {
    return {
      allowed: false,
      category: '',
      message: 'Âge non éligible pour les catégories FFA'
    };
  }

  const { data: restrictions, error } = await supabase
    .from('race_category_restrictions')
    .select('category_code')
    .eq('race_id', raceId);

  if (error) {
    console.error('Error checking restrictions:', error);
    return { allowed: true, category };
  }

  if (!restrictions || restrictions.length === 0) {
    return { allowed: true, category };
  }

  const allowedCategories = restrictions.map(r => r.category_code);
  const isAllowed = allowedCategories.includes(category);

  return {
    allowed: isAllowed,
    category,
    message: isAllowed
      ? undefined
      : `Cette épreuve est réservée aux catégories suivantes : ${allowedCategories.join(', ')}`
  };
}
