#!/bin/bash

echo "🔍 Vérification de la compatibilité Vercel..."
echo ""

# Compteur d'erreurs
ERRORS=0

# Vérifier les fichiers avec espaces
echo "1️⃣ Recherche de fichiers avec espaces..."
FILES_WITH_SPACES=$(find . -type f -name "* *" ! -path "*/node_modules/*" ! -path "*/.git/*" ! -name "*.md" ! -name "*.txt" ! -name "*.js" ! -name "*.ts" ! -name "*.tsx" ! -name "*.json" 2>/dev/null)

if [ -n "$FILES_WITH_SPACES" ]; then
  echo "❌ ERREUR: Fichiers avec espaces détectés:"
  echo "$FILES_WITH_SPACES"
  ERRORS=$((ERRORS+1))
else
  echo "✅ Aucun fichier avec espaces"
fi

echo ""

# Vérifier les fichiers avec accents
echo "2️⃣ Recherche de fichiers avec accents..."
FILES_WITH_ACCENTS=$(find . -type f -name "*[àâäéèêëïîôùûüÿçÀÂÄÉÈÊËÏÎÔÙÛÜŸÇ]*" ! -path "*/node_modules/*" ! -path "*/.git/*" ! -name "*.md" ! -name "*.txt" ! -name "*.js" ! -name "*.ts" ! -name "*.tsx" ! -name "*.json" 2>/dev/null)

if [ -n "$FILES_WITH_ACCENTS" ]; then
  echo "❌ ERREUR: Fichiers avec accents détectés:"
  echo "$FILES_WITH_ACCENTS"
  ERRORS=$((ERRORS+1))
else
  echo "✅ Aucun fichier avec accents"
fi

echo ""

# Vérifier que le build fonctionne
echo "3️⃣ Test de build..."
if npm run build > /dev/null 2>&1; then
  echo "✅ Build réussi"
else
  echo "❌ ERREUR: Le build a échoué"
  ERRORS=$((ERRORS+1))
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Résultat final
if [ $ERRORS -eq 0 ]; then
  echo "✅ SUCCÈS: Le projet est compatible Vercel !"
  echo "🚀 Vous pouvez déployer en toute sécurité"
  exit 0
else
  echo "❌ ÉCHEC: $ERRORS erreur(s) détectée(s)"
  echo "⚠️  Corrigez les problèmes avant de déployer"
  exit 1
fi
