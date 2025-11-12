#!/bin/bash

# Script d'export complet du projet (code + BDD)
# Crée une archive prête à être téléchargée ou envoyée vers un stockage externe

set -e

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
EXPORT_NAME="timepulse-export-${TIMESTAMP}"
EXPORT_DIR="exports"
TEMP_DIR="$EXPORT_DIR/$EXPORT_NAME"

echo "📦 EXPORT COMPLET DU PROJET TIMEPULSE"
echo "====================================="
echo "Date : $(date)"
echo ""

# Créer les dossiers
mkdir -p "$TEMP_DIR"

# 1. Backup complet de la base de données
echo "🗄️  [1/6] Backup de la base de données..."
npm run backup:full
mkdir -p "$TEMP_DIR/database"
cp backups/*.json "$TEMP_DIR/database/" 2>/dev/null || true

# 2. Copie des migrations
echo "📄 [2/6] Copie des migrations..."
cp -r supabase/migrations "$TEMP_DIR/"

# 3. Export du code source
echo "💻 [3/6] Export du code source..."
mkdir -p "$TEMP_DIR/src"
cp -r src/* "$TEMP_DIR/src/"
cp -r public "$TEMP_DIR/" 2>/dev/null || true

# 4. Fichiers de configuration
echo "⚙️  [4/6] Copie des fichiers de configuration..."
cp package.json "$TEMP_DIR/"
cp package-lock.json "$TEMP_DIR/" 2>/dev/null || true
cp tsconfig.json "$TEMP_DIR/"
cp vite.config.ts "$TEMP_DIR/"
cp tailwind.config.js "$TEMP_DIR/"
cp postcss.config.js "$TEMP_DIR/"
cp index.html "$TEMP_DIR/"
cp .env.example "$TEMP_DIR/"
cp .gitignore "$TEMP_DIR/"

# 5. Documentation
echo "📚 [5/6] Copie de la documentation..."
cp *.md "$TEMP_DIR/" 2>/dev/null || true
cp -r docs "$TEMP_DIR/" 2>/dev/null || true

# 6. Informations sur l'export
echo "📋 [6/6] Création des métadonnées..."
cat > "$TEMP_DIR/EXPORT_INFO.txt" <<EOF
EXPORT COMPLET TIMEPULSE
========================

Date d'export : $(date)
Version       : $(git describe --tags 2>/dev/null || echo "N/A")
Commit Git    : $(git rev-parse HEAD 2>/dev/null || echo "N/A")
Branch Git    : $(git branch --show-current 2>/dev/null || echo "N/A")

CONTENU DE L'EXPORT
===================

📁 database/
   - Toutes les tables exportées en JSON
   - $(ls -1 $TEMP_DIR/database/*.json 2>/dev/null | wc -l) fichiers de données

📁 migrations/
   - Toutes les migrations SQL
   - $(ls -1 $TEMP_DIR/migrations/*.sql 2>/dev/null | wc -l) fichiers de migration

📁 src/
   - Code source complet de l'application
   - Composants React, pages, services, etc.

⚙️  Configuration
   - package.json, tsconfig, vite, tailwind, etc.
   - .env.example (template des variables d'environnement)

📚 Documentation
   - README, guides de backup et restauration

INSTRUCTIONS DE RESTAURATION
=============================

1. Installer les dépendances :
   npm install

2. Configurer les variables d'environnement :
   - Copier .env.example vers .env
   - Remplir les valeurs Supabase

3. Restaurer la base de données :
   - Voir RESTORATION_GUIDE.md pour les détails

4. Lancer le projet :
   npm run dev

SUPPORT
=======
Pour toute question : consulter BACKUP_GUIDE.md et RESTORATION_GUIDE.md
EOF

# Créer l'archive finale
echo ""
echo "🗜️  Compression de l'archive..."
cd "$EXPORT_DIR"
tar -czf "${EXPORT_NAME}.tar.gz" "$EXPORT_NAME"
ZIP_SIZE=$(du -h "${EXPORT_NAME}.tar.gz" | cut -f1)

# Nettoyer le dossier temporaire
rm -rf "$EXPORT_NAME"

cd ..

echo ""
echo "✅ EXPORT TERMINÉ AVEC SUCCÈS"
echo "============================="
echo "📦 Archive  : $EXPORT_DIR/${EXPORT_NAME}.tar.gz"
echo "📊 Taille   : $ZIP_SIZE"
echo ""
echo "Cette archive contient :"
echo "  ✓ Code source complet"
echo "  ✓ Base de données (JSON)"
echo "  ✓ Migrations SQL"
echo "  ✓ Configuration"
echo "  ✓ Documentation"
echo ""
echo "💾 Vous pouvez maintenant :"
echo "  - Télécharger cette archive"
echo "  - L'envoyer vers un cloud (Dropbox, Drive, etc.)"
echo "  - La copier sur un disque externe"
echo "  - La versionner dans un dépôt Git privé"
echo ""
echo "🔒 IMPORTANT : Cette archive contient des données sensibles."
echo "   Ne la partagez pas publiquement."
