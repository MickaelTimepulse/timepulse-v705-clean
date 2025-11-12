/**
 * Script pour lier les résultats existants aux athlètes
 *
 * Ce script parcourt tous les résultats qui n'ont pas encore d'athlete_id
 * et tente de les matcher avec la table athletes via (nom, prénom, date_naissance)
 *
 * Usage :
 * node link-results-to-athletes.js [--batch-size=1000] [--dry-run]
 */

import { createClient } from '@supabase/supabase-js';

// Configuration Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Arguments
const args = process.argv.slice(2);
const batchSize = parseInt(args.find(arg => arg.startsWith('--batch-size='))?.split('=')[1] || '1000');
const dryRun = args.includes('--dry-run');

// Fonction pour extraire prénom, nom et date de naissance d'un résultat
function extractAthleteInfo(result) {
  // Le nom de l'athlète est dans result.athlete_name
  // Format attendu : "Dupont Jean" ou "Jean Dupont"
  // On va devoir faire des hypothèses

  if (!result.athlete_name) return null;

  const parts = result.athlete_name.trim().split(/\s+/);
  if (parts.length < 2) return null;

  // Hypothèse : "Nom Prénom" (format FFA/FFTRI)
  const lastName = parts[0];
  const firstName = parts.slice(1).join(' ');

  return {
    first_name: firstName,
    last_name: lastName,
    // La date de naissance n'est pas dans results, donc on ne peut pas matcher exactement
    // Il faudra un matching approximatif ou avoir cette info dans entries
  };
}

// Fonction principale
async function main() {
  console.log('🔗 Liaison des résultats aux athlètes');
  console.log('📦 Taille des batchs:', batchSize);
  console.log('🔍 Mode:', dryRun ? 'DRY RUN (test)' : 'PRODUCTION');
  console.log('');

  // Compter les résultats sans athlete_id
  const { count, error: countError } = await supabase
    .from('results')
    .select('*', { count: 'exact', head: true })
    .is('athlete_id', null);

  if (countError) {
    console.error('❌ Erreur:', countError.message);
    process.exit(1);
  }

  console.log(`📊 ${count} résultats à traiter`);
  console.log('');

  if (count === 0) {
    console.log('✅ Aucun résultat à lier !');
    return;
  }

  // Stratégie : on va d'abord essayer de lier via entry_id
  console.log('📍 Étape 1 : Liaison via entry_id');
  console.log('   (lorsque le résultat est lié à une inscription)');
  console.log('');

  if (!dryRun) {
    // Lier les résultats qui ont un entry_id
    const { data: updateData, error: updateError } = await supabase.rpc('link_results_via_entries');

    if (updateError) {
      console.error('⚠️  Erreur lors de la liaison via entries:', updateError.message);
    } else {
      console.log('   ✅ Résultats liés via entries');
    }
  } else {
    console.log('   🔍 DRY RUN - Pas de mise à jour');
  }

  console.log('');
  console.log('📍 Étape 2 : Liaison via matching nom/prénom');
  console.log('   (nécessite que les athlètes aient été importés avec nom/prénom corrects)');
  console.log('');

  // Cette partie nécessite une fonction SQL pour faire le matching
  // On va créer cette fonction

  console.log('⚠️  ATTENTION : Le matching par nom/prénom seul est risqué sans date de naissance');
  console.log('   Il est recommandé d\'avoir la date de naissance dans les résultats ou entries');
  console.log('');
  console.log('💡 Solution recommandée :');
  console.log('   1. Ajouter birthdate dans la table entries');
  console.log('   2. Importer les résultats avec entry_id correctement renseigné');
  console.log('   3. Utiliser la fonction link_results_via_entries()');
}

// Exécuter
main().catch(err => {
  console.error('❌ Erreur fatale:', err);
  process.exit(1);
});
