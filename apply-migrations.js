import { createClient } from '@supabase/supabase-js';
import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration Supabase
const supabaseUrl = 'https://fgstscztsighabpzzzix.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZnc3RzY3p0c2lnaGFicHp6eml4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyODkxMDczNiwiZXhwIjoyMDQ0NDg2NzM2fQ.TuqW-N0nR_EH1SxYtv-33bhAbTbEz_Ro5P9H1bUlb8s';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
});

// Liste des migrations critiques à appliquer dans l'ordre
const criticalMigrations = [
  '20251014201249_create_timepulse_schema.sql',
  '20251014205617_create_admin_users_fixed.sql',
  '20251014205715_add_update_password_function.sql',
  '20251014210000_create_organizer_module.sql',
  '20251015070040_create_license_types.sql',
  '20251015070105_create_pricing_periods.sql',
  '20251015070131_create_race_pricing.sql',
  '20251015070340_create_audit_logs.sql',
  '20251017055730_create_entries_module_v2.sql',
  '20251021165340_create_race_category_restrictions.sql',
  '20251021204147_create_carpooling_module.sql',
  '20251022085319_create_bib_exchange_module_v3.sql',
  '20251022130000_create_email_logs.sql',
  '20251023140000_create_results_module.sql',
  '20251024145052_create_payment_transactions_table.sql',
  '20251027115516_create_column_mappings_table.sql',
  '20251028063650_create_email_templates_table.sql',
  '20251101143601_20251101000001_create_athlete_ecosystem_v2.sql',
  '20251103161512_20251103160809_create_volunteer_management_fixed.sql',
  '20251108160639_create_footer_settings.sql',
  '20251108162017_create_static_pages.sql',
  '20251108170000_create_videos_table.sql',
  '20251113213448_20251113230000_create_event_characteristics.sql',
  '20251118000001_create_speaker_module.sql',
  '20251119055900_fix_pgcrypto_and_reset_password.sql',
  '20251119100000_add_admin_rls_policies_for_supabase_auth.sql'
];

// Fonction pour exécuter une requête SQL
async function executeSql(sql, migrationName) {
  try {
    // Note: Supabase n'expose pas directement d'endpoint pour exécuter du SQL brut
    // On doit utiliser une approche différente

    // Option 1: Utiliser l'API REST directement (nécessite une fonction RPC côté serveur)
    // Option 2: Utiliser le client HTTP pour appeler l'API de management

    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_migration`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({ sql })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Fonction principale
async function applyMigrations() {
  console.log('🚀 Début de l\'application des migrations Supabase\n');
  console.log('⚠️  IMPORTANT: Supabase ne permet pas d\'exécuter du SQL arbitraire via l\'API REST');
  console.log('⚠️  Vous devez utiliser le Dashboard Supabase ou la CLI\n');

  const migrationsDir = join(__dirname, 'supabase', 'migrations');

  let successCount = 0;
  let errorCount = 0;
  let skippedCount = 0;

  console.log('📋 Migrations à appliquer:\n');

  for (const migrationFile of criticalMigrations) {
    const migrationPath = join(migrationsDir, migrationFile);

    try {
      console.log(`\n${'='.repeat(80)}`);
      console.log(`📄 ${migrationFile}`);
      console.log(`${'='.repeat(80)}\n`);

      const sql = readFileSync(migrationPath, 'utf8');

      // Afficher un extrait de la migration
      const lines = sql.split('\n').slice(0, 10);
      console.log('Contenu (10 premières lignes):');
      console.log('─'.repeat(80));
      lines.forEach(line => console.log(line));
      console.log('─'.repeat(80));
      console.log(`\nTaille totale: ${sql.length} caractères, ${sql.split('\n').length} lignes\n`);

      // Pour l'instant, on affiche juste ce qu'il faut copier
      console.log('⚠️  COPIEZ ce SQL dans le Dashboard Supabase:');
      console.log(`   https://supabase.com/dashboard/project/fgstscztsighabpzzzix/sql/new\n`);

      skippedCount++;

    } catch (error) {
      console.error(`❌ Erreur lors de la lecture: ${error.message}\n`);
      errorCount++;
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('📊 RÉSUMÉ');
  console.log('='.repeat(80));
  console.log(`✅ Migrations réussies: ${successCount}`);
  console.log(`❌ Migrations échouées: ${errorCount}`);
  console.log(`⏭️  Migrations à appliquer manuellement: ${skippedCount}`);
  console.log('\n💡 Pour appliquer les migrations:');
  console.log('   1. Allez sur: https://supabase.com/dashboard/project/fgstscztsighabpzzzix/sql/new');
  console.log('   2. Copiez le contenu de chaque fichier de migration');
  console.log('   3. Collez dans SQL Editor');
  console.log('   4. Cliquez sur "Run"\n');
}

// Exécution
applyMigrations().catch(console.error);
