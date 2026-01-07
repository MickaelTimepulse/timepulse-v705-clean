import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

console.log('🧪 Test de vérification FFA pour la licence 929636\n');

// Récupérer les credentials FFA
const { data: credentials, error: credError } = await supabase
  .rpc('get_ffa_credentials')
  .maybeSingle();

if (credError || !credentials) {
  console.error('❌ Erreur récupération credentials FFA:', credError?.message);
  process.exit(1);
}

console.log('✅ Credentials FFA récupérées');
console.log(`   UID: ${credentials.uid}\n`);

// Appeler l'edge function
const edgeFunctionUrl = `${process.env.VITE_SUPABASE_URL}/functions/v1/ffa-verify-athlete`;

const requestPayload = {
  uid: credentials.uid,
  mdp: credentials.password,
  numrel: '929636',
  nom: 'FOURCHEROT',
  prenom: 'MICKAEL',
  sexe: 'M',
  date_nai: '1974',
  cnil_web: 'O',
  cmpcod: '12121212',
  cmpdate: '10/05/2026'
};

console.log('📤 Requête envoyée à l\'API FFA:');
console.log(JSON.stringify(requestPayload, null, 2));
console.log('');

try {
  const response = await fetch(edgeFunctionUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.VITE_SUPABASE_ANON_KEY}`
    },
    body: JSON.stringify(requestPayload)
  });

  const result = await response.json();

  console.log('📥 Réponse reçue:');
  console.log(JSON.stringify(result, null, 2));
  console.log('');

  if (result.connected && result.details) {
    console.log('✅ Connexion réussie !');
    console.log('');

    if (result.details.test_athlete) {
      const athlete = result.details.test_athlete;

      console.log('👤 Informations athlète:');
      console.log(`   Licence: ${athlete.numrel || 'N/A'}`);
      console.log(`   Nom: ${athlete.nom || 'N/A'}`);
      console.log(`   Prénom: ${athlete.prenom || 'N/A'}`);
      console.log(`   Sexe: ${athlete.sexe || 'N/A'}`);
      console.log(`   Date naissance: ${athlete.date_nai || 'N/A'}`);
      console.log(`   Catégorie: ${athlete.catcod || 'N/A'}`);
      console.log('');

      console.log('🏢 Informations club:');
      console.log(`   Numéro club: ${athlete.club_numero || 'VIDE'}`);
      console.log(`   Nom abrégé: ${athlete.club_abrege || 'VIDE'}`);
      console.log(`   Nom complet: ${athlete.club_complet || 'VIDE'}`);
      console.log(`   Club final: ${athlete.club || 'VIDE'}`);
      console.log('');

      console.log('📊 Flags:');
      console.log(`   Info exacte: ${result.details.flags?.info_exact ? 'OUI' : 'NON'}`);
      console.log(`   Relation valide: ${result.details.flags?.relation_valide ? 'OUI' : 'NON'}`);
      console.log(`   Muté: ${result.details.flags?.mute ? 'OUI' : 'NON'}`);
      console.log(`   PSP requis: ${result.details.flags?.pps_requis ? 'OUI' : 'NON'}`);
      console.log('');

      console.log('📋 Message retour FFA:', result.details.msg_retour || 'N/A');
      console.log('');

      if (result.details.csv_raw) {
        console.log('📄 CSV brut de la FFA:');
        console.log(result.details.csv_raw);
        console.log('');

        const fields = result.details.csv_raw.split(',');
        console.log(`   Nombre de champs: ${fields.length}`);
        console.log(`   Champ [16] (STRCODNUM_CLU): "${fields[16] || ''}"`);
        console.log(`   Champ [17] (STRNOMABR_CLU): "${fields[17] || ''}"`);
        console.log(`   Champ [18] (STRNOM_CLU): "${fields[18] || ''}"`);
      }

      if (!athlete.club || athlete.club === '') {
        console.log('');
        console.log('⚠️ PROBLÈME DÉTECTÉ:');
        console.log('   Le champ "club" est vide alors que la vérification a réussi.');
        console.log('   Causes possibles:');
        console.log('   1. La licence n\'a pas de club associé dans la base FFA');
        console.log('   2. L\'athlète est muté et son club n\'est pas encore mis à jour');
        console.log('   3. Les champs club (16, 17, 18) sont vides dans la réponse FFA');
      } else {
        console.log('');
        console.log('✅ Le club a été correctement extrait !');
      }
    }
  } else {
    console.log('❌ Échec de la vérification');
    console.log(`   Message: ${result.message || 'Erreur inconnue'}`);
  }
} catch (error) {
  console.error('❌ Erreur lors de l\'appel:', error.message);
}
