#!/bin/bash

echo "🔧 Fix GitHub App.tsx - Restoration du vrai code"
echo "================================================"
echo ""

# Vérifie qu'on est dans un repo git
if [ ! -d .git ]; then
  echo "❌ Erreur : Pas dans un dépôt git"
  exit 1
fi

# Vérifie que le fichier existe
if [ ! -f "src/App.tsx" ]; then
  echo "❌ Erreur : src/App.tsx introuvable"
  exit 1
fi

echo "✅ Fichier src/App.tsx trouvé"
echo ""

# Affiche un extrait du fichier pour confirmation
echo "📄 Extrait du fichier actuel :"
echo "---"
head -20 src/App.tsx
echo "..."
echo ""

# Demande confirmation
read -p "❓ Ce fichier contient-il le vrai code React Router ? (o/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[OoYy]$ ]]; then
  echo "❌ Annulé par l'utilisateur"
  exit 1
fi

echo ""
echo "🚀 Push vers GitHub..."
echo ""

# Add, commit et push
git add src/App.tsx
git commit -m "Fix: Restore production App.tsx with all routes"
git push origin main

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Push réussi !"
  echo ""
  echo "📋 Prochaines étapes :"
  echo "1. Va sur https://vercel.com/timepulse"
  echo "2. Attends 2-3 minutes que le déploiement se termine"
  echo "3. Vérifie ton site en production"
  echo ""
else
  echo ""
  echo "❌ Erreur lors du push"
  echo "Essaie manuellement :"
  echo "  git add src/App.tsx"
  echo "  git commit -m 'Fix: Restore production App.tsx'"
  echo "  git push origin main"
  echo ""
fi
