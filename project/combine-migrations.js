import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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

console.log('🔄 Combinaison des migrations en un seul fichier...\n');

const migrationsDir = join(__dirname, 'supabase', 'migrations');
let combinedSql = `/*
  ============================================================================
  TIMEPULSE - TOUTES LES MIGRATIONS COMBINÉES
  ============================================================================

  Ce fichier combine toutes les migrations critiques pour initialiser
  la base de données Timepulse.

  📋 Instructions:
  1. Ouvrez: https://supabase.com/dashboard/project/fgstscztsighabpzzzix/sql/new
  2. Copiez TOUT le contenu de ce fichier
  3. Collez dans SQL Editor
  4. Cliquez sur "Run"

  ⚠️  Note: Certaines commandes peuvent échouer si les tables existent déjà.
      C'est normal ! Continuez l'exécution.

  Date de génération: ${new Date().toISOString()}
  Nombre de migrations: ${criticalMigrations.length}
  ============================================================================
*/

`;

let successCount = 0;
let errorCount = 0;

for (const migrationFile of criticalMigrations) {
  const migrationPath = join(migrationsDir, migrationFile);

  try {
    console.log(`📄 Lecture: ${migrationFile}`);
    const sql = readFileSync(migrationPath, 'utf8');

    combinedSql += `\n\n-- ============================================================================\n`;
    combinedSql += `-- Migration: ${migrationFile}\n`;
    combinedSql += `-- ============================================================================\n\n`;
    combinedSql += sql;
    combinedSql += `\n\n-- ✅ Fin de: ${migrationFile}\n`;

    successCount++;
  } catch (error) {
    console.error(`❌ Erreur: ${migrationFile} - ${error.message}`);
    errorCount++;
  }
}

// Écrire le fichier combiné
const outputPath = join(__dirname, 'combined-migrations.sql');
writeFileSync(outputPath, combinedSql, 'utf8');

console.log('\n' + '='.repeat(80));
console.log('✅ Fichier créé avec succès !');
console.log('='.repeat(80));
console.log(`📁 Fichier: ${outputPath}`);
console.log(`📊 Migrations combinées: ${successCount}`);
console.log(`❌ Erreurs: ${errorCount}`);
console.log(`📝 Taille: ${(combinedSql.length / 1024).toFixed(2)} KB`);

console.log('\n💡 Prochaines étapes:');
console.log('   1. Ouvrez le fichier: combined-migrations.sql');
console.log('   2. Copiez TOUT le contenu');
console.log('   3. Allez sur: https://supabase.com/dashboard/project/fgstscztsighabpzzzix/sql/new');
console.log('   4. Collez le contenu dans SQL Editor');
console.log('   5. Cliquez sur "Run"');
console.log('\n⚠️  Attention: L\'exécution peut prendre 1-2 minutes\n');
