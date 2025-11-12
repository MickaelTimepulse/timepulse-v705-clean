/**
 * Script d'import des athlètes depuis un fichier CSV
 *
 * Format attendu du CSV :
 * prenom,nom,date_naissance,sexe,email,nationalite,ville,code_postal,club
 *
 * Exemple :
 * Jean,Dupont,1985-03-15,M,jean.dupont@email.com,FRA,Paris,75001,CA Paris
 *
 * Usage :
 * node import-athletes.js athletes.csv
 *
 * Options :
 * --batch-size=1000  : Taille des batchs (défaut: 1000)
 * --dry-run          : Test sans insertion
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import { parse } from 'csv-parse/sync';

// Configuration Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement manquantes : VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Arguments
const args = process.argv.slice(2);
const csvFile = args.find(arg => !arg.startsWith('--'));
const batchSize = parseInt(args.find(arg => arg.startsWith('--batch-size='))?.split('=')[1] || '1000');
const dryRun = args.includes('--dry-run');

if (!csvFile) {
  console.error('❌ Usage: node import-athletes.js <fichier.csv> [--batch-size=1000] [--dry-run]');
  process.exit(1);
}

// Fonction pour parser une date flexible
function parseDate(dateStr) {
  if (!dateStr) return null;

  // Format DD/MM/YYYY
  if (dateStr.includes('/')) {
    const [day, month, year] = dateStr.split('/');
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  // Format YYYY-MM-DD (déjà bon)
  if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return dateStr;
  }

  return null;
}

// Fonction pour normaliser le sexe
function normalizeGender(gender) {
  if (!gender) return 'M';
  const g = gender.toUpperCase().trim();
  if (g === 'F' || g === 'FEMME' || g === 'FEMALE' || g === 'W') return 'F';
  if (g === 'M' || g === 'HOMME' || g === 'MALE') return 'M';
  return 'M';
}

// Fonction pour importer un batch d'athlètes avec création de compte
async function importBatch(athletes) {
  if (dryRun) {
    console.log('🔍 DRY RUN - Batch de', athletes.length, 'athlètes (non inséré)');
    console.log('Exemple:', athletes[0]);
    return { success: athletes.length, errors: 0, accounts_created: athletes.length, accounts_existed: 0 };
  }

  let success = 0;
  let errors = 0;
  let accountsCreated = 0;
  let accountsExisted = 0;

  for (const athlete of athletes) {
    try {
      const { data, error } = await supabase.rpc('create_athlete_with_account', {
        p_first_name: athlete.first_name,
        p_last_name: athlete.last_name,
        p_birthdate: athlete.birthdate,
        p_gender: athlete.gender,
        p_email: athlete.email,
        p_nationality: athlete.nationality,
        p_city: athlete.city,
        p_postal_code: athlete.postal_code,
        p_license_club: athlete.club,
        p_license_number: athlete.license_number,
        p_license_type: athlete.license_type,
      });

      if (error) {
        console.error(`❌ Erreur pour ${athlete.first_name} ${athlete.last_name}:`, error.message);
        errors++;
      } else {
        success++;
        if (data.existed) {
          accountsExisted++;
        } else if (data.user_id) {
          accountsCreated++;
        }
      }
    } catch (err) {
      console.error(`❌ Exception pour ${athlete.first_name} ${athlete.last_name}:`, err.message);
      errors++;
    }
  }

  return { success, errors, accounts_created: accountsCreated, accounts_existed: accountsExisted };
}

// Fonction principale
async function main() {
  console.log('🏃 Import des athlètes Timepulse');
  console.log('📁 Fichier:', csvFile);
  console.log('📦 Taille des batchs:', batchSize);
  console.log('🔍 Mode:', dryRun ? 'DRY RUN (test)' : 'PRODUCTION');
  console.log('');

  // Lire le fichier CSV
  let csvContent;
  try {
    csvContent = fs.readFileSync(csvFile, 'utf-8');
  } catch (err) {
    console.error('❌ Erreur de lecture du fichier:', err.message);
    process.exit(1);
  }

  // Parser le CSV
  let records;
  try {
    records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      bom: true, // Support UTF-8 BOM
      delimiter: ';', // Support point-virgule (format français)
      relax_column_count: true, // Tolérer des colonnes manquantes
    });
  } catch (err) {
    console.error('❌ Erreur de parsing CSV:', err.message);
    process.exit(1);
  }

  console.log(`📊 ${records.length} athlètes trouvés dans le CSV`);
  console.log('');

  // Mapper les colonnes (adapter selon ton CSV)
  const athletes = records.map((record, index) => {
    // Adapter les noms de colonnes selon ton fichier CSV
    const firstName = record['Prénom'] || record.prenom || record.first_name || record.Prenom || record.FirstName;
    const lastName = record.Nom || record.nom || record.last_name || record.LastName;
    const birthdate = parseDate(
      record['Date de naissance'] || record.date_naissance || record.birthdate || record.DateNaissance || record.Birthdate
    );
    const gender = normalizeGender(
      record.Sexe || record.sexe || record.gender || record.Gender
    );
    const email = record.Email || record.email || null;

    if (!firstName || !lastName || !birthdate) {
      console.warn(`⚠️  Ligne ${index + 1} ignorée : données manquantes`, record);
      return null;
    }

    // Ignorer les lignes sans email (on ne peut pas créer de compte)
    if (!email || email.trim() === '') {
      console.warn(`⚠️  Ligne ${index + 1} ignorée : pas d'email`, { firstName, lastName });
      return null;
    }

    return {
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      birthdate,
      gender,
      email: email.trim(),
      nationality: record['Nationalité'] || record.nationalite || record.nationality || record.Nationalite || 'FRA',
      city: record.Ville || record.ville || record.city || null,
      postal_code: record.CP || record.code_postal || record.postal_code || record.CodePostal || null,
      club: record['Club/Asso'] || record.club || record.Club || record.license_club || null,
      license_number: record['N° de licence'] || record.numero_licence || record.license_number || null,
      license_type: record['Type de licence'] || record.type_licence || record.license_type || null,
    };
  }).filter(Boolean);

  console.log(`✅ ${athletes.length} athlètes valides à importer`);
  console.log('');

  // Importer par batchs
  let totalSuccess = 0;
  let totalErrors = 0;

  for (let i = 0; i < athletes.length; i += batchSize) {
    const batch = athletes.slice(i, i + batchSize);
    const batchNum = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(athletes.length / batchSize);

    console.log(`📦 Batch ${batchNum}/${totalBatches} (${batch.length} athlètes)...`);

    const { success, errors, accounts_created, accounts_existed } = await importBatch(batch);
    totalSuccess += success;
    totalErrors += errors;

    console.log(`   ✅ ${success} succès, ❌ ${errors} erreurs`);
    if (!dryRun) {
      console.log(`   👤 ${accounts_created} comptes créés, ♻️  ${accounts_existed} déjà existants`);
    }
    console.log('');

    // Petite pause pour ne pas surcharger la base
    if (!dryRun && i + batchSize < athletes.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  // Résumé
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🎉 Import terminé !');
  console.log(`   Total athlètes : ${athletes.length}`);
  console.log(`   ✅ Succès : ${totalSuccess}`);
  console.log(`   ❌ Erreurs : ${totalErrors}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  if (!dryRun && totalSuccess > 0) {
    console.log('');
    console.log('💡 Prochaines étapes :');
    console.log('   1. Importer les résultats historiques');
    console.log('   2. Lier les résultats aux athlètes (matching nom/prénom/date)');
    console.log('   3. Recalculer les indices Timepulse');
    console.log('');
    console.log('   Commandes SQL :');
    console.log('   SELECT recalculate_all_indices(1000);');
  }
}

// Exécuter
main().catch(err => {
  console.error('❌ Erreur fatale:', err);
  process.exit(1);
});
