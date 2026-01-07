import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

console.log('🔍 Vérification de l\'Ekiden du Bout du Monde (course FFA)\n');

// Récupérer l'événement Ekiden
const { data: event, error: eventError } = await supabase
  .from('events')
  .select('*')
  .eq('id', '33a4b5e0-5f76-4f7d-8ef6-8a6fecedff9b')
  .single();

if (eventError || !event) {
  console.error('❌ Événement non trouvé');
  process.exit(1);
}

console.log('📅 Événement: ' + event.name);
console.log('   FFA Affilié: ' + (event.ffa_affiliated ? '✅ OUI' : '❌ NON'));
console.log('   Code CALORG: ' + (event.ffa_calorg_code || 'Non défini'));
console.log('   Date: ' + event.start_date);

// Récupérer les courses
const { data: races } = await supabase
  .from('races')
  .select('*')
  .eq('event_id', event.id);

console.log(`\n🏃 Courses (${races?.length || 0}):`);
if (races && races.length > 0) {
  for (const race of races) {
    console.log(`\n   - ${race.name} (ID: ${race.id})`);
    console.log(`     Distance: ${race.distance} km`);
    console.log(`     Config équipe: ${race.team_config ? '✅ Configuré' : '❌ Non configuré'}`);

    // Vérifier les segments de relais
    const { data: segments } = await supabase
      .from('relay_segments')
      .select('*')
      .eq('race_id', race.id)
      .order('segment_order');

    if (segments && segments.length > 0) {
      console.log(`     Segments de relais (${segments.length}):`);
      segments.forEach(s => {
        console.log(`       ${s.segment_order}. ${s.name} - ${s.distance}km (${s.discipline})`);
      });
    }

    // Vérifier les tarifs et types de licence
    const { data: pricing } = await supabase
      .from('race_pricing')
      .select('*, license_types(*), pricing_periods(*)')
      .eq('race_id', race.id);

    if (pricing && pricing.length > 0) {
      console.log(`     Tarifs configurés:`);
      pricing.forEach(p => {
        console.log(`       - ${p.license_types.name}: ${p.price_cents / 100}€ (${p.pricing_periods.name})`);
      });
    }
  }
}

// Vérifier la configuration FFA
console.log(`\n\n🔧 Configuration API FFA:\n`);
const { data: ffaConfig, error: ffaError } = await supabase
  .rpc('get_ffa_credentials')
  .maybeSingle();

if (ffaError) {
  console.error('❌ Erreur récupération config FFA:', ffaError.message);
} else if (ffaConfig && ffaConfig.uid && ffaConfig.password) {
  console.log('✅ Credentials FFA configurées et prêtes');
  console.log(`   UID: ${ffaConfig.uid.substring(0, 4)}****`);
  console.log(`   Password: ${'*'.repeat(ffaConfig.password.length)}`);
} else {
  console.log('❌ Credentials FFA non configurées');
}

// Tester la vérification d'une licence FFA
console.log(`\n\n🧪 Test de vérification FFA:\n`);

if (ffaConfig && ffaConfig.uid && ffaConfig.password) {
  console.log('📞 Appel de l\'edge function ffa-verify-athlete...');

  const edgeFunctionUrl = `${process.env.VITE_SUPABASE_URL}/functions/v1/ffa-verify-athlete`;

  try {
    const response = await fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        uid: ffaConfig.uid,
        mdp: ffaConfig.password,
        numrel: '929636',  // Licence de test
        nom: 'FOURCHEROT',
        prenom: 'MICKAEL',
        sexe: 'M',
        date_nai: '1974',
        cnil_web: 'O',
        cmpcod: event.ffa_calorg_code || '12121212',
        cmpdate: '10/05/2026'
      })
    });

    const result = await response.json();

    if (result.connected) {
      console.log('✅ Connexion FFA réussie !');

      if (result.details && result.details.test_athlete) {
        const athlete = result.details.test_athlete;
        console.log('\n📋 Informations de la licence:');
        console.log(`   Licence: ${athlete.license_number || 'N/A'}`);
        console.log(`   Club: ${athlete.club || 'Non trouvé'}`);
        console.log(`   Nom: ${athlete.last_name || 'N/A'}`);
        console.log(`   Prénom: ${athlete.first_name || 'N/A'}`);
        console.log(`   Catégorie: ${athlete.category || 'N/A'}`);
        console.log(`   Date expiration: ${athlete.license_expiry || 'N/A'}`);
      } else {
        console.log('⚠️ Licence non trouvée dans la base FFA');
      }
    } else {
      console.log('❌ Échec de la vérification FFA');
      console.log(`   Message: ${result.message || 'Erreur inconnue'}`);
    }
  } catch (error) {
    console.error('❌ Erreur appel API:', error.message);
  }
} else {
  console.log('⚠️ Impossible de tester : credentials FFA manquantes');
}

console.log(`\n\n✅ RÉSUMÉ:`);
console.log(`   - L'événement Ekiden est configuré FFA: ${event.ffa_affiliated ? 'OUI ✅' : 'NON ❌'}`);
console.log(`   - Les credentials FFA sont configurées: ${(ffaConfig && ffaConfig.uid) ? 'OUI ✅' : 'NON ❌'}`);
console.log(`   - L'API FFA est fonctionnelle: À vérifier via les tests`);
console.log(`\n   Pour une course FFA affiliée:`);
console.log(`   ✓ Licences FFA: Vérifiées automatiquement via l'API`);
console.log(`   ✓ PSP obligatoire: Pour les non-licenciés FFA`);
console.log(`   ✓ Nom du club: Rempli automatiquement après vérification`);
