#!/bin/bash
# Script pour corriger le domaine dans tous les fichiers

echo "🔧 Correction du domaine timepulse.fr → timepulsesports.com"
echo ""

# Liste des fichiers à corriger
files=(
    "deploy-complete.sh"
    "deploy-complete.bat"
    "DEPLOY-NOW.md"
    "README-DEPLOIEMENT.md"
    "BACKUP-REPORT-2025-11-30.md"
    "LANCEMENT-DEPLOIEMENT.txt"
    "SUPABASE-BACKUP-GUIDE.md"
)

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        # Créer une copie de backup
        cp "$file" "${file}.backup"

        # Remplacer timepulse.fr par timepulsesports.com
        perl -pi -e 's/timepulse\.fr/timepulsesports.com/g' "$file"
        perl -pi -e 's/www\.timepulsesports\.com/timepulsesports.com/g' "$file"

        echo "✅ $file"
    fi
done

echo ""
echo "✅ Correction terminée !"
echo ""
echo "Pour vérifier :"
echo "  grep -r 'timepulse.fr' *.md *.txt *.sh *.bat"
