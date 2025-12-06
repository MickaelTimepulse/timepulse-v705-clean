import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { parse } from 'csv-parse/sync';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function updateAmountsFromCSV() {
  try {
    console.log('📂 Lecture du fichier CSV...');

    // Lire le CSV
    const csvContent = readFileSync('./CARQUEFOU.csv', 'utf-8');
    const records = parse(csvContent, {
      columns: false,
      skip_empty_lines: true,
      bom: true,
      relaxColumnCount: true
    });

    console.log(`✅ ${records.length} lignes trouvées dans le CSV\n`);

    // Skip header row
    const dataRows = records.slice(1);

    let updated = 0;
    let notFound = 0;
    let errors = 0;

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];

      // Colonne G = Nom (index 6)
      // Colonne H = Prénom (index 7)
      // Colonne K = Date de naissance (index 10)
      // Colonne AH = Montant (index 33 si A=0, B=1, etc.)

      const lastName = row[6]?.trim();
      const firstName = row[7]?.trim();
      const birthDate = row[10]?.trim();
      const amount = row[33]?.trim(); // Colonne AH

      if (!lastName || !firstName || !birthDate || !amount) {
        console.log(`⚠️  Ligne ${i + 2}: Données manquantes - ignorée`);
        continue;
      }

      // Convertir le montant (peut être "25,00" ou "25.00")
      const amountValue = parseFloat(amount.replace(',', '.'));

      if (isNaN(amountValue)) {
        console.log(`⚠️  Ligne ${i + 2}: Montant invalide "${amount}" - ignorée`);
        continue;
      }

      // Chercher l'inscription dans la base
      const { data: entries, error: searchError } = await supabase
        .from('entries')
        .select('id, first_name, last_name, birth_date, amount')
        .ilike('last_name', lastName)
        .ilike('first_name', firstName)
        .eq('birth_date', birthDate);

      if (searchError) {
        console.log(`❌ Ligne ${i + 2}: Erreur recherche - ${searchError.message}`);
        errors++;
        continue;
      }

      if (!entries || entries.length === 0) {
        console.log(`⚠️  Ligne ${i + 2}: Non trouvé - ${firstName} ${lastName} (${birthDate})`);
        notFound++;
        continue;
      }

      if (entries.length > 1) {
        console.log(`⚠️  Ligne ${i + 2}: ${entries.length} inscriptions trouvées pour ${firstName} ${lastName} - mise à jour de toutes`);
      }

      // Mettre à jour chaque inscription trouvée
      for (const entry of entries) {
        const { error: updateError } = await supabase
          .from('entries')
          .update({ amount: amountValue })
          .eq('id', entry.id);

        if (updateError) {
          console.log(`❌ Ligne ${i + 2}: Erreur mise à jour - ${updateError.message}`);
          errors++;
        } else {
          console.log(`✅ Ligne ${i + 2}: ${firstName} ${lastName} - ${entry.amount || 0}€ → ${amountValue}€`);
          updated++;
        }
      }
    }

    console.log('\n📊 RÉSUMÉ:');
    console.log(`   ✅ ${updated} inscriptions mises à jour`);
    console.log(`   ⚠️  ${notFound} inscriptions non trouvées`);
    console.log(`   ❌ ${errors} erreurs`);

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

updateAmountsFromCSV();
