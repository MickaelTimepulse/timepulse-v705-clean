#!/bin/bash

echo "🧹 Nettoyage des fichiers avec accents et espaces..."

# Supprimer de public/
cd public 2>/dev/null
if [ $? -eq 0 ]; then
  rm -f "OUT copy.png" 2>/dev/null
  rm -f "time copy.png" 2>/dev/null
  rm -f "image copy.png" 2>/dev/null
  rm -f "open water.jpeg" 2>/dev/null
  rm -f "open water copy.jpeg" 2>/dev/null
  rm -f "test import bdd.csv" 2>/dev/null
  rm -f "licence 2025 2026.jpg" 2>/dev/null
  rm -f "coureur victoire 1.jpeg" 2>/dev/null
  rm -f "coureur victoire 1 copy.jpeg" 2>/dev/null
  rm -f "course piste stade.jpeg" 2>/dev/null
  rm -f "tour eiffel coureur.jpeg" 2>/dev/null
  rm -f "course à pied masse 1.jpeg" 2>/dev/null
  rm -f "course à pied masse 2.jpeg" 2>/dev/null
  rm -f "AdobeStock_1549036275 copy.jpeg" 2>/dev/null
  echo "✅ public/ nettoyé"
  cd ..
fi

# Supprimer dist/ et rebuild
rm -rf dist
echo "✅ dist/ supprimé"

npm run build
echo "✅ Rebuild terminé"

echo ""
echo "📦 Fichiers restants dans public/:"
ls -1 public/*.{jpeg,jpg,png} 2>/dev/null || echo "Aucun fichier"

echo ""
echo "✅ Projet prêt pour déploiement !"
