import { supabase } from './supabase';

export interface Country {
  code: string;
  name: string;
  flag_url: string;
  alpha2_code: string;
}

let cachedCountries: Country[] = [];

export async function loadCountries(): Promise<Country[]> {
  if (cachedCountries.length > 0) {
    return cachedCountries;
  }

  const { data, error } = await supabase
    .from('countries')
    .select('*')
    .order('name');

  if (error) {
    console.error('Error loading countries:', error);
    return [];
  }

  cachedCountries = data || [];
  return cachedCountries;
}

export function getCountryByCode(code: string | null, countries?: Country[]): Country | null {
  if (!code) return null;
  const countryList = countries || cachedCountries;
  const upperCode = code.toUpperCase();

  // Try to match by 3-letter code first, then by 2-letter code
  return countryList.find(c => c.code === upperCode || c.alpha2_code === upperCode) || null;
}

export async function getCountryOptions(): Promise<{ value: string; label: string }[]> {
  const countries = await loadCountries();
  return countries.map(c => ({
    value: c.code,
    label: `${c.name} (${c.code})`
  }));
}
