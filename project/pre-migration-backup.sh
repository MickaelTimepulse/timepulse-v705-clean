#!/bin/bash

# Script de backup à exécuter AVANT toute migration critique
# Usage: ./pre-migration-backup.sh "nom_de_la_migration"

set -e

if [ -z "$1" ]; then
    echo "❌ Erreur : Vous devez spécifier un nom pour cette migration"
    echo "Usage: ./pre-migration-backup.sh \"nom_de_la_migration\""
    exit 1
fi

MIGRATION_NAME=$1
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="backups/pre-migration-${MIGRATION_NAME}-${TIMESTAMP}"

echo "🚨 BACKUP PRÉ-MIGRATION"
echo "======================="
echo "Migration : $MIGRATION_NAME"
echo "Date      : $(date)"
echo "Backup dir: $BACKUP_DIR"
echo ""

# Créer le dossier de backup
mkdir -p "$BACKUP_DIR"

# 1. Backup complet de la base de données via API
echo "📦 [1/5] Backup de toutes les tables via API Supabase..."
npm run backup:full
cp -r backups/*.json "$BACKUP_DIR/" 2>/dev/null || true

# 2. Copie des migrations existantes
echo "📄 [2/5] Copie des migrations SQL..."
cp -r supabase/migrations "$BACKUP_DIR/"

# 3. Snapshot du code source
echo "💾 [3/5] Création d'un snapshot du code..."
tar -czf "$BACKUP_DIR/code-snapshot.tar.gz" \
    --exclude=node_modules \
    --exclude=dist \
    --exclude=backups \
    --exclude=.git \
    .

# 4. Git commit automatique
echo "📝 [4/5] Création d'un commit Git..."
git add .
git commit -m "Pre-migration backup: $MIGRATION_NAME - $TIMESTAMP" || echo "Rien à commiter"

# 5. Créer un fichier de métadonnées
echo "📋 [5/5] Création des métadonnées..."
cat > "$BACKUP_DIR/backup-info.txt" <<EOF
BACKUP PRÉ-MIGRATION
====================

Migration  : $MIGRATION_NAME
Date       : $(date)
Timestamp  : $TIMESTAMP
Git commit : $(git rev-parse HEAD 2>/dev/null || echo "N/A")
Git branch : $(git branch --show-current 2>/dev/null || echo "N/A")

Tables sauvegardées :
$(ls -1 $BACKUP_DIR/*.json 2>/dev/null | wc -l) fichiers JSON

Migrations copiées :
$(ls -1 $BACKUP_DIR/migrations/*.sql 2>/dev/null | wc -l) fichiers SQL

Contenu :
- Données des tables (JSON)
- Migrations SQL complètes
- Snapshot du code source (tar.gz)
- Commit Git

Pour restaurer :
1. Voir le fichier RESTORATION_GUIDE.md
2. Ou exécuter : ./restore-backup.sh "$BACKUP_DIR"
EOF

echo ""
echo "✅ BACKUP TERMINÉ AVEC SUCCÈS"
echo "=============================="
echo "📁 Emplacement : $BACKUP_DIR"
echo ""
echo "⚠️  IMPORTANT : Avant de continuer avec la migration :"
echo "   1. Vérifiez que le backup est complet"
echo "   2. Testez la migration sur une copie si possible"
echo "   3. Gardez ce terminal ouvert pendant la migration"
echo ""
echo "Contenu du backup :"
ls -lh "$BACKUP_DIR"
echo ""
echo "🚀 Vous pouvez maintenant procéder à la migration : $MIGRATION_NAME"
