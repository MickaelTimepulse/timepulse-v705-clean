import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const BACKUP_DIR = 'backups';

if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const TABLES = [
  'events',
  'races',
  'organizers',
  'athletes',
  'registrations',
  'entries',
  'email_logs',
  'homepage_features',
  'service_pages',
  'settings',
  'carpooling_offers',
  'carpooling_bookings',
  'bib_exchange_listings',
  'race_category_restrictions',
  'race_options',
  'registration_options',
  'invitations',
  'audit_logs',
];

async function backupTable(tableName: string) {
  console.log(`🔄 Backup de la table: ${tableName}`);

  try {
    const { data, error } = await supabase.from(tableName).select('*');

    if (error) {
      console.error(`❌ Erreur pour ${tableName}:`, error.message);
      return;
    }

    const date = new Date().toISOString().split('T')[0].replace(/-/g, '_');
    const filename = path.join(BACKUP_DIR, `backup_${tableName}_${date}.json`);

    fs.writeFileSync(filename, JSON.stringify(data, null, 2));
    console.log(`✅ Sauvegardé: ${filename} (${data?.length || 0} lignes)`);
  } catch (err) {
    console.error(`❌ Erreur lors du backup de ${tableName}:`, err);
  }
}

async function backupAll() {
  console.log('🚀 Démarrage du backup complet...\n');

  const date = new Date().toISOString().split('T')[0].replace(/-/g, '_');
  const allData: Record<string, any> = {};

  for (const table of TABLES) {
    await backupTable(table);

    const { data } = await supabase.from(table).select('*');
    if (data) {
      allData[table] = data;
    }
  }

  const fullBackupFile = path.join(BACKUP_DIR, `backup_complete_${date}.json`);
  fs.writeFileSync(fullBackupFile, JSON.stringify(allData, null, 2));

  console.log(`\n✅ Backup complet terminé: ${fullBackupFile}`);
}

async function backupMigrations() {
  console.log('🔄 Copie des migrations...');

  const migrationsDir = 'supabase/migrations';
  const date = new Date().toISOString().split('T')[0].replace(/-/g, '_');
  const backupMigrationsDir = path.join(BACKUP_DIR, `migrations_${date}`);

  if (fs.existsSync(migrationsDir)) {
    fs.cpSync(migrationsDir, backupMigrationsDir, { recursive: true });
    console.log(`✅ Migrations sauvegardées: ${backupMigrationsDir}`);
  }
}

const command = process.argv[2];

async function main() {
  if (!command) {
    console.log('📦 Script de backup Timepulse (API Supabase)');
    console.log('Usage:');
    console.log('  npm run backup [table_name]  - Backup d\'une table spécifique');
    console.log('  npm run backup all           - Backup de toutes les tables');
    console.log('  npm run backup migrations    - Backup des migrations');
    process.exit(1);
  }

  if (command === 'all') {
    await backupAll();
    await backupMigrations();
  } else if (command === 'migrations') {
    await backupMigrations();
  } else {
    await backupTable(command);
  }
}

main();
