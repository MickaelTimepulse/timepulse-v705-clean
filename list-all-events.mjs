import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

console.log('📋 Liste de tous les événements:\n');

const { data: events, error } = await supabase
  .from('events')
  .select('id, name, ffa_affiliated, ffa_calorg_code, start_date')
  .order('start_date', { ascending: false })
  .limit(20);

if (error) {
  console.error('❌ Erreur:', error.message);
  process.exit(1);
}

if (!events || events.length === 0) {
  console.log('❌ Aucun événement trouvé');
  process.exit(0);
}

console.log(`Total: ${events.length} événements\n`);
events.forEach((e, i) => {
  console.log(`${i + 1}. ${e.name}`);
  console.log(`   ID: ${e.id}`);
  console.log(`   Date: ${e.start_date || 'Non définie'}`);
  console.log(`   FFA Affilié: ${e.ffa_affiliated ? '✅ OUI' : '❌ NON'}`);
  console.log(`   Code CALORG: ${e.ffa_calorg_code || 'Non défini'}`);
  console.log('');
});

// Vérifier la configuration FFA
console.log(`\n🔧 Configuration FFA:\n`);
const { data: ffaConfig } = await supabase.rpc('get_ffa_credentials').maybeSingle();

if (ffaConfig && ffaConfig.uid && ffaConfig.password) {
  console.log('✅ Credentials FFA configurées');
  console.log(`   UID: ${ffaConfig.uid.substring(0, 4)}****`);
} else {
  console.log('❌ Credentials FFA non configurées');
}
