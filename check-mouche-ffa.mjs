import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

console.log('🔍 Recherche de l\'événement "Relais de la Mouche"...\n');

const { data: events, error } = await supabase
  .from('events')
  .select('id, name, ffa_affiliated, ffa_calorg_code, start_date')
  .ilike('name', '%mouche%');

if (error) {
  console.error('❌ Erreur:', error.message);
  process.exit(1);
}

if (!events || events.length === 0) {
  console.log('❌ Aucun événement "Relais de la Mouche" trouvé');
  process.exit(0);
}

console.log('📅 Événements trouvés:');
events.forEach(e => {
  console.log(`\nNom: ${e.name}`);
  console.log(`ID: ${e.id}`);
  console.log(`Date: ${e.start_date}`);
  console.log(`FFA Affilié: ${e.ffa_affiliated ? '✅ OUI' : '❌ NON'}`);
  console.log(`Code CALORG: ${e.ffa_calorg_code || 'Non défini'}`);
});

// Vérifier les courses de cet événement
if (events.length > 0) {
  const eventId = events[0].id;
  console.log(`\n\n🏃 Courses de l'événement "${events[0].name}":\n`);

  const { data: races } = await supabase
    .from('races')
    .select('id, name, team_config')
    .eq('event_id', eventId);

  if (races && races.length > 0) {
    races.forEach(r => {
      console.log(`- ${r.name} (ID: ${r.id})`);
      console.log(`  Team config: ${r.team_config ? 'Configuré (Relais)' : 'Non configuré'}`);
    });

    // Vérifier les segments de relais
    console.log(`\n🔗 Segments de relais:\n`);
    for (const race of races) {
      const { data: segments } = await supabase
        .from('relay_segments')
        .select('*')
        .eq('race_id', race.id)
        .order('segment_order');

      if (segments && segments.length > 0) {
        console.log(`Course: ${race.name}`);
        segments.forEach(s => {
          console.log(`  ${s.segment_order}. ${s.name} - ${s.distance}km (${s.discipline})`);
        });
      }
    }
  }
}

// Vérifier la configuration FFA
console.log(`\n\n🔧 Configuration FFA:\n`);
const { data: ffaConfig } = await supabase.rpc('get_ffa_credentials').maybeSingle();

if (ffaConfig && ffaConfig.uid && ffaConfig.password) {
  console.log('✅ Credentials FFA configurées');
  console.log(`   UID: ${ffaConfig.uid.substring(0, 4)}****`);
} else {
  console.log('❌ Credentials FFA non configurées');
}
