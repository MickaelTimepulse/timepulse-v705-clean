#!/bin/bash
echo "🧹 Nettoyage complet avant déploiement..."

# Supprimer tous les caches
rm -rf .vercel .next .turbo out .cache dist node_modules/.cache node_modules/.vite .vite .vite-cache

# Rebuild propre
echo "🔨 Build propre..."
npm run build

# Déployer avec force clean
echo "🚀 Déploiement avec cache vidé..."
vercel --prod --yes --force

echo "✅ Déploiement terminé !"
