#!/bin/bash

# Script de déploiement rapide - Fix des routes Vercel
# Ce script push les changements sur GitHub et Vercel

echo "🚀 DÉPLOIEMENT - FIX DES ROUTES VERCEL"
echo "======================================="

# Vérifier si on est dans un dépôt git
if [ ! -d .git ]; then
  echo "❌ Erreur : Ce n'est pas un dépôt Git"
  echo "👉 Initialisez Git avec : git init"
  exit 1
fi

# Build local pour vérifier
echo ""
echo "📦 1. Build local de vérification..."
npm run build
if [ $? -ne 0 ]; then
  echo "❌ Le build a échoué"
  exit 1
fi
echo "✅ Build réussi"

# Commit des changements
echo ""
echo "📝 2. Commit des changements..."
git add vercel.json DEPLOY-FIX-ROUTES.md deploy-fix.sh
git commit -m "fix: configuration Vercel pour routes SPA"
echo "✅ Commit créé"

# Push sur GitHub
echo ""
echo "⬆️  3. Push sur GitHub..."
git push origin main
if [ $? -ne 0 ]; then
  echo "❌ Le push a échoué"
  echo "👉 Vérifiez votre connexion GitHub"
  exit 1
fi
echo "✅ Push réussi"

# Information sur le déploiement Vercel
echo ""
echo "🎉 SUCCÈS !"
echo "==========="
echo ""
echo "Vercel va automatiquement redéployer dans 1-2 minutes."
echo ""
echo "📊 Suivez le déploiement sur :"
echo "   https://vercel.com/dashboard"
echo ""
echo "🧪 Testez ensuite ces URLs :"
echo "   - https://timepulsesports.com/races/foulees-du-beluga-2025/results"
echo "   - https://timepulsesports.com/races/0ce4a635-57d6-4dad-b0f3-dc6fd334b5d6/results"
echo ""
