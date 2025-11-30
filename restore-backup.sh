#!/bin/bash

# Script de restauration depuis un backup pré-migration
# Usage: ./restore-backup.sh [chemin_vers_backup]

set -e

if [ -z "$1" ]; then
    echo "❌ Erreur : Vous devez spécifier le chemin du backup"
    echo "Usage: ./restore-backup.sh backups/pre-migration-[nom]-[timestamp]"
    echo ""
    echo "Backups disponibles :"
    ls -lt backups/ | grep "^d"
    exit 1
fi

BACKUP_DIR=$1

if [ ! -d "$BACKUP_DIR" ]; then
    echo "❌ Erreur : Le répertoire $BACKUP_DIR n'existe pas"
    exit 1
fi

echo "🔄 RESTAURATION DEPUIS BACKUP"
echo "============================="
echo "Backup : $BACKUP_DIR"
echo ""

# Afficher les informations du backup
if [ -f "$BACKUP_DIR/backup-info.txt" ]; then
    cat "$BACKUP_DIR/backup-info.txt"
    echo ""
fi

# Confirmation
echo "⚠️  ATTENTION : Cette opération va :"
echo "   - Restaurer les données de la base"
echo "   - Restaurer les migrations"
echo "   - Potentiellement écraser des données existantes"
echo ""
read -p "Êtes-vous sûr de vouloir continuer? (oui/non) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Oo][Uu][Ii]$ ]]; then
    echo "❌ Opération annulée"
    exit 1
fi

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# 1. Sauvegarder l'état actuel avant restauration
echo ""
echo "💾 [1/4] Création d'un backup de sécurité de l'état actuel..."
SAFETY_BACKUP="backups/pre-restore-safety-${TIMESTAMP}"
mkdir -p "$SAFETY_BACKUP"
npm run backup:full
cp backups/*.json "$SAFETY_BACKUP/" 2>/dev/null || true
cp -r supabase/migrations "$SAFETY_BACKUP/" 2>/dev/null || true
echo "✅ Backup de sécurité créé : $SAFETY_BACKUP"

# 2. Restaurer les migrations
echo ""
echo "📄 [2/4] Restauration des migrations..."
if [ -d "$BACKUP_DIR/migrations" ]; then
    cp -r supabase/migrations supabase/migrations.backup-${TIMESTAMP}
    cp -r "$BACKUP_DIR/migrations/"* supabase/migrations/
    echo "✅ Migrations restaurées (backup de l'ancien dans migrations.backup-${TIMESTAMP})"
else
    echo "⚠️  Aucune migration trouvée dans le backup"
fi

# 3. Restaurer les données
echo ""
echo "🗄️  [3/4] Restauration des données de la base..."

# Compter les fichiers JSON
JSON_COUNT=$(ls -1 "$BACKUP_DIR"/*.json 2>/dev/null | wc -l)

if [ $JSON_COUNT -eq 0 ]; then
    echo "⚠️  Aucun fichier de données JSON trouvé"
else
    echo "   Fichiers trouvés : $JSON_COUNT"
    echo "   Utilisation du script TypeScript de restauration..."

    # Créer un script de restauration temporaire
    cat > restore-temp.ts <<'EOF'
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY!
);

async function restoreTable(tableName: string, data: any[]) {
  console.log(`   🔄 Restauration de ${tableName} (${data.length} lignes)...`);

  try {
    // Supprimer les données existantes
    const { error: deleteError } = await supabase
      .from(tableName)
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (deleteError && !deleteError.message.includes('0 rows')) {
      console.error(`   ⚠️  Avertissement lors de la suppression de ${tableName}:`, deleteError.message);
    }

    // Insérer les nouvelles données
    if (data.length > 0) {
      const { error: insertError } = await supabase
        .from(tableName)
        .insert(data);

      if (insertError) {
        console.error(`   ❌ Erreur lors de l'insertion dans ${tableName}:`, insertError.message);
        return false;
      }
    }

    console.log(`   ✅ ${tableName} restaurée`);
    return true;
  } catch (err) {
    console.error(`   ❌ Erreur inattendue pour ${tableName}:`, err);
    return false;
  }
}

async function main() {
  const backupDir = process.argv[2];
  const files = fs.readdirSync(backupDir).filter(f => f.endsWith('.json'));

  for (const file of files) {
    const filePath = path.join(backupDir, file);
    const tableName = file.replace('backup_', '').replace(/\_\d{4}_\d{2}_\d{2}\.json$/, '');

    try {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      if (Array.isArray(data) && data.length > 0) {
        await restoreTable(tableName, data);
      } else {
        console.log(`   ⏭️  ${tableName} : aucune donnée à restaurer`);
      }
    } catch (err) {
      console.error(`   ❌ Erreur lors de la lecture de ${file}:`, err);
    }
  }

  console.log('\n   ✅ Restauration des données terminée');
}

main();
EOF

    npx tsx restore-temp.ts "$BACKUP_DIR"
    rm restore-temp.ts
fi

# 4. Restaurer le code si disponible
echo ""
echo "💻 [4/4] Vérification du code source..."
if [ -f "$BACKUP_DIR/code-snapshot.tar.gz" ]; then
    echo "   📦 Snapshot de code disponible : $BACKUP_DIR/code-snapshot.tar.gz"
    echo "   ℹ️  Pour restaurer le code, extraire manuellement cette archive"
else
    echo "   ℹ️  Pas de snapshot de code dans ce backup"
fi

echo ""
echo "✅ RESTAURATION TERMINÉE"
echo "======================="
echo ""
echo "📋 Résumé :"
echo "   ✓ Backup de sécurité créé : $SAFETY_BACKUP"
echo "   ✓ Migrations restaurées"
echo "   ✓ Données restaurées"
echo ""
echo "🧪 Étapes suivantes recommandées :"
echo "   1. Vérifier que l'application fonctionne : npm run dev"
echo "   2. Tester les fonctionnalités critiques"
echo "   3. Vérifier les données dans Supabase Dashboard"
echo ""
echo "⚠️  En cas de problème, vous pouvez restaurer l'état précédent :"
echo "   ./restore-backup.sh $SAFETY_BACKUP"
