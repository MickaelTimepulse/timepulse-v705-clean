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

    const csvContent = readFileSync('./CARQUEFOU.csv', 'utf-8');
    const records = parse(csvContent, {
      columns: false,
      skip_empty_lines: true,
      bom: true,
      relaxColumnCount: true
    });

    console.log(`✅ ${records.length} lignes trouvées dans le CSV\n`);

    const dataRows = records.slice(1);
    let updated = 0;
    let notFound = 0;
    let errors = 0;

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      const lastName = row[6]?.trim();
      const firstName = row[7]?.trim();
      const birthDate = row[10]?.trim();
      const amount = row[33]?.trim();

      if (!lastName || !firstName || !birthDate || !amount) {
        continue;
      }

      const amountValue = parseFloat(amount.replace(',', '.'));

      if (isNaN(amountValue)) {
        continue;
      }

      const { data: entries, error: searchError } = await supabase
        .from('entries')
        .select('id, first_name, last_name, birth_date, amount')
        .ilike('last_name', lastName)
        .ilike('first_name', firstName)
        .eq('birth_date', birthDate);

      if (searchError) {
        console.log(`❌ Erreur recherche - ${searchError.message}`);
        errors++;
        continue;
      }

      if (!entries || entries.length === 0) {
        console.log(`⚠️  Non trouvé - ${firstName} ${lastName} (${birthDate})`);
        notFound++;
        continue;
      }

      for (const entry of entries) {
        const { error: updateError } = await supabase
          .from('entries')
          .update({ amount: amountValue })
          .eq('id', entry.id);

        if (updateError) {
          console.log(`❌ Erreur - ${updateError.message}`);
          errors++;
        } else {
          console.log(`✅ ${firstName} ${lastName} - ${entry.amount || 0}€ → ${amountValue}€`);
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
