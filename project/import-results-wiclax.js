/**
 * Script d'import des résultats depuis un fichier HTML Wiclax
 * Usage: node import-results-wiclax.js <fichier.html> <race_id>
 */

const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// Configuration Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// ID de la course (5 km de RUN IN VARADES)
const RACE_ID = '58ca2d1c-d4b8-4b36-ae4b-0bbad96af5cc';

async function parseWiclaxHTML(htmlContent) {
  const results = [];

  // Regex pour extraire les lignes du tableau
  const rowRegex = /<tr><td class="g">(\d+)<td class="g">(\d+)<td>([^<]+)<td>([^<]*)<td>([A-Z]{3})<td>([MF])<td>([^<]+)<td>([^<]*)<td>([0-9:]+)<td>([0-9,]+)<td[^>]*>([^<]*)<\/tr>/g;

  let match;
  let position = 1;

  while ((match = rowRegex.exec(htmlContent)) !== null) {
    const [
      _,
      positionStr,
      bibNumber,
      athleteName,
      club,
      nationality,
      gender,
      category,
      splitTime,
      finishTime,
      avgSpeed,
      categoryRank
    ] = match;

    // Ne pas inclure les abandons (DNF)
    if (positionStr === 'DNF' || finishTime === 'Abandon') {
      continue;
    }

    results.push({
      race_id: RACE_ID,
      bib_number: parseInt(bibNumber),
      athlete_name: athleteName.trim(),
      nationality: nationality || null,
      gender: gender === 'M' ? 'M' : 'F',
      category: category.trim() || null,
      finish_time: finishTime.trim(),
      overall_rank: position,
      category_rank: parseInt(categoryRank.match(/(\d+)°/)?.[1]) || position,
      gender_rank: position, // On recalculera après
      status: 'finished',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    position++;
  }

  return results;
}

async function importResults(htmlFile) {
  try {
    console.log(`📖 Lecture du fichier ${htmlFile}...`);
    const htmlContent = fs.readFileSync(htmlFile, 'utf-8');

    console.log('🔍 Parsing des résultats...');
    const results = await parseWiclaxHTML(htmlContent);

    console.log(`✅ ${results.length} résultats trouvés`);

    if (results.length === 0) {
      console.error('❌ Aucun résultat trouvé dans le fichier');
      process.exit(1);
    }

    // Recalculer les rangs par genre
    const maleResults = results.filter(r => r.gender === 'M');
    const femaleResults = results.filter(r => r.gender === 'F');

    maleResults.forEach((r, idx) => {
      r.gender_rank = idx + 1;
    });

    femaleResults.forEach((r, idx) => {
      r.gender_rank = idx + 1;
    });

    console.log(`   - ${maleResults.length} hommes`);
    console.log(`   - ${femaleResults.length} femmes`);

    // Insérer les résultats par lots de 100
    console.log('💾 Insertion des résultats en base de données...');

    const batchSize = 100;
    for (let i = 0; i < results.length; i += batchSize) {
      const batch = results.slice(i, i + batchSize);

      const { data, error } = await supabase
        .from('results')
        .insert(batch);

      if (error) {
        console.error(`❌ Erreur lors de l'insertion du lot ${i / batchSize + 1}:`, error);
        throw error;
      }

      console.log(`   ✓ Lot ${Math.floor(i / batchSize) + 1}/${Math.ceil(results.length / batchSize)} inséré (${batch.length} résultats)`);
    }

    console.log(`\n✅ Import terminé avec succès : ${results.length} résultats importés`);

  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

// Exécution
if (require.main === module) {
  const htmlFile = process.argv[2];

  if (!htmlFile) {
    console.error('Usage: node import-results-wiclax.js <fichier.html>');
    process.exit(1);
  }

  if (!fs.existsSync(htmlFile)) {
    console.error(`❌ Fichier non trouvé: ${htmlFile}`);
    process.exit(1);
  }

  importResults(htmlFile);
}
