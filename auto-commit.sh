#!/bin/bash

# Script de commit automatique quotidien
# À ajouter dans crontab avec : crontab -e
# 0 0 * * * cd /chemin/vers/projet && ./auto-commit.sh

DATE=$(date +"%Y-%m-%d %H:%M:%S")
BACKUP_DATE=$(date +"%Y-%m-%d")

echo "🚀 Début du backup automatique - $DATE"

# Étape 1 : Backup complet de la base de données
echo "📦 Création du backup de la base de données..."
npm run backup:full

# Étape 2 : Vérifier s'il y a des changements
if [ -z "$(git status --porcelain)" ]; then
    echo "ℹ️  Aucun changement à commiter"
    exit 0
fi

# Étape 3 : Ajouter tous les fichiers
git add .

# Étape 4 : Créer le commit
git commit -m "Auto-backup: $DATE"

# Étape 5 : Pousser vers le remote (si configuré)
if git remote get-url origin >/dev/null 2>&1; then
    echo "📤 Push vers le repository distant..."
    git push origin main
    echo "✅ Push réussi"
else
    echo "⚠️  Aucun remote configuré. Commit local uniquement."
fi

echo "✅ Backup automatique terminé - $DATE"
