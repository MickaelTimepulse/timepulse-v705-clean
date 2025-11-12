import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function importFrenchCities() {
  try {
    console.log('🇫🇷 Récupération des communes françaises depuis l\'API officielle...');

    const response = await fetch('https://geo.api.gouv.fr/communes?fields=nom,code,codesPostaux&format=json');
    const communes = await response.json();

    console.log(`✅ ${communes.length} communes récupérées`);

    // Transformer les données pour la base
    const cities = [];
    for (const commune of communes) {
      // Une commune peut avoir plusieurs codes postaux
      for (const codePostal of commune.codesPostaux) {
        cities.push({
          city_name: commune.nom,
          postal_code: codePostal,
          country_code: 'FRA',
          country_name: 'France'
        });
      }
    }

    console.log(`📦 ${cities.length} entrées à importer (avec codes postaux multiples)`);

    // Supprimer les anciennes villes françaises via RPC
    console.log('🗑️ Suppression des anciennes villes françaises...');
    const { error: deleteError } = await supabase.rpc('delete_cities_by_country', {
      p_country_code: 'FRA'
    });

    if (deleteError) {
      console.error('❌ Erreur lors de la suppression:', deleteError);
      throw deleteError;
    }

    // Importer par batch de 1000 via RPC
    const batchSize = 1000;
    let imported = 0;

    for (let i = 0; i < cities.length; i += batchSize) {
      const batch = cities.slice(i, i + batchSize);

      const { error: insertError } = await supabase.rpc('import_french_cities', {
        cities_data: batch
      });

      if (insertError) {
        console.error(`❌ Erreur lors de l'insertion du batch ${i / batchSize + 1}:`, insertError);
        throw insertError;
      }

      imported += batch.length;
      console.log(`✅ Importé: ${imported}/${cities.length}`);
    }

    console.log('🎉 Import terminé avec succès !');

    // Vérification
    const { count } = await supabase
      .from('european_cities')
      .select('*', { count: 'exact', head: true })
      .eq('country_code', 'FRA');

    console.log(`📊 Total de villes françaises dans la base: ${count}`);

  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

importFrenchCities();
