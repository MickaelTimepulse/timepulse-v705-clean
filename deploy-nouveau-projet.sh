#!/bin/bash

echo "🚀 Création d'un nouveau projet Vercel PROPRE"
echo ""

# Nettoyer tous les caches
echo "🧹 Nettoyage complet..."
rm -rf .vercel .next .turbo out .cache dist node_modules/.cache node_modules/.vite .vite .vite-cache

# Build propre
echo "🔨 Build propre..."
npm run build

echo ""
echo "📝 Maintenant, nous allons créer un NOUVEAU projet Vercel"
echo ""
echo "Exécutez cette commande pour créer un nouveau projet:"
echo ""
echo "  vercel --name timepulse-v2-clean --prod --yes"
echo ""
echo "Cela va:"
echo "  1. Créer un nouveau projet sans cache corrompu"
echo "  2. Demander vos infos de déploiement"
echo "  3. Déployer immédiatement"
echo ""
echo "⚠️  IMPORTANT: Après le déploiement, copiez les variables d'environnement depuis l'ancien projet:"
echo ""
echo "Variables à copier:"
echo "  - VITE_SUPABASE_URL"
echo "  - VITE_SUPABASE_ANON_KEY"
echo "  - Toutes les autres variables de .env"
echo ""
