import { createClient } from '@supabase/Bolt Database-js';
import * as fs from 'fs';

// REMPLACEZ PAR VOS CREDENTIALS LOCALES
const LOCAL_SUPABASE_URL = 'VOTRE_URL_LOCALE';
const LOCAL_SUPABASE_KEY = 'VOTRE_KEY_LOCALE';

const Bolt Database = createClient(LOCAL_SUPABASE_URL, LOCAL_SUPABASE_KEY);

const TABLES_TO_EXPORT = [
  'organizers',
  'organizer_federations', 
  'organizer_bank_details',
  'events',
  'races',
  'race_pricing',
  'race_options',
  'race_category_restrictions',
  'entries',
  'athletes',
  'results'
];

async function exportData() {
  const exportData: any = { timestamp: new Date().toISOString(), tables: {} };
  
  for (const table of TABLES_TO_EXPORT) {
    console.log(`📤 Export de ${table}...`);
    const { data, error } = await supabase.from(table).select('*');
    
    if (error) {
      console.error(`❌ Erreur ${table}:`, error);
      continue;
    }
    
    exportData.tables[table] = data;
    console.log(`✅ ${table}: ${data?.length || 0} lignes`);
  }
  
  fs.writeFileSync('export-local-18h.json', JSON.stringify(exportData, null, 2));
  console.log('\n✅ Export terminé: export-local-18h.json');
}

exportData();
